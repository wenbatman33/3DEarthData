var API_point = "___data/consultant_point.json";
var API_line = "___data/consultantLine.json";
var d = new Date();
var n = d.getHours();
var brandsColor={"vip":0xf3ab3d,"abc":0x449bcb,"ming":0x8d1a11,"jr":0x99bf3c,"vjr":0xd153f8};
var brandsPointColor={"vip":'#f3ab3d',"abc":'#81dff4',"ming":'#d63422',"jr":'#def073',"vjr":"0xf598fe"};

var rotationNum=0.01;
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
    distance =520,
    PI_HALF = Math.PI / 2,
    pointRadius=152,
    radius = 150,
    w = window.innerWidth;
    h = window.innerHeight;
    camera = new THREE.PerspectiveCamera(distance / 10, w / h, 1, distance * 2)
    scene = new THREE.Scene(),
    renderer = new THREE.WebGLRenderer(),
    center = new THREE.Vector3(0, 30, 0),
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
    target.x += rotationNum;
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
///
///             載入api區域
///
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
var points = [];
var customer_points = [];

var points_data =[];

var ConsultantPointsData =[];
var save_points_data =[];

var customer_data =[];
var save_customer_data =[];

var lines_data =[];
var lines = [];
var totalNum;
$.getJSON( API_point, {}).done(function( JSONdata ) {
  ConsultantPointsData = JSONdata;
  setConsultantPoint();
});

function setConsultantPoint() {
  for (var i = 0; i < ConsultantPointsData.length; i++) {
    //比對資料是否重複
    var dataSame=false;

    for (var j = 0; j< save_points_data.length ; j++) {
      if(ConsultantPointsData[i].city==save_points_data[j].city){
        dataSame=true;
      }
    }
    if(dataSame==false){
      //若資料不重複 push至 save_points_data
      save_points_data.push(ConsultantPointsData[i]);
    }
  }
  for (var j = 0; j< save_points_data.length ; j++) {
    points.push(new setPoint(save_points_data[j].la, save_points_data[j].lon,2, j ,"#ffffff"));
    point.position.set(points[j].position.x, points[j].position.y, points[j].position.z);
    scene.add(point);
  }
  customerPoint();
}


function customerPoint() {
  $.getJSON( API_line, {}).done(function( JSON_customer_data ) {
    customer_data = JSON_customer_data;
    setCustomerPoint();
  });
}
function setCustomerPoint() {
  for (var i = 0; i < customer_data.length; i++) {
    //比對資料是否重複
    var dataSame=false;

    for (var j = 0; j< save_customer_data.length ; j++) {
      if(customer_data[i].city==save_customer_data[j].city){
        dataSame=true;
      }
    }
    if(dataSame==false){
      //若資料不重複 push至 save_customer_data
      save_customer_data.push(customer_data[i]);
    }
  }
  for (var j = 0; j< save_customer_data.length ; j++) {
    var pointColor;
    if(save_customer_data[j].type=="vip"){
      pointColor=brandsPointColor.vip;
    } else if(save_customer_data[j].type=="abc"){
      pointColor=brandsPointColor.abc;
    }else if(save_customer_data[j].type=="jr"){
      pointColor=brandsPointColor.jr;
    }else if(save_customer_data[j].type=="vjr"){
      pointColor=brandsPointColor.vjr;
    }else if(save_customer_data[j].type=="ming"){
      pointColor=brandsPointColor.ming;
    }else if(save_customer_data[j].type==undefined){
      pointColor="#ffffff"
    }
    customer_points.push(new setPoint(save_customer_data[j].la, save_customer_data[j].lon,2, j ,pointColor));
    point.position.set(customer_points[j].position.x, customer_points[j].position.y, customer_points[j].position.z);
    scene.add(point);
  }
  drawLine();
}
function drawLine() {
  var a_point;
  var b_point;
  var temp;
  var linesNum;
  var oo=0;
  linesNum =customer_data.length;
  for (var i = 0; i < linesNum; i++) {
    temp=findPoint(customer_data[i].con);
    a_point=latLongToVector3(customer_data[i].la,customer_data[i].lon,radius);
    if(temp){
      oo+=1;
      console.log(oo);
      b_point=latLongToVector3(temp.la,temp.lon,radius);
      drawLineing(a_point,b_point,oo,customer_data[i].type);
    }
  }
}
function drawLineing(a ,b,i,type) {
  var newLine;
  newLine = drawCurve(a,b,i,type);
  new TWEEN.Tween(newLine).to({
    currentPoint: 200
  },800).delay(i*300).easing(TWEEN.Easing.Cubic.Out).onUpdate(function () {
    newLine.geometry.setDrawRange(0, newLine.currentPoint);
  }).start();
}
function findPoint(con) {
  var finded_Point;
  for (var i = 0; i < ConsultantPointsData.length; i++) {
    if(con == ConsultantPointsData[i].id){
      return ConsultantPointsData[i];
    }
  }
}
/////////////////////////////////////////
function setPoint(lat, lng, r, i, pointColor) {
  var position = latLongToVector3(lat, lng, radius);
  var pointGeometry = new THREE.SphereGeometry(r, 20, 20);
  var pointMaterial = new THREE.MeshBasicMaterial({
    color: pointColor,
    opacity: .8,
    side: THREE.DoubleSide,
    transparent: true
  });
  point = new THREE.Mesh(pointGeometry, pointMaterial);
  point.position.set(position.x, position.y, position.z);
  point.scale.set(1,1,1);
  return point;
}

function latLongToVector3(lat, lon, r) {
  var phi = lat * Math.PI / 180;
  var theta = (lon - 180) * Math.PI / 180;
  var x = -r * Math.cos(phi) * Math.cos(theta);
  var y = r * Math.sin(phi);
  var z = r * Math.cos(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
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
  }else if(type=="vjr"){
    lineColor=brandsColor.vjr;
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
$("#World").click(function(){  goto('World');});
function goto(area) {
  if(area=='Asia'){
    target.x= -2.8;
    target.y= 0.63;
    rotationNum=0;
  }else if(area=='NorthAmerica'){
    target.x= 0.030;
    target.y= 0.52;
    rotationNum=0;
  }else if(area=='SouthAmerica'){
    target.x=0.61;
    target.y=-0.375;
    rotationNum=0;
  }else if(area=='Europe'){
    target.x= -4.5;
    target.y=0.73;
    rotationNum=0;
  }else if(area=='Australia'){
    target.x=-2.4;
    target.y=-0.375;
    rotationNum=0;
  }else if(area=='World'){
    rotationNum=0.005;
  }
}
function animate(time) {
  TWEEN.update(time);
  requestAnimationFrame(animate);
}
