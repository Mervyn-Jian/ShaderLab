// src/components/App/index.js
import React, { Component } from 'react';
import classnames from 'classnames';

import './style.css';

import {getShader} from '../../utilities/shaderUtil'
import {getMesh, getCube, getSphere} from '../../utilities/objUtil'
import {GLUtil}  from '../../utilities/GLUtil'
import {camera}  from '../../utilities/camUtil'

var glm = require('../../utilities/gl-matrix');

class GoochShading extends Component {
  //react variables
  static propTypes = {}
  static defaultProps = {}
  state = {}
  
  //gl variables
  gl = null;
  glu = null;
  shaderProgram = null;
  goochProgram = null;

  //shader variables
  mMatrix = glm.mat4.create();
  mMatrixStack = [];
  pMatrix = glm.mat4.create();
  vMatrix = glm.mat4.create();

  //object variables
  mesh = null;
  
  //textures variables
  textures = [];
  textureLoaded = false;

  //animation variables
  angle = 0;
  lastTime = 0;

  //camera variables
  camera = null;
  viewQuat = glm.quat.create();
  perspectAngle = 45.0;

  //mouse variables
  mouseX = 0;
  mouseY = 0;
  mouseDown = false;

  //key variables
  keys = {};

  constructor(props) {
    super(props);
    this.glu = new GLUtil();
    this.camera = new camera();

    this.state = {
      pl0x :  3.0,
      pl0y :  3.0,
      pl0z : -3.0,
      pl0r :  0.7,
      pl0g :  0.7,
      pl0b :  0.7,
      ar   :  0.05,
      ag   :  0.05,
      ab   :  0.05,
      wr   :  0.5,
      wg   :  0.5,
      wb   :  0.0,
      cr   :  0.0,
      cg   :  0.0,
      cb   :  0.5,
      lightOn : true,
      textureOn : false
    };

    this.initGL = this.initGL.bind(this);
    this.initShaders = this.initShaders.bind(this);
    this.setShaderUniforms = this.setShaderUniforms.bind(this);
    this.createProgram = this.createProgram.bind(this);
    this.initBuffers = this.initBuffers.bind(this);
    this.initTextures = this.initTextures.bind(this);

    this.handleInputChange = this.handleInputChange.bind(this);
    
    this.handleMouseDown   = this.handleMouseDown.bind(this);
    this.handleMouseMove   = this.handleMouseMove.bind(this);
    this.handleMouseUp     = this.handleMouseUp.bind(this);
    this.handleWheel       = this.handleWheel.bind(this);

    this.handleKeyDown     = this.handleKeyDown.bind(this);
    this.handleKeyPress    = this.handleKeyPress.bind(this);
    this.handleKeyUp       = this.handleKeyUp.bind(this);

    this.drawScene = this.drawScene.bind(this);
    this.animate = this.animate.bind(this);
    this.tick = this.tick.bind(this);

    var canvas = this.refs.mainCanvas;
    document.addEventListener('keydown', function(event) {
        var lastDownTarget = event.target;
        if(lastDownTarget == canvas) {
            this.handleKeyDown(event);
        }
    }, false);

    document.addEventListener('keyup', function(event) {
        var lastDownTarget = event.target;
        if(lastDownTarget == canvas) {
            this.handleKeyUp(event);
        }
    }, false);

    document.addEventListener('keypress', function(event) {
        var lastDownTarget = event.target;
        if(lastDownTarget == canvas) {
            this.handleKeyPress(event);
        }
    }, false);
  }

  componentDidMount(){
    var canvas = this.refs.mainCanvas;
    
    this.initGL(canvas);
    this.initShaders()
    this.initBuffers();
    //this.initTextures();

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.tick();
  }

  initGL(canvas) {
    try {
      this.gl = canvas.getContext("experimental-webgl");

      //checking drawing buffer size is very important.
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      this.gl.viewportWidth = canvas.clientWidth;
      this.gl.viewportHeight = canvas.clientHeight;
      //this.gl.drawingBufferWidth = canvas.clientWidth;
      //this.gl.drawingBufferHeight = canvas.clientHeight;
    } catch (e) {
    }
    if (!this.gl) {
      alert("Could not initialise WebGL, sorry :-(");
    }
  }

  initShaders() {
    this.goochProgram = this.createProgram("/shaders/gooch_fragment-fs", "/shaders/gooch_vertex-vs");
  }

  setShaderUniforms() {
    this.gl.uniformMatrix4fv(this.shaderProgram.project, false, this.pMatrix);
    this.gl.uniformMatrix4fv(this.shaderProgram.model, false, this.mMatrix);
    this.gl.uniformMatrix4fv(this.shaderProgram.view, false, this.vMatrix);

    var normalMatrix = glm.mat3.create();
    glm.mat3.normalFromMat4(normalMatrix, this.mMatrix);
    this.gl.uniformMatrix3fv(this.shaderProgram.invertTransNormal, false, normalMatrix);
  }

  createProgram(fragmentShaderID, vertexShaderID) {
    var fragmentShader = getShader(this.gl, fragmentShaderID);
    var vertexShader = getShader(this.gl, vertexShaderID);

    var program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }

    program.vertexPositionAttribute = this.gl.getAttribLocation(program, "aVertexPosition");
    this.gl.enableVertexAttribArray(program.vertexPositionAttribute);

    program.vertexNormalAttribute = this.gl.getAttribLocation(program, "aVertexNormal");
    this.gl.enableVertexAttribArray(program.vertexNormalAttribute);

    program.textureCoordAttribute = this.gl.getAttribLocation(program, "aTextureCoord");
    this.gl.enableVertexAttribArray(program.textureCoordAttribute);

    program.project = this.gl.getUniformLocation(program, "project");
    program.model   = this.gl.getUniformLocation(program, "model");
    program.view    = this.gl.getUniformLocation(program, "view");
    program.invertTransNormal = this.gl.getUniformLocation(program, "invertTransNormal");

    program.samplerUniform = this.gl.getUniformLocation(program, "uSampler");
    program.useTexturesUniform = this.gl.getUniformLocation(program, "uUseTextures");
    program.useLightingUniform = this.gl.getUniformLocation(program, "uUseLighting");
    program.ambientColorUniform = this.gl.getUniformLocation(program, "uAmbientColor");
    program.warmColorUniform = this.gl.getUniformLocation(program, "warm");
    program.coolColorUniform = this.gl.getUniformLocation(program, "cool");
    program.pointLightingLocationUniform = this.gl.getUniformLocation(program, "uPointLightingLocation");
    program.pointLightingColorUniform = this.gl.getUniformLocation(program, "uPointLightingColor");

    return program;
  }

  initBuffers() {
    //this.mesh = getMesh(this.gl, "/models/monkey.obj");
    //this.mesh = getMesh(this.gl, "/models/standford_bunny.obj");
    this.mesh = getMesh(this.gl, "/models/standford_dragon.obj");
    //this.mesh = getMesh(this.gl, "/models/standford_buddha.obj");
  }

  initTextures() {
    /*this.moonTexture = this.gl.createTexture();
    this.moonTexture.image = new Image();
    this.moonTexture.isLoad = false;

    this.moonTexture.image.onload = function () {
        this.glu.setTexture(this.gl, this.moonTexture);
        this.moonTexture.isLoad = true;
    }.bind(this);
    this.moonTexture.image.src = "/images/moon.gif";
    
    this.textures.push(this.moonTexture);
    */
  }

  drawScene() {
    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    //this.gl.enable(this.gl.CULL_FACE);

    //projection
    glm.mat4.perspective(this.pMatrix, this.glu.degToRad(this.perspectAngle), this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0);
    
    //view
    //glm.mat4.lookAt(this.vMatrix, [0.0, 0.0, -3.0], [0.0, 0.0, 0.0],  [0.0, 1.0, 0.0]);
    glm.mat4.lookAt(this.vMatrix, this.camera.eye, [0.0, 0.0, 0.0],  this.camera.up);

    this.shaderProgram = this.goochProgram;
    this.gl.useProgram(this.shaderProgram);

    this.gl.uniform1i(this.shaderProgram.useLightingUniform, this.state.lightOn);
    if (this.state.lightOn) {
      this.gl.uniform3f(
        this.shaderProgram.ambientColorUniform,
        this.state.ar,
        this.state.ag,
        this.state.ab
      );

      this.gl.uniform3f(
        this.shaderProgram.warmColorUniform,
        this.state.wr,
        this.state.wg,
        this.state.wb
      );

      this.gl.uniform3f(
        this.shaderProgram.coolColorUniform,
        this.state.cr,
        this.state.cg,
        this.state.cb
      );

      this.gl.uniform3f(
        this.shaderProgram.pointLightingLocationUniform,
        this.state.pl0x,
        this.state.pl0y,
        this.state.pl0z
      );

      this.gl.uniform3f(
        this.shaderProgram.pointLightingColorUniform,
        this.state.pl0r,
        this.state.pl0g,
        this.state.pl0b
      );
    }

    this.gl.uniform1i(this.shaderProgram.useTexturesUniform, this.state.textureOn);
    if(this.state.textureOn){
      this.gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);
    }

    glm.mat4.identity(this.mMatrix);

    //orbit
    var vAxis = glm.vec3.create();
    var vAngle = glm.quat.getAxisAngle(vAxis, this.viewQuat);
    glm.mat4.rotate(this.mMatrix, this.mMatrix, vAngle, vAxis);

    //draw mesh
    this.glu.pushMatrix(this.mMatrixStack, this.mMatrix);
    //  glm.mat4.rotate(this.mMatrix, this.mMatrix, this.glu.degToRad(this.angle), [0, 1, 0]);
      
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
      this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.mesh.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
      if(!this.mesh.textures.length){
        this.gl.disableVertexAttribArray(this.shaderProgram.textureCoordAttribute);
      }
      else{
        this.gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mesh.textureBuffer);
        this.gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.mesh.textureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
      }

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mesh.normalBuffer);
      this.gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, this.mesh.normalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
      this.setShaderUniforms();
      this.gl.drawElements(this.gl.TRIANGLES, this.mesh.indexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
    this.glu.popMatrix(this.mMatrixStack, this.mMatrix);
  }

  animate() {
    var timeNow = new Date().getTime();
    if (this.lastTime !== 0) {
        var elapsed = timeNow - this.lastTime;

        this.angle += 0.05 * elapsed;
    }
    this.lastTime = timeNow;
  }

  tick() {
    window.requestAnimFrame(this.tick);

    if(this.textures.length ===0 && this.mesh ){
      this.drawScene();
    }else{
      if(this.textureLoaded && this.mesh){
        this.drawScene();
      }else{
        //load textures
        for(var i=0; i<this.textures.length;i++){
          if(!this.textures[i].isLoad){
            this.textureLoaded = false;
            console.log("texture loading");
            break;
          }else{
            this.textureLoaded = true;
          } 
        }

        //load models
        if(!this.mesh){
          console.log("model loading");
        }
      }
    }

    this.animate();
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  handleMouseDown(event){
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
    this.mouseDown = true;

    if(event.button == 1){      //when mouse wheel is pressed.
      event.preventDefault();
      event.stopPropagation();
      this.perspectAngle = 45.0;
    }
  }

  handleMouseMove(event){
    if (!this.mouseDown) {
      return;
    }
    
    var angleScale = 0.18;
    var dx = event.clientX - this.mouseX;
    var dy = event.clientY - this.mouseY;
    dx *= angleScale;
    dy *= angleScale;

    //rotate quaternion
    glm.quat.rotateY(this.viewQuat, this.viewQuat, this.glu.degToRad(dx) );
    glm.quat.rotateX(this.viewQuat, this.viewQuat, this.glu.degToRad(dy) );

    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  handleMouseUp(event){
    this.mouseDown = false;
  }

  handleWheel(event){
    var angleScale = 0.01;
    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';
    if(isFirefox) angleScale = 0.2;

    event.preventDefault();
    event.stopPropagation();
    
    //var delta = event.originalEvent.deltaY || event.originalEvent.wheelDelta || event.originalEvent.detail;
    //this.perspectAngle += delta * angleScale;

    this.perspectAngle += event.deltaY * angleScale;
  }

  handleKeyDown(event){
    this.keys[event.keyCode] = true;
  }

  handleKeyPress(event){
    var shiftScale = 0.05;

    if(keys[87]) { // Forward
      this.camera.eye[0] += this.camera.forward[0] * shiftScale;
      this.camera.eye[1] += this.camera.forward[1] * shiftScale;
      this.camera.eye[2] += this.camera.forward[2] * shiftScale;
    } else if(keys[83]) { // Backward
      this.camera.eye[0] -= this.camera.forward[0] * shiftScale;
      this.camera.eye[1] -= this.camera.forward[1] * shiftScale;
      this.camera.eye[2] -= this.camera.forward[2] * shiftScale;
    }

    if(keys[68]) { // Right
      this.camera.eye[0] += this.camera.right[0] * shiftScale;
      this.camera.eye[1] += this.camera.right[1] * shiftScale;
      this.camera.eye[2] += this.camera.right[2] * shiftScale;
    } else if(keys[65]) { // Left
      this.camera.eye[0] -= this.camera.right[0] * shiftScale;
      this.camera.eye[1] -= this.camera.right[1] * shiftScale;
      this.camera.eye[2] -= this.camera.right[2] * shiftScale;
    }
  }

  handleKeyUp(event){
    this.keys[event.keyCode] = false;
  }

  render() {
    const { className, ...props } = this.props;
    return (
      <div>

      <canvas className="gooch-canvas" ref='mainCanvas' onMouseDown={this.handleMouseDown} 
                                                        onMouseMove={this.handleMouseMove} 
                                                        onMouseUp={this.handleMouseUp} 
                                                        onWheel={this.handleWheel}
                                                        ></canvas>
      
      <div>
        <div>
          <span>warm color</span>
          <div>
            <span>r: <input type="number" value={this.state.wr} name="wr" min="0" max="1" step="0.1" onChange={this.handleInputChange} /> </span>
            <span>g: <input type="number" value={this.state.wg} name="wg" min="0" max="1" step="0.1" onChange={this.handleInputChange} /> </span>
            <span>b: <input type="number" value={this.state.wb} name="wb" min="0" max="1" step="0.1" onChange={this.handleInputChange} /> </span>
          </div>
        </div>

        <div>
          <span>cool color</span>
          <div>
            <span>r: <input type="number" value={this.state.cr} name="cr" min="0" max="1" step="0.1" onChange={this.handleInputChange} /> </span>
            <span>g: <input type="number" value={this.state.cg} name="cg" min="0" max="1" step="0.1" onChange={this.handleInputChange} /> </span>
            <span>b: <input type="number" value={this.state.cb} name="cb" min="0" max="1" step="0.1" onChange={this.handleInputChange} /> </span>
          </div>
        </div>

        <div>
          <span>ambient color</span>
          <div>
            <span>r: <input type="number" value={this.state.ar} name="ar" min="0" max="1" step="0.01" onChange={this.handleInputChange} /> </span>
            <span>g: <input type="number" value={this.state.ag} name="ag" min="0" max="1" step="0.01" onChange={this.handleInputChange} /> </span>
            <span>b: <input type="number" value={this.state.ab} name="ab" min="0" max="1" step="0.01" onChange={this.handleInputChange} /> </span>
          </div>
        </div>

        <div>
          <span>point light 0</span>
          <div>
            <span>position</span>
            <span>x: <input type="number" value={this.state.pl0x} name="pl0x" step="0.1" onChange={this.handleInputChange} /> </span>
            <span>y: <input type="number" value={this.state.pl0y} name="pl0y" step="0.1" onChange={this.handleInputChange} /> </span>
            <span>z: <input type="number" value={this.state.pl0z} name="pl0z" step="0.1" onChange={this.handleInputChange} /> </span>
          </div>
          <div>
            <span>color</span>
            <span>r: <input type="number" value={this.state.pl0r} name="pl0r" min="0" max="1" step="0.1" onChange={this.handleInputChange} /> </span>
            <span>g: <input type="number" value={this.state.pl0g} name="pl0g" min="0" max="1" step="0.1" onChange={this.handleInputChange} /> </span>
            <span>b: <input type="number" value={this.state.pl0b} name="pl0b" min="0" max="1" step="0.1" onChange={this.handleInputChange} /> </span>
          </div>
        </div>

        <div>
          <input type="checkbox" defaultChecked={this.state.lightOn} name="lightOn" onChange={this.handleInputChange} /> light on<br/>
          {/* <input type="checkbox" defaultChecked={this.state.textureOn} name="textureOn" onChange={this.handleInputChange} /> texture on<br/> */}
        </div>
      </div>

     </div>
    );
  }
}

export default GoochShading;
