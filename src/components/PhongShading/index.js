// src/components/App/index.js
import React, { Component } from 'react';
import classnames from 'classnames';

import './style.css';

import {getShader} from '../../utilities/shaderUtil'
import {getMesh, getCube, getSphere} from '../../utilities/objUtil'
import {GLUtil}  from '../../utilities/GLUtil'

var glm = require('../../utilities/gl-matrix');

class PhongShading extends Component {
  //react variables
  static propTypes = {}
  static defaultProps = {}
  state = {}
  
  //gl variables
  gl = null;
  glu = null;
  shaderProgram = null;
  perFragmentProgram = null;

  //shader variables
  mvMatrix = glm.mat4.create();
  mvMatrixStack = [];
  pMatrix = glm.mat4.create();

  //object variables
  monkeyMesh = null;
  cubeMesh = null;
  sphereMesh = null;

  //textures variables
  textures = [];
  moonTexture = null;
  crateTexture = null;
  textureLoaded = false;

  //animation variables
  moonAngle = 180;
  cubeAngle = 0;
  lastTime = 0;

  constructor(props) {
    super(props);
    this.glu = new GLUtil();

    this.state = {
      pl0x :  5.0,
      pl0y :  5.0,
      pl0z : -3.0,
      pl0r :  0.7,
      pl0g :  0.7,
      pl0b :  0.7,
      ar   :  0.05,
      ag   :  0.05,
      ab   :  0.05,
      lightOn : true,
      textureOn : true
    };

    this.initGL = this.initGL.bind(this);
    this.initShaders = this.initShaders.bind(this);
    this.setShaderUniforms = this.setShaderUniforms.bind(this);
    this.createProgram = this.createProgram.bind(this);
    this.initBuffers = this.initBuffers.bind(this);
    this.initTextures = this.initTextures.bind(this);

    this.handleInputChange = this.handleInputChange.bind(this);

    this.drawScene = this.drawScene.bind(this);
    this.animate = this.animate.bind(this);
    this.tick = this.tick.bind(this);
  }

  componentDidMount(){
    var canvas = this.refs.mainCanvas;
    
    this.initGL(canvas);
    this.initShaders()
    this.initBuffers();
    this.initTextures();

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.tick();
  }

  /*componentDidUpdate() {
    this.tick();
  }*/

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
    this.perVertexProgram = this.createProgram("/shaders/per-vertex-lighting-fs", "/shaders/per-vertex-lighting-vs");
    this.perFragmentProgram = this.createProgram("/shaders/per-fragment-lighting-fs", "/shaders/per-fragment-lighting-vs");
  }

  setShaderUniforms() {
    this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
    this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);

    var normalMatrix = glm.mat3.create();
    glm.mat3.normalFromMat4(normalMatrix, this.mvMatrix);
    this.gl.uniformMatrix3fv(this.shaderProgram.nMatrixUniform, false, normalMatrix);
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

    program.pMatrixUniform = this.gl.getUniformLocation(program, "uPMatrix");
    program.mvMatrixUniform = this.gl.getUniformLocation(program, "uMVMatrix");
    program.nMatrixUniform = this.gl.getUniformLocation(program, "uNMatrix");
    program.samplerUniform = this.gl.getUniformLocation(program, "uSampler");
    program.useTexturesUniform = this.gl.getUniformLocation(program, "uUseTextures");
    program.useLightingUniform = this.gl.getUniformLocation(program, "uUseLighting");
    program.ambientColorUniform = this.gl.getUniformLocation(program, "uAmbientColor");
    program.pointLightingLocationUniform = this.gl.getUniformLocation(program, "uPointLightingLocation");
    program.pointLightingColorUniform = this.gl.getUniformLocation(program, "uPointLightingColor");

    return program;
  }

  initBuffers() {
    
    //initialize monkey
    this.monkeyMesh = getMesh(this.gl, "/models/monkey.obj");
    //
    this.cubeMesh = getCube(this.gl);
    this.sphereMesh = getSphere(this.gl);
  }

  initTextures() {
    this.moonTexture = this.gl.createTexture();
    this.moonTexture.image = new Image();
    this.moonTexture.isLoad = false;

    this.moonTexture.image.onload = function () {
        this.glu.setTexture(this.gl, this.moonTexture);
        this.moonTexture.isLoad = true;
    }.bind(this);
    this.moonTexture.image.src = "/images/moon.gif";
    
    this.textures.push(this.moonTexture);
    //
    this.crateTexture = this.gl.createTexture();
    this.crateTexture.image = new Image();
    this.crateTexture.isLoad = false;

    this.crateTexture.image.onload = function () {
        this.glu.setTexture(this.gl, this.crateTexture);
        this.crateTexture.isLoad = true;
    }.bind(this);
    this.crateTexture.image.src = "/images/crate.gif";

    this.textures.push(this.crateTexture);
  }

  drawScene() {
    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    glm.mat4.perspective(this.pMatrix, this.glu.degToRad(45.0), this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0);

    this.shaderProgram = this.perFragmentProgram;
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

    glm.mat4.identity(this.mvMatrix);

    glm.mat4.translate(this.mvMatrix,this.mvMatrix, [0, 0, -5]);

    glm.mat4.rotate(this.mvMatrix, this.mvMatrix, this.glu.degToRad(30), [1, 0, 0]);

    this.glu.pushMatrix(this.mvMatrixStack, this.mvMatrix);
      glm.mat4.rotate(this.mvMatrix, this.mvMatrix, this.glu.degToRad(this.moonAngle), [0, 1, 0]);
      glm.mat4.translate(this.mvMatrix,this.mvMatrix, [2, 0, 0]);
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.moonTexture);
      this.gl.uniform1i(this.shaderProgram.samplerUniform, 0);
    
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeMesh.vertexBuffer);
      this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.cubeMesh.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeMesh.textureBuffer);
      this.gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.cubeMesh.textureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeMesh.normalBuffer);
      this.gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, this.cubeMesh.normalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeMesh.indexBuffer);
      this.setShaderUniforms();
      this.gl.drawElements(this.gl.TRIANGLES, this.cubeMesh.indexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
    this.glu.popMatrix(this.mvMatrixStack, this.mvMatrix);
/*
    this.glu.pushMatrix(this.mvMatrixStack, this.mvMatrix);
      glm.mat4.rotate(this.mvMatrix, this.mvMatrix, this.glu.degToRad(this.cubeAngle), [0, 1, 0]);
      glm.mat4.translate(this.mvMatrix, this.mvMatrix, [1.25, 0, 0]);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sphereMesh.vertexBuffer);
      this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.sphereMesh.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sphereMesh.normalBuffer);
      this.gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, this.sphereMesh.normalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sphereMesh.textureBuffer);
      this.gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.sphereMesh.textureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.crateTexture);
      this.gl.uniform1i(this.shaderProgram.samplerUniform, 0);
    
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.sphereMesh.indexBuffer);
      this.setShaderUniforms();
      this.gl.drawElements(this.gl.TRIANGLES, this.sphereMesh.indexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
    this.glu.popMatrix(this.mvMatrixStack, this.mvMatrix);
*/
    //draw monkey
    this.glu.pushMatrix(this.mvMatrixStack, this.mvMatrix);
      glm.mat4.rotate(this.mvMatrix, this.mvMatrix, this.glu.degToRad(this.cubeAngle), [0, 1, 0]);
      glm.mat4.translate(this.mvMatrix, this.mvMatrix, [1.25, 0, 0]);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.monkeyMesh.vertexBuffer);
      this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.monkeyMesh.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    
      if(!this.monkeyMesh.textures.length){
        this.gl.disableVertexAttribArray(this.shaderProgram.textureCoordAttribute);
      }
      else{
        this.gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.monkeyMesh.textureBuffer);
        this.gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.monkeyMesh.textureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
      }

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.monkeyMesh.normalBuffer);
      this.gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, this.monkeyMesh.normalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.monkeyMesh.indexBuffer);
      this.setShaderUniforms();
      this.gl.drawElements(this.gl.TRIANGLES, this.monkeyMesh.indexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
    this.glu.popMatrix(this.mvMatrixStack, this.mvMatrix);
  }

  animate() {
    var timeNow = new Date().getTime();
    if (this.lastTime !== 0) {
        var elapsed = timeNow - this.lastTime;

        this.moonAngle += 0.05 * elapsed;
        this.cubeAngle += 0.05 * elapsed;
    }
    this.lastTime = timeNow;
  }

  tick() {
    window.requestAnimFrame(this.tick);

    if(this.textures.length ===0){
      this.drawScene();
    }else{
      if(this.textureLoaded){
        this.drawScene();
      }else{
        for(var i=0; i<this.textures.length;i++){
          if(!this.textures[i].isLoad){
            this.textureLoaded = false;
            break;
          }else{
            this.textureLoaded = true;
          } 
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

  render() {
    const { className, ...props } = this.props;
    return (
      <div>

      <canvas className="phong-canvas" ref='mainCanvas' ></canvas>
      
      <div>
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
          <span>ambient color</span>
          <div>
            <span>r: <input type="number" value={this.state.ar} name="ar" min="0" max="1" step="0.01" onChange={this.handleInputChange} /> </span>
            <span>g: <input type="number" value={this.state.ag} name="ag" min="0" max="1" step="0.01" onChange={this.handleInputChange} /> </span>
            <span>b: <input type="number" value={this.state.ab} name="ab" min="0" max="1" step="0.01" onChange={this.handleInputChange} /> </span>
          </div>
        </div>

        <div>
          <input type="checkbox" defaultChecked={this.state.lightOn} name="lightOn" onChange={this.handleInputChange} /> light on<br/>
          <input type="checkbox" defaultChecked={this.state.textureOn} name="textureOn" onChange={this.handleInputChange} /> texture on<br/>
        </div>
      </div>

     </div>
    );
  }
}

export default PhongShading;
