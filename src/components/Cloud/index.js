// src/components/App/index.js
import React, { Component } from 'react';
import classnames from 'classnames';

import './style.css';

import {getShader} from '../../utilities/shaderUtil'
import {getMesh, getCube, getSphere, getPlane} from '../../utilities/objUtil'
import {GLUtil}  from '../../utilities/GLUtil'
import {camera}  from '../../utilities/camUtil'

var glm = require('../../utilities/gl-matrix');

class Cloud extends Component {
  //react variables
  static propTypes = {}
  static defaultProps = {}
  state = {}
  
  //gl variables
  gl = null;
  glu = null;
  shaderProgram = null;
  cloudProgram = null;

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
  moonTexture = null;

  //animation variables
  angle = 0;
  lastTime = 0;
  currentSecond = 0;

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
    this.cloudProgram = this.createProgram("/shaders/cloud_fragment-fs", "/shaders/cloud_vertex-vs");
  }

  setShaderUniforms() {
    this.gl.uniformMatrix4fv(this.shaderProgram.project, false, this.pMatrix);
    this.gl.uniformMatrix4fv(this.shaderProgram.model, false, this.mMatrix);
    this.gl.uniformMatrix4fv(this.shaderProgram.view, false, this.vMatrix);

    this.gl.uniform2f(this.shaderProgram.resolution, this.gl.viewportWidth, this.gl.viewportHeight);
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

    program.vertexPositionAttribute = this.gl.getAttribLocation(program, "a_position");
    this.gl.enableVertexAttribArray(program.vertexPositionAttribute);

    program.project = this.gl.getUniformLocation(program, "project");
    program.model   = this.gl.getUniformLocation(program, "model");
    program.view    = this.gl.getUniformLocation(program, "view");
    
    program.resolution = this.gl.getUniformLocation(program, "u_resolution");
    program.time    = this.gl.getUniformLocation(program, "u_time");
    
    return program;
  }

  initBuffers() {
    this.mesh = getPlane(this.gl);
  }

  drawScene() {
    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    //this.gl.enable(this.gl.CULL_FACE);

    //projection
    glm.mat4.ortho(this.pMatrix, -1.0, 1.0, -1.0, 1.0, -10.0, 10.0);
    
    //view
    glm.mat4.lookAt(this.vMatrix, this.camera.eye, [0.0, 0.0, 0.0],  this.camera.up);

    this.shaderProgram = this.cloudProgram;
    this.gl.useProgram(this.shaderProgram);

    this.gl.uniform1f(this.shaderProgram.time, this.currentSecond);

    glm.mat4.identity(this.mMatrix);
    //orbit
    var vAxis = glm.vec3.create();
    var vAngle = glm.quat.getAxisAngle(vAxis, this.viewQuat);
    glm.mat4.rotate(this.mMatrix, this.mMatrix, vAngle, vAxis);
    
    //draw plane
    this.glu.pushMatrix(this.mMatrixStack, this.mMatrix);
   
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
      this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.mesh.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    //  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mesh.normalBuffer);
    //  this.gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, this.mesh.normalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
      this.setShaderUniforms();
      this.gl.drawElements(this.gl.TRIANGLES, this.mesh.indexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
    this.glu.popMatrix(this.mMatrixStack, this.mMatrix);
  }

  animate() {
    var d = new Date();
    var timeNow = d.getTime();
    if (this.lastTime !== 0) {
        var elapsed = timeNow - this.lastTime;

        this.angle += 0.05 * elapsed;

        if( !Number.isFinite(this.currentSecond) ) this.currentSecond = 0;
        this.currentSecond += 0.001 * elapsed;
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

  handleMouseDown(event){
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
    this.mouseDown = true;

    if(event.button == 1){      //when mouse wheel is pressed.
      event.preventDefault();
      event.stopPropagation();
      this.perspectAngle = 45.0;
      this.viewQuat = glm.quat.create();
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

      <canvas className="cloud-canvas" ref='mainCanvas' onMouseDown={this.handleMouseDown} 
                                                        onMouseMove={this.handleMouseMove} 
                                                        onMouseUp={this.handleMouseUp} 
                                                        onWheel={this.handleWheel}
                                                        ></canvas>
      </div>
    );
  }
}

export default Cloud;
