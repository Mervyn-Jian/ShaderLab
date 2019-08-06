// src/components/App/index.js
import React, { Component } from 'react';
import classnames from 'classnames';

import './style.css';

import * as THREE from '../../lib/three/three.min';

var OBJLoader = require('../../lib/three/OBJLoader');
OBJLoader(THREE);


class Ecosystem extends Component {
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
      500
    );

    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: '#433F81' });
    const cube = new THREE.Mesh(geometry, material);

    var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
    scene.add( ambientLight );

    var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
    camera.add( pointLight );
    camera.position.z = 10;
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

export default Ecosystem;
