// src/components/App/index.js
import React, { Component } from 'react';
import classnames from 'classnames';

import './style.css';

import * as THREE from '../../lib/three/three.min';
//import * from '../../lib/three/OBJLoader';

import sketch from './sketch';
import p5 from '../../lib/p5/p5.min';
//var p5 = require('../../utilities/p5.min');

var OBJLoader = require('../../lib/three/OBJLoader');
OBJLoader(THREE);


class Plant extends Component {
  //react variables
  static propTypes = {};
  static defaultProps = {};
  state = {};

  constructor(props) {
    super(props);

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.animate = this.animate.bind(this);
  }

  componentDidMount() {
    //const width = this.mount.clientWidth;
    //const height = this.mount.clientHeight;

    const width = 800;
    const height = 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      2000
    );

    // texture
    var manager = new THREE.LoadingManager();
    manager.onProgress = function ( item, loaded, total ) {

    console.log( item, loaded, total );

    };

    var textureLoader = new THREE.TextureLoader( manager );
    var texture = textureLoader.load( '/images/UV_Grid_Sm.jpg' );

    // model
    var onProgress = function ( xhr ) {
      if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round(percentComplete, 2) + '% downloaded' );
      }
    };

    var onError = function ( xhr ) {
    };

    var loader = new THREE.OBJLoader( manager );
    loader.load( "/models/male02.obj", function ( object ) {

      object.traverse( function ( child ) {

        if ( child instanceof THREE.Mesh ) {

          child.material.map = texture;
        }

      } );

      object.position.y = - 95;
      scene.add( object );

    }, onProgress, onError );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: '#433F81' });
    const cube = new THREE.Mesh(geometry, material);

    var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
    scene.add( ambientLight );

    var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
    camera.add( pointLight );
    camera.position.z = 250;
    scene.add(camera);
    
    scene.add(cube);
    
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor('#000000');
    renderer.setSize(width, height);

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.material = material;
    this.cube = cube;

    this.mount.appendChild(this.renderer.domElement);
    this.start();
  }

  componentWillUnmount() {
    this.stop();
    this.mount.removeChild(this.renderer.domElement);
  }

  start() {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate);
    }
  }

  stop() {
    cancelAnimationFrame(this.frameId);
  }

  animate() {
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;

    this.renderScene();
    this.frameId = window.requestAnimationFrame(this.animate);
  }

  renderScene() {
    this.renderer.render(this.scene, this.camera);
  }

  render() {
    const { className, ...props } = this.props;
    return (
      <div
        ref={(mount) => { this.mount = mount }}
      />
    );
  }
}


/*
class Plant extends Component {
  //react variables
  static propTypes = {}
  static defaultProps = {}
  state = {}

  constructor(props) {
    super(props);

    this.state = {
      theta: 45,
      stateSketch: sketch,
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.updateP5attribute = this.updateP5attribute.bind(this);
  }

  componentDidMount(){
    this.canvas = new p5(this.state.stateSketch, this.canvasDOM);
    
    if( this.canvas.ReactAttrHandler ) {
      this.canvas.ReactAttrHandler(this.state);
    }
  }

  componentWillReceiveProps(newprops) {
  }

  updateP5attribute(state){
    if(this.state.stateSketch !== state.stateSketch){
      this.canvasDOM.removeChild(this.canvasDOM.childNodes[0]);
      this.canvas = new p5(this.state.stateSketch, this.canvasDOM);
    }
    if( this.canvas.ReactAttrHandler ) {
      this.canvas.ReactAttrHandler(state);
    }
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });

    this.updateP5attribute(this.state);
  }

  render() {
    const { className, ...props } = this.props;
    return (
      <div>
      
      <div ref={dom => this.canvasDOM = dom}> </div>
      <input type="range" value={this.state.theta} name="theta"  min="0"  max="90" step="1" onInput={this.handleInputChange}/>

      </div>
    );
  }
}*/

export default Plant;
