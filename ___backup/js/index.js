'use strict';

var Earth = function Earth(el, data) {
  var camera = undefined,
      scene = undefined,
      renderer = undefined,
      composer = undefined,
      w = undefined,
      h = undefined;

  var lines = [],
      mouse = {
    x: 0,
    y: 0
  },
      mouseOnDown = {
    x: 0,
    y: 0
  },
      points = [],
      rotation = {
    x: Math.PI * 1.9,
    y: Math.PI / 6
  },
      target = {
    x: Math.PI * 1.9,
    y: Math.PI / 6
  },
      targetOnDown = {
    x: 0,
    y: 0
  };

  var center = new THREE.Vector3(0, 0, 0),
      clock = new THREE.Clock(),
      distance = 400,
      PI_HALF = Math.PI / 2,
      pointRadius = 152,
      radius = 150;

  // Shaders
  // https://github.com/dataarts/webgl-globe

  var shaders = {
    'atmosphere': {
      uniforms: {},
      vertexShader: ['varying vec3 vNormal;', 'void main() {', 'vNormal = normalize( normalMatrix * normal );', 'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );', '}'].join('\n'),
      fragmentShader: ['varying vec3 vNormal;', 'void main() {', 'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 3.0 );', 'gl_FragColor = vec4( 0.3, 0.4, 0.6, 0.05 ) * intensity;', '}'].join('\n')
    }
  };

  // -------------------------------------
  //   Init
  // -------------------------------------

  function init() {
    w = window.innerWidth;
    h = window.innerHeight;

    camera = new THREE.PerspectiveCamera(distance / 10, w / h, 1, distance * 2);
    scene = new THREE.Scene();
    scene.add(camera);

    // Stars
    // http://gielberkers.com/evenly-distribute-particles-shape-sphere-threejs/

    var starGeometry = new THREE.Geometry();

    for (var i = 0; i < 1000; i++) {
      var x = -1 + Math.random() * 2;
      var y = -1 + Math.random() * 2;
      var z = -1 + Math.random() * 2;
      var d = 1 / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
      x *= d;
      y *= d;
      z *= d;

      var vertex = new THREE.Vector3(x * distance, y * distance, z * distance);
      starGeometry.vertices.push(vertex);
    }

    var stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
      color: '#333333',
      size: 3
    }));
    scene.add(stars);

    // Light

    var light = new THREE.PointLight('#ffffff', 0.5);
    camera.add(light);
    light.position.set(distance / 2, distance / 2, 0);
    light.target = camera;

    // Earth

    THREE.ImageUtils.crossOrigin = '';
    var earthLights = THREE.ImageUtils.loadTexture('img/earth-lights.jpg');
    var earthBump = THREE.ImageUtils.loadTexture('img/earth-bump.jpg');
    earthLights.minFilter = THREE.LinearFilter;
    earthBump.minFilter = THREE.LinearFilter;

    var earthGeometry = new THREE.SphereGeometry(radius, 50, 30);
    var earthMaterial = new THREE.MeshPhongMaterial({
      bumpMap: earthBump,
      bumpScale: 4,
      emissiveMap: earthLights,
      emissive: '#333333',
      map: earthLights,
      specular: '#010101'
    });

    var earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Atmosphere

    var atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: shaders['atmosphere'].vertexShader,
      fragmentShader: shaders['atmosphere'].fragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    var atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial);
    atmosphere.scale.set(1.3, 1.3, 1.3);
    scene.add(atmosphere);

    // Points

    var _loop = function (i) {
      points.push(new point(data[i].lat, data[i].long, data[i].r, i));

      var newLine = drawCurve(points[0].position, points[i].position);

      new TWEEN.Tween(newLine).to({
        currentPoint: 200
      }, 2000).delay(i * 350 + 1500).easing(TWEEN.Easing.Cubic.Out).onUpdate(function () {
        newLine.geometry.setDrawRange(0, newLine.currentPoint);
      }).start();
    };

    for (var i = 0; i < data.length; i++) {
      _loop(i);
    }

    // Renderer

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);

    // Composer

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));

    var effectBloom = new THREE.BloomPass(1.75);
    var effectFilm = new THREE.FilmPass(0.25, 0.5, 2048, 0);
    var effectShift = new THREE.ShaderPass(THREE.RGBShiftShader);

    effectShift.uniforms['amount'].value = 0.001;
    effectShift.renderToScreen = true;

    composer.addPass(effectBloom);
    composer.addPass(effectFilm);
    composer.addPass(effectShift);

    // Events

    el.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('resize', onWindowResize, false);

    // DOM

    el.appendChild(renderer.domElement);
  }

  // -------------------------------------
  //   Lat + Long to Vector
  // -------------------------------------

  function latLongToVector3(lat, lon, r) {
    // http://www.smartjava.org/content/render-open-data-3d-world-globe-threejs

    var phi = lat * Math.PI / 180;
    var theta = (lon - 180) * Math.PI / 180;

    var x = -r * Math.cos(phi) * Math.cos(theta);
    var y = r * Math.sin(phi);
    var z = r * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }

  // -------------------------------------
  //   Interactivity
  // -------------------------------------

  function onMouseDown(event) {
    event.preventDefault();

    el.addEventListener('mouseup', onMouseUp, false);
    el.addEventListener('mousemove', onMouseMove, false);
    el.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = -event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    el.style.cursor = 'move';
  }

  function onMouseMove(event) {
    mouse.x = -event.clientX;
    mouse.y = event.clientY;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < -PI_HALF ? -PI_HALF : target.y;
  }

  function onMouseUp(event) {
    el.removeEventListener('mousemove', onMouseMove, false);
    el.removeEventListener('mouseup', onMouseUp, false);
    el.removeEventListener('mouseout', onMouseOut, false);
    el.style.cursor = 'auto';
  }

  function onMouseOut(event) {
    el.removeEventListener('mouseup', onMouseUp, false);
    el.removeEventListener('mouseout', onMouseOut, false);
  }

  function onWindowResize(event) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // -------------------------------------
  //   Animate
  // -------------------------------------

  function animate(time) {
    render();
    TWEEN.update(time);
    requestAnimationFrame(animate);
  }

  // -------------------------------------
  //   Render
  // -------------------------------------

  function render() {
    if (el.style.cursor != 'move') target.x += 0.00075;

    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

    camera.lookAt(center);
    renderer.render(scene, camera);
    composer.render();
  }

  // -------------------------------------
  //   Point
  // -------------------------------------

  function point(lat, lng, r, i) {
    var position = latLongToVector3(lat, lng, radius);

    var pointGeometry = new THREE.SphereGeometry(r, 32, 32);
    var pointMaterial = new THREE.MeshBasicMaterial({
      color: '#ff3600',
      opacity: 0.6,
      side: THREE.DoubleSide,
      transparent: true
    });

    var point = new THREE.Mesh(pointGeometry, pointMaterial);
    point.position.set(position.x, position.y, position.z);
    point.scale.set(0.01, 0.01, 0.01);
    point.lookAt(center);
    scene.add(point);

    new TWEEN.Tween(point.scale).to({
      x: 1,
      y: 1,
      z: 1
    }, 1000).delay(i * 350 + 1500).easing(TWEEN.Easing.Cubic.Out).start();

    var pointRingGeometry = new THREE.RingGeometry(r + 0.5, r + 1.5, 32);
    var pointRingMaterial = new THREE.MeshBasicMaterial({
      color: '#ff3600',
      opacity: 0.2,
      side: THREE.DoubleSide,
      transparent: true
    });

    var pointRing = new THREE.Mesh(pointRingGeometry, pointRingMaterial);
    pointRing.position.set(position.x, position.y, position.z);
    pointRing.scale.set(0.01, 0.01, 0.01);
    pointRing.lookAt(center);
    scene.add(pointRing);

    new TWEEN.Tween(pointRing.scale).to({
      x: 1,
      y: 1,
      z: 1
    }, 1500).delay(i * 350 + 1500).easing(TWEEN.Easing.Cubic.Out).start();

    return point;
  }

  // http://armsglobe.chromeexperiments.com/js/visualize_lines.js

  function drawCurve(a, b, i) {
    var distance = a.clone().sub(b).length();

    var mid = a.clone().lerp(b, 0.5);
    var midLength = mid.length();
    mid.normalize();
    mid.multiplyScalar(midLength + distance * 0.25);

    var normal = new THREE.Vector3().subVectors(a, b);
    normal.normalize();

    var midStart = mid.clone().add(normal.clone().multiplyScalar(distance * 0.25));
    var midEnd = mid.clone().add(normal.clone().multiplyScalar(distance * -0.25));

    var splineCurveA = new THREE.CubicBezierCurve3(a, a, midStart, mid);
    var splineCurveB = new THREE.CubicBezierCurve3(mid, midEnd, b, b);

    var points = splineCurveA.getPoints(100);
    points = points.splice(0, points.length - 1);
    points = points.concat(splineCurveB.getPoints(100));
    points.push(center);

    var lineGeometry = new THREE.BufferGeometry();
    var positions = new Float32Array(points.length * 3);
    for (var ii = 0; ii < points.length; ii++) {
      positions[ii * 3 + 0] = points[ii].x;
      positions[ii * 3 + 1] = points[ii].y;
      positions[ii * 3 + 2] = points[ii].z;
    }
    lineGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    lineGeometry.setDrawRange(0, 0);

    var lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(0xffffff),
      linewidth: 3,
      opacity: 0.25,
      transparent: true
    });

    var line = new THREE.Line(lineGeometry, lineMaterial);
    line.currentPoint = 0;

    scene.add(line);
    return line;
  }

  // -------------------------------------
  //   Start
  // -------------------------------------

  init();
  animate();

  this.animate = animate;
  return this;
};

var data = [{
  long: -81.173,
  lat: 28.4,
  r: 8
}, {
  long: -81.1,
  lat: 32.084,
  r: 3
}, {
  long: -74.006,
  lat: 40.713,
  r: 5
}, {
  long: -0.128,
  lat: 51.507,
  r: 2
}, {
  long: -87.63,
  lat: 41.878,
  r: 2
}, {
  long: -122.419,
  lat: 37.775,
  r: 2
}, {
  long: -90.199,
  lat: 38.627,
  r: 3
}, {
  long: -77.345,
  lat: 25.06,
  r: 5
}, {
  long: -117.783,
  lat: 33.542,
  r: 2
}, {
  long: -149.9,
  lat: 61.218,
  r: 2
}, {
  long: -123.121,
  lat: 49.283,
  r: 2
}, {
  long: 25.462,
  lat: 36.393,
  r: 2
}, {
  long: -122.676,
  lat: 45.523,
  r: 3
}, {
  long: -95.401,
  lat: 29.817,
  r: 2
}];

var container = document.getElementById('container');
var planet = new Earth(container, data);