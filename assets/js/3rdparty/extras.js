// Includes various shaders / postprocessing passes from the three.js examples
// Includes Tween.js

/**
 * @author alteredq / http://alteredqualia.com/
 */


THREE.ShaderPass = function ( shader, textureID ) {

  this.textureID = ( textureID !== undefined ) ? textureID : "tDiffuse";

  this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );

  this.material = new THREE.ShaderMaterial( {

    defines: shader.defines || {},
    uniforms: this.uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader

  } );

  this.renderToScreen = false;

  this.enabled = true;
  this.needsSwap = true;
  this.clear = false;


  this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
  this.scene  = new THREE.Scene();

  this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
  this.scene.add( this.quad );

};

THREE.ShaderPass.prototype = {

  render: function ( renderer, writeBuffer, readBuffer, delta ) {

    if ( this.uniforms[ this.textureID ] ) {

      this.uniforms[ this.textureID ].value = readBuffer;

    }

    this.quad.material = this.material;

    if ( this.renderToScreen ) {

      renderer.render( this.scene, this.camera );

    } else {

      renderer.render( this.scene, this.camera, writeBuffer, this.clear );

    }

  }

};
/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Convolution shader
 * ported from o3d sample to WebGL / GLSL
 * http://o3d.googlecode.com/svn/trunk/samples/convolution.html
 */


THREE.ConvolutionShader = {

  defines: {

    "KERNEL_SIZE_FLOAT": "25.0",
    "KERNEL_SIZE_INT": "25",

  },

  uniforms: {

    "tDiffuse":        { type: "t", value: null },
    "uImageIncrement": { type: "v2", value: new THREE.Vector2( 0.001953125, 0.0 ) },
    "cKernel":         { type: "fv1", value: [] }

  },

  vertexShader: [

    "uniform vec2 uImageIncrement;",

    "varying vec2 vUv;",

    "void main() {",

      "vUv = uv - ( ( KERNEL_SIZE_FLOAT - 1.0 ) / 2.0 ) * uImageIncrement;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

    "}"

  ].join( "\n" ),

  fragmentShader: [

    "uniform float cKernel[ KERNEL_SIZE_INT ];",

    "uniform sampler2D tDiffuse;",
    "uniform vec2 uImageIncrement;",

    "varying vec2 vUv;",

    "void main() {",

      "vec2 imageCoord = vUv;",
      "vec4 sum = vec4( 0.0, 0.0, 0.0, 0.0 );",

      "for( int i = 0; i < KERNEL_SIZE_INT; i ++ ) {",

        "sum += texture2D( tDiffuse, imageCoord ) * cKernel[ i ];",
        "imageCoord += uImageIncrement;",

      "}",

      "gl_FragColor = sum;",

    "}"


  ].join( "\n" ),

  buildKernel: function ( sigma ) {

    // We lop off the sqrt(2 * pi) * sigma term, since we're going to normalize anyway.

    function gauss( x, sigma ) {

      return Math.exp( - ( x * x ) / ( 2.0 * sigma * sigma ) );

    }

    var i, values, sum, halfWidth, kMaxKernelSize = 25, kernelSize = 2 * Math.ceil( sigma * 3.0 ) + 1;

    if ( kernelSize > kMaxKernelSize ) kernelSize = kMaxKernelSize;
    halfWidth = ( kernelSize - 1 ) * 0.5;

    values = new Array( kernelSize );
    sum = 0.0;
    for ( i = 0; i < kernelSize; ++ i ) {

      values[ i ] = gauss( i - halfWidth, sigma );
      sum += values[ i ];

    }

    // normalize the kernel

    for ( i = 0; i < kernelSize; ++ i ) values[ i ] /= sum;

    return values;

  }

};
/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Full-screen textured quad shader
 */


THREE.CopyShader = {

  uniforms: {

    "tDiffuse": { type: "t", value: null },
    "opacity":  { type: "f", value: 1.0 }

  },

  vertexShader: [

    "varying vec2 vUv;",

    "void main() {",

      "vUv = uv;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

    "}"

  ].join( "\n" ),

  fragmentShader: [

    "uniform float opacity;",

    "uniform sampler2D tDiffuse;",

    "varying vec2 vUv;",

    "void main() {",

      "vec4 texel = texture2D( tDiffuse, vUv );",
      "gl_FragColor = opacity * texel;",

    "}"

  ].join( "\n" )

};
/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Film grain & scanlines shader
 *
 * - ported from HLSL to WebGL / GLSL
 * http://www.truevision3d.com/forums/showcase/staticnoise_colorblackwhite_scanline_shaders-t18698.0.html
 *
 * Screen Space Static Postprocessor
 *
 * Produces an analogue noise overlay similar to a film grain / TV static
 *
 * Original implementation and noise algorithm
 * Pat 'Hawthorne' Shearon
 *
 * Optimized scanlines + noise version with intensity scaling
 * Georg 'Leviathan' Steinrohder
 *
 * This version is provided under a Creative Commons Attribution 3.0 License
 * http://creativecommons.org/licenses/by/3.0/
 */


THREE.FilmShader = {

  uniforms: {

    "tDiffuse":   { type: "t", value: null },
    "time":       { type: "f", value: 0.0 },
    "nIntensity": { type: "f", value: 0.5 },
    "sIntensity": { type: "f", value: 0.05 },
    "sCount":     { type: "f", value: 4096 },
    "grayscale":  { type: "i", value: 1 }

  },

  vertexShader: [

    "varying vec2 vUv;",

    "void main() {",

      "vUv = uv;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

    "}"

  ].join( "\n" ),

  fragmentShader: [

    // control parameter
    "uniform float time;",

    "uniform bool grayscale;",

    // noise effect intensity value (0 = no effect, 1 = full effect)
    "uniform float nIntensity;",

    // scanlines effect intensity value (0 = no effect, 1 = full effect)
    "uniform float sIntensity;",

    // scanlines effect count value (0 = no effect, 4096 = full effect)
    "uniform float sCount;",

    "uniform sampler2D tDiffuse;",

    "varying vec2 vUv;",

    "void main() {",

      // sample the source
      "vec4 cTextureScreen = texture2D( tDiffuse, vUv );",

      // make some noise
      "float x = vUv.x * vUv.y * time *  1000.0;",
      "x = mod( x, 13.0 ) * mod( x, 123.0 );",
      "float dx = mod( x, 0.01 );",

      // add noise
      "vec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp( 0.1 + dx * 100.0, 0.0, 1.0 );",

      // get us a sine and cosine
      "vec2 sc = vec2( sin( vUv.y * sCount ), cos( vUv.y * sCount ) );",

      // add scanlines
      "cResult += cTextureScreen.rgb * vec3( sc.x, sc.y, sc.x ) * sIntensity;",

      // interpolate between source and result by intensity
      "cResult = cTextureScreen.rgb + clamp( nIntensity, 0.0,1.0 ) * ( cResult - cTextureScreen.rgb );",

      // convert to grayscale if desired
      "if( grayscale ) {",

        "cResult = vec3( cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11 );",

      "}",

      "gl_FragColor =  vec4( cResult, cTextureScreen.a );",

    "}"

  ].join( "\n" )

};
/**
 * @author felixturner / http://airtight.cc/
 *
 * RGB Shift Shader
 * Shifts red and blue channels from center in opposite directions
 * Ported from http://kriss.cx/tom/2009/05/rgb-shift/
 * by Tom Butterworth / http://kriss.cx/tom/
 *
 * amount: shift distance (1 is width of input)
 * angle: shift angle in radians
 */


THREE.RGBShiftShader = {

  uniforms: {

    "tDiffuse": { type: "t", value: null },
    "amount":   { type: "f", value: 0.005 },
    "angle":    { type: "f", value: 0.0 }

  },

  vertexShader: [

    "varying vec2 vUv;",

    "void main() {",

      "vUv = uv;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

    "}"

  ].join( "\n" ),

  fragmentShader: [

    "uniform sampler2D tDiffuse;",
    "uniform float amount;",
    "uniform float angle;",

    "varying vec2 vUv;",

    "void main() {",

      "vec2 offset = amount * vec2( cos(angle), sin(angle));",
      "vec4 cr = texture2D(tDiffuse, vUv + offset);",
      "vec4 cga = texture2D(tDiffuse, vUv);",
      "vec4 cb = texture2D(tDiffuse, vUv - offset);",
      "gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);",

    "}"

  ].join( "\n" )

};

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.RenderPass = function ( scene, camera, overrideMaterial, clearColor, clearAlpha ) {

  this.scene = scene;
  this.camera = camera;

  this.overrideMaterial = overrideMaterial;

  this.clearColor = clearColor;
  this.clearAlpha = ( clearAlpha !== undefined ) ? clearAlpha : 1;

  this.oldClearColor = new THREE.Color();
  this.oldClearAlpha = 1;

  this.enabled = true;
  this.clear = true;
  this.needsSwap = false;

};

THREE.RenderPass.prototype = {

  render: function ( renderer, writeBuffer, readBuffer, delta ) {

    this.scene.overrideMaterial = this.overrideMaterial;

    if ( this.clearColor ) {

      this.oldClearColor.copy( renderer.getClearColor() );
      this.oldClearAlpha = renderer.getClearAlpha();

      renderer.setClearColor( this.clearColor, this.clearAlpha );

    }

    renderer.render( this.scene, this.camera, readBuffer, this.clear );

    if ( this.clearColor ) {

      renderer.setClearColor( this.oldClearColor, this.oldClearAlpha );

    }

    this.scene.overrideMaterial = null;

  }

};


THREE.BloomPass = function ( strength, kernelSize, sigma, resolution ) {

  strength = ( strength !== undefined ) ? strength : 1;
  kernelSize = ( kernelSize !== undefined ) ? kernelSize : 25;
  sigma = ( sigma !== undefined ) ? sigma : 4.0;
  resolution = ( resolution !== undefined ) ? resolution : 256;

  // render targets

  var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };

  this.renderTargetX = new THREE.WebGLRenderTarget( resolution, resolution, pars );
  this.renderTargetY = new THREE.WebGLRenderTarget( resolution, resolution, pars );

  // copy material

  if ( THREE.CopyShader === undefined )
    console.error( "THREE.BloomPass relies on THREE.CopyShader" );

  var copyShader = THREE.CopyShader;

  this.copyUniforms = THREE.UniformsUtils.clone( copyShader.uniforms );

  this.copyUniforms[ "opacity" ].value = strength;

  this.materialCopy = new THREE.ShaderMaterial( {

    uniforms: this.copyUniforms,
    vertexShader: copyShader.vertexShader,
    fragmentShader: copyShader.fragmentShader,
    blending: THREE.AdditiveBlending,
    transparent: true

  } );

  // convolution material

  if ( THREE.ConvolutionShader === undefined )
    console.error( "THREE.BloomPass relies on THREE.ConvolutionShader" );

  var convolutionShader = THREE.ConvolutionShader;

  this.convolutionUniforms = THREE.UniformsUtils.clone( convolutionShader.uniforms );

  this.convolutionUniforms[ "uImageIncrement" ].value = THREE.BloomPass.blurX;
  this.convolutionUniforms[ "cKernel" ].value = THREE.ConvolutionShader.buildKernel( sigma );

  this.materialConvolution = new THREE.ShaderMaterial( {

    uniforms: this.convolutionUniforms,
    vertexShader:  convolutionShader.vertexShader,
    fragmentShader: convolutionShader.fragmentShader,
    defines: {
      "KERNEL_SIZE_FLOAT": kernelSize.toFixed( 1 ),
      "KERNEL_SIZE_INT": kernelSize.toFixed( 0 )
    }

  } );

  this.enabled = true;
  this.needsSwap = false;
  this.clear = false;


  this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
  this.scene  = new THREE.Scene();

  this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
  this.scene.add( this.quad );

};

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.MaskPass = function ( scene, camera ) {

  this.scene = scene;
  this.camera = camera;

  this.enabled = true;
  this.clear = true;
  this.needsSwap = false;

  this.inverse = false;

};

THREE.MaskPass.prototype = {

  render: function ( renderer, writeBuffer, readBuffer, delta ) {

    var context = renderer.context;

    // don't update color or depth

    context.colorMask( false, false, false, false );
    context.depthMask( false );

    // set up stencil

    var writeValue, clearValue;

    if ( this.inverse ) {

      writeValue = 0;
      clearValue = 1;

    } else {

      writeValue = 1;
      clearValue = 0;

    }

    context.enable( context.STENCIL_TEST );
    context.stencilOp( context.REPLACE, context.REPLACE, context.REPLACE );
    context.stencilFunc( context.ALWAYS, writeValue, 0xffffffff );
    context.clearStencil( clearValue );

    // draw into the stencil buffer

    renderer.render( this.scene, this.camera, readBuffer, this.clear );
    renderer.render( this.scene, this.camera, writeBuffer, this.clear );

    // re-enable update of color and depth

    context.colorMask( true, true, true, true );
    context.depthMask( true );

    // only render where stencil is set to 1

    context.stencilFunc( context.EQUAL, 1, 0xffffffff );  // draw if == 1
    context.stencilOp( context.KEEP, context.KEEP, context.KEEP );

  }

};


THREE.ClearMaskPass = function () {

  this.enabled = true;

};

THREE.ClearMaskPass.prototype = {

  render: function ( renderer, writeBuffer, readBuffer, delta ) {

    var context = renderer.context;

    context.disable( context.STENCIL_TEST );

  }

};


THREE.BloomPass.prototype = {

  render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

    if ( maskActive ) renderer.context.disable( renderer.context.STENCIL_TEST );

    // Render quad with blured scene into texture (convolution pass 1)

    this.quad.material = this.materialConvolution;

    this.convolutionUniforms[ "tDiffuse" ].value = readBuffer;
    this.convolutionUniforms[ "uImageIncrement" ].value = THREE.BloomPass.blurX;

    renderer.render( this.scene, this.camera, this.renderTargetX, true );


    // Render quad with blured scene into texture (convolution pass 2)

    this.convolutionUniforms[ "tDiffuse" ].value = this.renderTargetX;
    this.convolutionUniforms[ "uImageIncrement" ].value = THREE.BloomPass.blurY;

    renderer.render( this.scene, this.camera, this.renderTargetY, true );

    // Render original scene with superimposed blur to texture

    this.quad.material = this.materialCopy;

    this.copyUniforms[ "tDiffuse" ].value = this.renderTargetY;

    if ( maskActive ) renderer.context.enable( renderer.context.STENCIL_TEST );

    renderer.render( this.scene, this.camera, readBuffer, this.clear );

  }

};

THREE.BloomPass.blurX = new THREE.Vector2( 0.001953125, 0.0 );
THREE.BloomPass.blurY = new THREE.Vector2( 0.0, 0.001953125 );
/**
 * @author alteredq / http://alteredqualia.com/
 */


THREE.EffectComposer = function ( renderer, renderTarget ) {

  this.renderer = renderer;

  if ( renderTarget === undefined ) {

    var pixelRatio = renderer.getPixelRatio();

    var width  = Math.floor( renderer.context.canvas.width  / pixelRatio ) || 1;
    var height = Math.floor( renderer.context.canvas.height / pixelRatio ) || 1;
    var parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };

    renderTarget = new THREE.WebGLRenderTarget( width, height, parameters );

  }

  this.renderTarget1 = renderTarget;
  this.renderTarget2 = renderTarget.clone();

  this.writeBuffer = this.renderTarget1;
  this.readBuffer = this.renderTarget2;

  this.passes = [];

  if ( THREE.CopyShader === undefined )
    console.error( "THREE.EffectComposer relies on THREE.CopyShader" );

  this.copyPass = new THREE.ShaderPass( THREE.CopyShader );

};

THREE.EffectComposer.prototype = {

  swapBuffers: function() {

    var tmp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = tmp;

  },

  addPass: function ( pass ) {

    this.passes.push( pass );

  },

  insertPass: function ( pass, index ) {

    this.passes.splice( index, 0, pass );

  },

  render: function ( delta ) {

    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;

    var maskActive = false;

    var pass, i, il = this.passes.length;

    for ( i = 0; i < il; i ++ ) {

      pass = this.passes[ i ];

      if ( ! pass.enabled ) continue;

      pass.render( this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive );

      if ( pass.needsSwap ) {

        if ( maskActive ) {

          var context = this.renderer.context;

          context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );

          this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, delta );

          context.stencilFunc( context.EQUAL, 1, 0xffffffff );

        }

        this.swapBuffers();

      }

      if ( pass instanceof THREE.MaskPass ) {

        maskActive = true;

      } else if ( pass instanceof THREE.ClearMaskPass ) {

        maskActive = false;

      }

    }

  },

  reset: function ( renderTarget ) {

    if ( renderTarget === undefined ) {

      renderTarget = this.renderTarget1.clone();

      var pixelRatio = this.renderer.getPixelRatio();

      renderTarget.width  = Math.floor( this.renderer.context.canvas.width  / pixelRatio );
      renderTarget.height = Math.floor( this.renderer.context.canvas.height / pixelRatio );

    }

    this.renderTarget1.dispose();
    this.renderTarget1 = renderTarget;
    this.renderTarget2.dispose();
    this.renderTarget2 = renderTarget.clone();

    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;

  },

  setSize: function ( width, height ) {

    this.renderTarget1.setSize( width, height );
    this.renderTarget2.setSize( width, height );

  }

};
/**
 * @author alteredq / http://alteredqualia.com/
 */


THREE.FilmPass = function ( noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale ) {

  if ( THREE.FilmShader === undefined )
    console.error( "THREE.FilmPass relies on THREE.FilmShader" );

  var shader = THREE.FilmShader;

  this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );

  this.material = new THREE.ShaderMaterial( {

    uniforms: this.uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader

  } );

  if ( grayscale !== undefined )  this.uniforms.grayscale.value = grayscale;
  if ( noiseIntensity !== undefined ) this.uniforms.nIntensity.value = noiseIntensity;
  if ( scanlinesIntensity !== undefined ) this.uniforms.sIntensity.value = scanlinesIntensity;
  if ( scanlinesCount !== undefined ) this.uniforms.sCount.value = scanlinesCount;

  this.enabled = true;
  this.renderToScreen = false;
  this.needsSwap = true;


  this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
  this.scene  = new THREE.Scene();

  this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
  this.scene.add( this.quad );

};

THREE.FilmPass.prototype = {

  render: function ( renderer, writeBuffer, readBuffer, delta ) {

    this.uniforms[ "tDiffuse" ].value = readBuffer;
    this.uniforms[ "time" ].value += delta;

    this.quad.material = this.material;

    if ( this.renderToScreen ) {

      renderer.render( this.scene, this.camera );

    } else {

      renderer.render( this.scene, this.camera, writeBuffer, false );

    }

  }

};

/**
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 * ----------------------------------------------
 *
 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
 * Thank you all, you're awesome!
 */

// Include a performance.now polyfill
(function () {

  if ('performance' in window === false) {
    window.performance = {};
  }

  // IE 8
  Date.now = (Date.now || function () {
    return new Date().getTime();
  });

  if ('now' in window.performance === false) {
    var offset = window.performance.timing && window.performance.timing.navigationStart ? window.performance.timing.navigationStart
                                                                                        : Date.now();

    window.performance.now = function () {
      return Date.now() - offset;
    };
  }

})();

var TWEEN = TWEEN || (function () {

  var _tweens = [];

  return {

    getAll: function () {

      return _tweens;

    },

    removeAll: function () {

      _tweens = [];

    },

    add: function (tween) {

      _tweens.push(tween);

    },

    remove: function (tween) {

      var i = _tweens.indexOf(tween);

      if (i !== -1) {
        _tweens.splice(i, 1);
      }

    },

    update: function (time) {

      if (_tweens.length === 0) {
        return false;
      }

      var i = 0;

      time = time !== undefined ? time : window.performance.now();

      while (i < _tweens.length) {

        if (_tweens[i].update(time)) {
          i++;
        } else {
          _tweens.splice(i, 1);
        }

      }

      return true;

    }
  };

})();

TWEEN.Tween = function (object) {

  var _object = object;
  var _valuesStart = {};
  var _valuesEnd = {};
  var _valuesStartRepeat = {};
  var _duration = 1000;
  var _repeat = 0;
  var _yoyo = false;
  var _isPlaying = false;
  var _reversed = false;
  var _delayTime = 0;
  var _startTime = null;
  var _easingFunction = TWEEN.Easing.Linear.None;
  var _interpolationFunction = TWEEN.Interpolation.Linear;
  var _chainedTweens = [];
  var _onStartCallback = null;
  var _onStartCallbackFired = false;
  var _onUpdateCallback = null;
  var _onCompleteCallback = null;
  var _onStopCallback = null;

  // Set all starting values present on the target object
  for (var field in object) {
    _valuesStart[field] = parseFloat(object[field], 10);
  }

  this.to = function (properties, duration) {

    if (duration !== undefined) {
      _duration = duration;
    }

    _valuesEnd = properties;

    return this;

  };

  this.start = function (time) {

    TWEEN.add(this);

    _isPlaying = true;

    _onStartCallbackFired = false;

    _startTime = time !== undefined ? time : window.performance.now();
    _startTime += _delayTime;

    for (var property in _valuesEnd) {

      // Check if an Array was provided as property value
      if (_valuesEnd[property] instanceof Array) {

        if (_valuesEnd[property].length === 0) {
          continue;
        }

        // Create a local copy of the Array with the start value at the front
        _valuesEnd[property] = [_object[property]].concat(_valuesEnd[property]);

      }

      _valuesStart[property] = _object[property];

      if ((_valuesStart[property] instanceof Array) === false) {
        _valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
      }

      _valuesStartRepeat[property] = _valuesStart[property] || 0;

    }

    return this;

  };

  this.stop = function () {

    if (!_isPlaying) {
      return this;
    }

    TWEEN.remove(this);
    _isPlaying = false;

    if (_onStopCallback !== null) {
      _onStopCallback.call(_object);
    }

    this.stopChainedTweens();
    return this;

  };

  this.stopChainedTweens = function () {

    for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
      _chainedTweens[i].stop();
    }

  };

  this.delay = function (amount) {

    _delayTime = amount;
    return this;

  };

  this.repeat = function (times) {

    _repeat = times;
    return this;

  };

  this.yoyo = function (yoyo) {

    _yoyo = yoyo;
    return this;

  };


  this.easing = function (easing) {

    _easingFunction = easing;
    return this;

  };

  this.interpolation = function (interpolation) {

    _interpolationFunction = interpolation;
    return this;

  };

  this.chain = function () {

    _chainedTweens = arguments;
    return this;

  };

  this.onStart = function (callback) {

    _onStartCallback = callback;
    return this;

  };

  this.onUpdate = function (callback) {

    _onUpdateCallback = callback;
    return this;

  };

  this.onComplete = function (callback) {

    _onCompleteCallback = callback;
    return this;

  };

  this.onStop = function (callback) {

    _onStopCallback = callback;
    return this;

  };

  this.update = function (time) {

    var property;
    var elapsed;
    var value;

    if (time < _startTime) {
      return true;
    }

    if (_onStartCallbackFired === false) {

      if (_onStartCallback !== null) {
        _onStartCallback.call(_object);
      }

      _onStartCallbackFired = true;

    }

    elapsed = (time - _startTime) / _duration;
    elapsed = elapsed > 1 ? 1 : elapsed;

    value = _easingFunction(elapsed);

    for (property in _valuesEnd) {

      var start = _valuesStart[property] || 0;
      var end = _valuesEnd[property];

      if (end instanceof Array) {

        _object[property] = _interpolationFunction(end, value);

      } else {

        // Parses relative end values with start as base (e.g.: +10, -3)
        if (typeof (end) === 'string') {
          end = start + parseFloat(end, 10);
        }

        // Protect against non numeric properties.
        if (typeof (end) === 'number') {
          _object[property] = start + (end - start) * value;
        }

      }

    }

    if (_onUpdateCallback !== null) {
      _onUpdateCallback.call(_object, value);
    }

    if (elapsed === 1) {

      if (_repeat > 0) {

        if (isFinite(_repeat)) {
          _repeat--;
        }

        // Reassign starting values, restart by making startTime = now
        for (property in _valuesStartRepeat) {

          if (typeof (_valuesEnd[property]) === 'string') {
            _valuesStartRepeat[property] = _valuesStartRepeat[property] + parseFloat(_valuesEnd[property], 10);
          }

          if (_yoyo) {
            var tmp = _valuesStartRepeat[property];

            _valuesStartRepeat[property] = _valuesEnd[property];
            _valuesEnd[property] = tmp;
          }

          _valuesStart[property] = _valuesStartRepeat[property];

        }

        if (_yoyo) {
          _reversed = !_reversed;
        }

        _startTime = time + _delayTime;

        return true;

      } else {

        if (_onCompleteCallback !== null) {
          _onCompleteCallback.call(_object);
        }

        for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
          // Make the chained tweens start exactly at the time they should,
          // even if the `update()` method was called way past the duration of the tween
          _chainedTweens[i].start(_startTime + _duration);
        }

        return false;

      }

    }

    return true;

  };

};


TWEEN.Easing = {

  Linear: {

    None: function (k) {

      return k;

    }

  },

  Quadratic: {

    In: function (k) {

      return k * k;

    },

    Out: function (k) {

      return k * (2 - k);

    },

    InOut: function (k) {

      if ((k *= 2) < 1) {
        return 0.5 * k * k;
      }

      return - 0.5 * (--k * (k - 2) - 1);

    }

  },

  Cubic: {

    In: function (k) {

      return k * k * k;

    },

    Out: function (k) {

      return --k * k * k + 1;

    },

    InOut: function (k) {

      if ((k *= 2) < 1) {
        return 0.5 * k * k * k;
      }

      return 0.5 * ((k -= 2) * k * k + 2);

    }

  },

  Quartic: {

    In: function (k) {

      return k * k * k * k;

    },

    Out: function (k) {

      return 1 - (--k * k * k * k);

    },

    InOut: function (k) {

      if ((k *= 2) < 1) {
        return 0.5 * k * k * k * k;
      }

      return - 0.5 * ((k -= 2) * k * k * k - 2);

    }

  },

  Quintic: {

    In: function (k) {

      return k * k * k * k * k;

    },

    Out: function (k) {

      return --k * k * k * k * k + 1;

    },

    InOut: function (k) {

      if ((k *= 2) < 1) {
        return 0.5 * k * k * k * k * k;
      }

      return 0.5 * ((k -= 2) * k * k * k * k + 2);

    }

  },

  Sinusoidal: {

    In: function (k) {

      return 1 - Math.cos(k * Math.PI / 2);

    },

    Out: function (k) {

      return Math.sin(k * Math.PI / 2);

    },

    InOut: function (k) {

      return 0.5 * (1 - Math.cos(Math.PI * k));

    }

  },

  Exponential: {

    In: function (k) {

      return k === 0 ? 0 : Math.pow(1024, k - 1);

    },

    Out: function (k) {

      return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);

    },

    InOut: function (k) {

      if (k === 0) {
        return 0;
      }

      if (k === 1) {
        return 1;
      }

      if ((k *= 2) < 1) {
        return 0.5 * Math.pow(1024, k - 1);
      }

      return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);

    }

  },

  Circular: {

    In: function (k) {

      return 1 - Math.sqrt(1 - k * k);

    },

    Out: function (k) {

      return Math.sqrt(1 - (--k * k));

    },

    InOut: function (k) {

      if ((k *= 2) < 1) {
        return - 0.5 * (Math.sqrt(1 - k * k) - 1);
      }

      return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);

    }

  },

  Elastic: {

    In: function (k) {

      var s;
      var a = 0.1;
      var p = 0.4;

      if (k === 0) {
        return 0;
      }

      if (k === 1) {
        return 1;
      }

      if (!a || a < 1) {
        a = 1;
        s = p / 4;
      } else {
        s = p * Math.asin(1 / a) / (2 * Math.PI);
      }

      return - (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));

    },

    Out: function (k) {

      var s;
      var a = 0.1;
      var p = 0.4;

      if (k === 0) {
        return 0;
      }

      if (k === 1) {
        return 1;
      }

      if (!a || a < 1) {
        a = 1;
        s = p / 4;
      } else {
        s = p * Math.asin(1 / a) / (2 * Math.PI);
      }

      return (a * Math.pow(2, - 10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);

    },

    InOut: function (k) {

      var s;
      var a = 0.1;
      var p = 0.4;

      if (k === 0) {
        return 0;
      }

      if (k === 1) {
        return 1;
      }

      if (!a || a < 1) {
        a = 1;
        s = p / 4;
      } else {
        s = p * Math.asin(1 / a) / (2 * Math.PI);
      }

      if ((k *= 2) < 1) {
        return - 0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
      }

      return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;

    }

  },

  Back: {

    In: function (k) {

      var s = 1.70158;

      return k * k * ((s + 1) * k - s);

    },

    Out: function (k) {

      var s = 1.70158;

      return --k * k * ((s + 1) * k + s) + 1;

    },

    InOut: function (k) {

      var s = 1.70158 * 1.525;

      if ((k *= 2) < 1) {
        return 0.5 * (k * k * ((s + 1) * k - s));
      }

      return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);

    }

  },

  Bounce: {

    In: function (k) {

      return 1 - TWEEN.Easing.Bounce.Out(1 - k);

    },

    Out: function (k) {

      if (k < (1 / 2.75)) {
        return 7.5625 * k * k;
      } else if (k < (2 / 2.75)) {
        return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
      } else if (k < (2.5 / 2.75)) {
        return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
      } else {
        return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
      }

    },

    InOut: function (k) {

      if (k < 0.5) {
        return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
      }

      return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;

    }

  }

};

TWEEN.Interpolation = {

  Linear: function (v, k) {

    var m = v.length - 1;
    var f = m * k;
    var i = Math.floor(f);
    var fn = TWEEN.Interpolation.Utils.Linear;

    if (k < 0) {
      return fn(v[0], v[1], f);
    }

    if (k > 1) {
      return fn(v[m], v[m - 1], m - f);
    }

    return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);

  },

  Bezier: function (v, k) {

    var b = 0;
    var n = v.length - 1;
    var pw = Math.pow;
    var bn = TWEEN.Interpolation.Utils.Bernstein;

    for (var i = 0; i <= n; i++) {
      b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
    }

    return b;

  },

  CatmullRom: function (v, k) {

    var m = v.length - 1;
    var f = m * k;
    var i = Math.floor(f);
    var fn = TWEEN.Interpolation.Utils.CatmullRom;

    if (v[0] === v[m]) {

      if (k < 0) {
        i = Math.floor(f = m * (1 + k));
      }

      return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);

    } else {

      if (k < 0) {
        return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
      }

      if (k > 1) {
        return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
      }

      return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);

    }

  },

  Utils: {

    Linear: function (p0, p1, t) {

      return (p1 - p0) * t + p0;

    },

    Bernstein: function (n, i) {

      var fc = TWEEN.Interpolation.Utils.Factorial;

      return fc(n) / fc(i) / fc(n - i);

    },

    Factorial: (function () {

      var a = [1];

      return function (n) {

        var s = 1;

        if (a[n]) {
          return a[n];
        }

        for (var i = n; i > 1; i--) {
          s *= i;
        }

        a[n] = s;
        return s;

      };

    })(),

    CatmullRom: function (p0, p1, p2, p3, t) {

      var v0 = (p2 - p0) * 0.5;
      var v1 = (p3 - p1) * 0.5;
      var t2 = t * t;
      var t3 = t * t2;

      return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;

    }

  }

};

// UMD (Universal Module Definition)
(function (root) {

  if (typeof define === 'function' && define.amd) {

    // AMD
    define([], function () {
      return TWEEN;
    });

  } else if (typeof exports === 'object') {

    // Node.js
    module.exports = TWEEN;

  } else if (root !== undefined) {

    // Global variable
    root.TWEEN = TWEEN;

  }

})(this);
