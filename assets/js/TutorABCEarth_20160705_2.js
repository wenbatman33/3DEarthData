var d = new Date();
var n = d.getHours();
var brandsColor={"vip":0xd10f17,"abc":0x0b63ff,"ming":0xff6788,"jr":0x8fc220};
var brandsPointColor={"vip":'#d10f17',"abc":'#0b63ff',"ming":'#ff6788',"jr":'#8fc220'};
var imgUrl='assets/img/earth_'+n+'.png';
var earthLights = THREE.ImageUtils.loadTexture(imgUrl),
    earthBump = THREE.ImageUtils.loadTexture('assets/img/earth-bump.jpg'),
    el = document.getElementById('container'),
    lines = [],
    mouse = {x: 0,y: 0},
    mouseOnDown = {x: 0, y: 0},
    rotation = {x: 0,y: Math.PI / 6},
    target = {x: 0,y: Math.PI / 6},
    targetOnDown = {x: 0,y: 0},
    distance =500,
    PI_HALF = Math.PI / 2,
    pointRadius=152,
    radius = 150,
    w = window.innerWidth;
    h = window.innerHeight;
    camera = new THREE.PerspectiveCamera(distance / 10, w / h, 1, distance * 2)
    scene = new THREE.Scene(),
    renderer = new THREE.WebGLRenderer(),
    center = new THREE.Vector3(0, 0, 0),
    geometry = new THREE.SphereGeometry(radius, 40, 40);
//燈光
var earthGeometry = new THREE.SphereGeometry(radius, 40, 40);
var earthMaterial = new THREE.MeshPhongMaterial({
  bumpMap: earthBump,
  bumpScale: 4,
  emissiveMap: earthLights,
  emissive: '#ffffff',
  map: earthLights,
  specular: '#ffffff'
});
var shaders = {
  'atmosphere': {
    uniforms: {},
    vertexShader: ['varying vec3 vNormal;', 'void main() {', 'vNormal = normalize( normalMatrix * normal );', 'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );', '}'].join('\n'),
    fragmentShader: ['varying vec3 vNormal;', 'void main() {', 'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 3.0 );', 'gl_FragColor = vec4( 20,20, 20, 0.06 ) * intensity;', '}'].join('\n')
  }
};
var atmosphereMaterial = new THREE.ShaderMaterial({
  vertexShader: shaders['atmosphere'].vertexShader,
  fragmentShader: shaders['atmosphere'].fragmentShader,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true
});
var atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial);
atmosphere.scale.set(1.5,1.5,1.5);
//地球
var sphere = new THREE.Mesh(geometry, earthMaterial);
var starGeometry = new THREE.Geometry();
for (var i = 0; i < 3000; i++) {
  var x = -1 + Math.random() * 2;
  var y = -1 + Math.random() * 2;
  var z = -1 + Math.random() * 2;
  var d = -1 / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
  x *= d;
  y *= d;
  z *= d;
  var vertex = new THREE.Vector3(x * distance, y * distance, z * distance);
  starGeometry.vertices.push(vertex);
}
var stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
  color: '#333333',
  size: 1
}));
var restTimer,timer;
var gapx,gapy;
var onTouch=false;
function init() {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  renderer.autoClear = true;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Composer 效果
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  // var effectBloom = new THREE.BloomPass(1);
  var effectFilm = new THREE.FilmPass(0.1, 0.1, 2048, 0);
  var effectShift = new THREE.ShaderPass(THREE.RGBShiftShader);
  effectShift.uniforms['amount'].value = 0.0005;
  effectShift.renderToScreen = true;
  composer.addPass(effectFilm);
  // composer.addPass(effectShift);
  el.appendChild(renderer.domElement);

  var numPoints = 100;
  scene.add(sphere);
  scene.add(atmosphere);
  scene.add(camera);
  camera.position.z = 5;
  el.addEventListener('mousedown', onMouseDown, false);
  el.addEventListener('touchstart', onTouchStart, false);
  window.addEventListener('resize', onWindowResize, false);
  wheel(wheelUp, wheelDown);
  render();
}
// -------------------------------------
//   觸碰控制項
// -------------------------------------
function onTouchStart(event) {
  event.preventDefault();
  //alert("onTouchstart");
  el.addEventListener('touchmove', onTouchMove, false);
  el.addEventListener('touchend', onTouchEnd, false);
  mouseOnDown.x = -event.changedTouches[0].clientX;
  mouseOnDown.y = event.changedTouches[0].clientY;
  targetOnDown.x = target.x;
  targetOnDown.y = target.y;
  onTouch=true;
  clearTimeout(timer);
  clearTimeout(restTimer);
}
function onTouchMove(event) {
  event.preventDefault();
  mouse.x = -event.changedTouches[0].clientX;
  mouse.y = event.changedTouches[0].clientY;
  target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005;
  target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005;
  target.y = target.y > PI_HALF ? PI_HALF : target.y;
  target.y = target.y < -PI_HALF ? -PI_HALF : target.y;
}
function onTouchEnd(event) {
  event.preventDefault();
  onTouch=false;
  // timer = setTimeout(lookatPoint, 1000);
}
// -------------------------------------
//   滑鼠控制項
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
  clearTimeout(timer);
  clearTimeout(restTimer);
}
function onMouseMove(event) {
  event.preventDefault();
  mouse.x = -event.clientX;
  mouse.y = event.clientY;
  target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005;
  target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005;
  target.y = target.y > PI_HALF ? PI_HALF : target.y;
  target.y = target.y < -PI_HALF ? -PI_HALF : target.y;
}
function onMouseUp(event) {
  event.preventDefault();
  el.removeEventListener('mousemove', onMouseMove, false);
  el.removeEventListener('mouseup', onMouseUp, false);
  el.removeEventListener('mouseout', onMouseOut, false);
  el.style.cursor = 'auto';
  // timer = setTimeout(lookatPoint, 1000);
}
function onMouseOut(event) {
  event.preventDefault();
  el.removeEventListener('mouseup', onMouseUp, false);
  el.removeEventListener('mouseout', onMouseOut, false);
}
// -------------------------------------
function onWindowResize(event) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function wheel(upFn, downFn) {
    window.onmousewheel = getWheelDalta;
    if (window.addEventListener) {
        window.addEventListener("DOMMouseScroll", getWheelDalta, false);
    }
    function getWheelDalta(event) {
        var event = event || window.event;
        var delta = 0;
        if (event.wheelDelta) {
            delta = event.wheelDelta / 120;
            if (window.opera) delta = -delta;
        } else if (event.detail) {
            delta = -event.detail / 3;
        }
        if (delta > 0) {
            upFn();
        } else {
            downFn();
        }
        prevent(event);

        function prevent(evt) {
            if (evt.preventDefault) {
                evt.preventDefault();
            } else {
                evt.returnValue = false;
            }
        }
    }
}
function wheelUp() {
  distance+=3;
  if(distance>=600){
    distance=600;
  }
}
function wheelDown() {
  distance-=3;
  if(distance<=240){
    distance=240;
  }
}

function render() {
  if (el.style.cursor != 'move' | onTouch==true){
    target.x += 0.005;
  }
  gapx=target.x-rotation.x;
  gapy=target.y-rotation.y;
  if(Math.abs(gapx)>10){
    gapx-=10;
  }
  rotation.x += gapx * 0.1;
  rotation.y += gapy * 0.1;
  camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
  camera.position.y = distance * Math.sin(rotation.y);
  camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);
  camera.lookAt(center);
  renderer.render(scene, camera);
  composer.render();
  requestAnimationFrame(render);
}
function _toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
function _toDegrees(radians) {
  return radians * 180 / Math.PI;
}
init();
animate();
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
function lookatPoint() {
  point.position.set(points[currentNum].position.x, points[currentNum].position.y, points[currentNum].position.z);
  point.material.color.setHex(0xffa200);
  point.material.opacity=0.7;
  point.scale.x = 2.5; // SCALE
  point.scale.y = 2.5; // SCALE
  point.scale.z = 2.5; // SCALE
  target.x=Number(1.2+(data[currentNum].lon* Math.PI / 180));
  target.y=Number((data[currentNum].la* Math.PI / 180));
  // // // // // //
  // $("#city").yugopEff(data[currentNum].city, 20);
  // $("#fname").yugopEff(data[currentNum].fname, 30);
  currentNum+=1;
  if(currentNum>=totalNum){
    currentNum=0;
  }
  restTimer = setTimeout(resetPoint, 5000);
  // setTimeout(resetPoint, 5000);
}
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
var API_point = "___data/consultant_point.json";
var API_line = "___data/consultantLine.json";
// var API = "___data/consultantLine.json";
// var API = "http://www.tutorabc.com/aspx/GTRWebService/DataRequest.aspx?dataquery=client_attend_list_s&rnd=78";
var points_data =[];
var points = [];
var customerPoints = [];
var lines_data =[];
var lines = [];
var geometry_1;
var geometry_2;
var curveObject;
var curveObject2;
var currentNum = 0;
var totalNum;
$.getJSON( API_point, {}).done(function( JSONdata ) {
  points_data = JSONdata;
  loop();
  drawLine();
});
function drawLine() {
  $.getJSON( API_line, {}).done(function( JSON_line_data ) {
    lines_data = JSON_line_data;
    line_loop();
  });
}
var _loop = function (i) {
  points.push(new setPoint(points_data[i].la, points_data[i].lon,1, i ));
};

var _lines_loop = function (i) {
  lines.push(new setCustomerPoint(lines_data[i].la, lines_data[i].lon,1, i ));
  var tempPoint= findPoint(lines_data[i].con);



  if(tempPoint){
    var newLine = drawCurve( lines[i].position, tempPoint.position ,i,lines_data[i].type);
    point.position.set(lines[i].position.x, lines[i].position.y, lines[i].position.z);
    scene.add(point);
    new TWEEN.Tween(newLine).to({
      currentPoint: 200
    }, 1500).delay(i * 100 ).easing(TWEEN.Easing.Cubic.Out).onUpdate(function () {
      newLine.geometry.setDrawRange(0, newLine.currentPoint);
    }).start();
  }
};
function findPoint(temp) {
  for (var j=0; j<lines_data.length; j++) {
    if(temp == points_data[j].id){
      var consultantPoint=setPoint(lines_data[j].la,lines_data[j].lon ,6 ,j);
      return consultantPoint;
    }
  }
}
function loop() {
  if(points_data.length>500){
    var totalNum=500;
  }else{
    var totalNum=points_data.length;
  }
  for (var i = 0; i < totalNum; i++) {
    _loop(i);
    point.position.set(points[i].position.x, points[i].position.y, points[i].position.z);
    scene.add(point);
  }
}
function line_loop() {
  for (var i = 0; i <lines_data.length; i++) {
    _lines_loop(i);
  }
}
/////////////////////////////////////////
function latLongToVector3(lat, lon, r) {
  var phi = lat * Math.PI / 180;
  var theta = (lon - 180) * Math.PI / 180;
  var x = -r * Math.cos(phi) * Math.cos(theta);
  var y = r * Math.sin(phi);
  var z = r * Math.cos(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

function setPoint(lat, lng, r, i) {
  var position = latLongToVector3(lat, lng, radius);
  var pointGeometry = new THREE.SphereGeometry(r, 20, 20);
  var pointMaterial = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    opacity: .5,
    side: THREE.DoubleSide,
    transparent: true
  });
  point = new THREE.Mesh(pointGeometry, pointMaterial);
  point.position.set(position.x, position.y, position.z);
  point.scale.set(1,1,1);
  return point;
}

function setCustomerPoint(lat, lng, r, i) {
  var position = latLongToVector3(lat, lng, radius);
  var pointGeometry = new THREE.SphereGeometry(r, 20, 20);
  var pointMaterial = new THREE.MeshBasicMaterial({
    color: '#ff9900',
    opacity: .5,
    side: THREE.DoubleSide,
    transparent: true
  });
  point = new THREE.Mesh(pointGeometry, pointMaterial);
  point.position.set(position.x, position.y, position.z);
  point.scale.set(1,1,1);
  return point;
}

function resetPoint() {
  $("#city").html('');
  $("#fname").html('');
  // timer = setTimeout(lookatPoint, 1000);
  // setTimeout(lookatPoint, 1000);
}
function transformNum(num) {
  var TN;
  TN=(num%18.5);
  return TN ;
}
function drawCurve(a, b, i ,type) {
  var distance = a.clone().sub(b).length();
  var mid = a.clone().lerp(b, 0.5);
  var midLength = mid.length();
  var lineColor;
  mid.normalize();
  mid.multiplyScalar(midLength + distance * 0.4);
  var normal = new THREE.Vector3().subVectors(a, b);
  normal.normalize();
  var midStart = mid.clone().add(normal.clone().multiplyScalar(distance * 0.4));
  var midEnd = mid.clone().add(normal.clone().multiplyScalar(distance * -0.4));
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
  if(type == "vip"){
    lineColor=brandsColor.vip;
  }else if(type=="abc"){
    lineColor=brandsColor.abc;
  }else if(type=="ming"){
    lineColor=brandsColor.ming;
  }else if(type=="jr"){
    lineColor=brandsColor.jr;
  }else{
    lineColor=0xffffff;
  }
  var lineMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(lineColor),
    linewidth: 3,
    opacity: 0.9,
    transparent: true
  });
  var line = new THREE.Line(lineGeometry, lineMaterial);
  line.currentPoint = 0;
  scene.add(line);
  return line;
}
$("#Asia").click(function(){  goto('Asia');});
$("#NorthAmerica").click(function(){  goto('NorthAmerica');});
$("#SouthAmerica").click(function(){  goto('SouthAmerica');});
$("#Europe").click(function(){  goto('Europe');});
$("#Australia").click(function(){  goto('Australia');});
function goto(area) {
  if(area=='Asia'){
    target.x= -2.8;
    target.y= 0.63;
  }else if(area=='NorthAmerica'){
    target.x= 0.030;
    target.y= 0.52;
  }else if(area=='SouthAmerica'){
    target.x=0.61;
    target.y=-0.375;
  }else if(area=='Europe'){
    target.x= -4.5;
    target.y=0.73;
  }else if(area=='Australia'){
    target.x=-2.4;
    target.y=-0.375;
  }
}
function animate(time) {
  // render();
  TWEEN.update(time);
  requestAnimationFrame(animate);
}
