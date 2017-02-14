var container = document.getElementById('container');
var data =[];
var API = "assets/js/consultant_info.js";
var planet;
$.getJSON( API, {}).done(function( JSONdata ){
  data = JSONdata;
});
/////////////////////////////////////////////
var runTime=2000;
var delayTime=500;
var delayTime2=500;
/////////////////////////////////////////////
var container;
var camera = undefined,
    scene = undefined,
    renderer = undefined,
    composer = undefined,
    w = undefined,
    h = undefined,
    alpha = undefined,
    beta = undefined,
    gamma=undefined;
/////////////////////////////////////////////
var center = new THREE.Vector3(0, 0, 0),
    clock = new THREE.Clock(),
    distance = 400,
    PI_HALF = Math.PI / 2,
    pointRadius = 152,
    radius = 120;
/////////////////////////////////////////////
var lines = [],
    mouse = {x: 0,y: 0},
    mouseOnDown = {x: 0,y: 0},
    points = [],
    rotation = {x: Math.PI * 2.5,y: Math.PI / 6},
    target = {x: Math.PI * 3,y: Math.PI / 6},
    targetOnDown = {x: 0,y: 0};
/////////////////////////////////////////////
var center = new THREE.Vector3(0, 0, 0),
    clock = new THREE.Clock(),
    distance = 400,
    PI_HALF = Math.PI / 2,
    pointRadius = 152,
    radius = 120;
/////////////////////////////////////////////
var shaders = {
  'atmosphere': {
    uniforms: {},
    vertexShader: ['varying vec3 vNormal;', 'void main() {', 'vNormal = normalize( normalMatrix * normal );', 'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );', '}'].join('\n'),
    fragmentShader: ['varying vec3 vNormal;', 'void main() {', 'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 3.0 );', 'gl_FragColor = vec4( 0.3, 0.4, 0.6, 0.05 ) * intensity;', '}'].join('\n')
  }
};
/////////////////////////////////////////////
var Earth = function Earth(el, data) {
  animate();
  this.animate = animate;
  return this;
};
/////////////////////////////////////////////
var starGeometry;
var vertex;
var light = new THREE.PointLight('#ffffff', 0.5);
/////////////////////////////////////////////
var earthLights = THREE.ImageUtils.loadTexture('../img/earth-lights.jpg');
    var earthBump = THREE.ImageUtils.loadTexture('../img/earth-bump.jpg');
    earthLights.minFilter = THREE.LinearFilter;
    earthBump.minFilter = THREE.LinearFilter;
/////////////////////////////////////////////
var earthGeometry = new THREE.SphereGeometry(radius, 50, 30);
    var earthMaterial = new THREE.MeshPhongMaterial({
      bumpMap: earthBump,
      bumpScale: 4,
      emissiveMap: earthLights,
      emissive: '#333333',
      map: earthLights,
      specular: '#010101'
    });
/////////////////////////////////////////////
var earth = new THREE.Mesh(earthGeometry, earthMaterial);
/////////////////////////////////////////////
// Atmosphere 大氣層
var atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: shaders['atmosphere'].vertexShader,
    fragmentShader: shaders['atmosphere'].fragmentShader,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});
var atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial);
atmosphere.scale.set(1.3, 1.3, 1.3);
/////////////////////////////////////////////
var effectBloom = new THREE.BloomPass(1.75);
var effectFilm = new THREE.FilmPass(0.1, 0.5, 2048, 0);
var effectShift = new THREE.ShaderPass(THREE.RGBShiftShader);
/////////////////////////////////////////////
function init() {
  w = window.innerWidth;
  h = window.innerHeight;
  camera = new THREE.PerspectiveCamera(distance / 10, w / h, 1, distance * 2);
  scene = new THREE.Scene();
  scene.add(camera);
  starGeometry = new THREE.Geometry();
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  renderer.autoClear = false;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);
  //
  camera.add(light);
  light.position.set(distance / 2, distance / 2, 0);
  light.target = camera;
  //
  // Composer 電視播放效果
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  //
  effectShift.uniforms['amount'].value = 0.001;
  effectShift.renderToScreen = true;
  //
  composer.addPass(effectBloom);
  composer.addPass(effectFilm);
  for (var i = 0; i < 1000; i++) {
    var x = -1 + Math.random() * 2;
    var y = -1 + Math.random() * 2;
    var z = -1 + Math.random() * 2;
    var d = 1 / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
    x *= d;
    y *= d;
    z *= d;
    vertex = new THREE.Vector3(x * distance, y * distance, z * distance);
    starGeometry.vertices.push(vertex);
  }
}
// -------------------------------------
//   Render
// -------------------------------------
function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
init();

//animate();