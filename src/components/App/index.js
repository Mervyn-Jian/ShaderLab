// src/components/App/index.js
import React, { Component } from 'react';
import classnames from 'classnames';

import logo from './logo.svg';
import './style.css';

import GouraudShading from '../GouraudShading/index.js';
import PhongShading from '../PhongShading/index.js';
import GoochShading from '../GoochShading/index.js';
import Cloud from '../Cloud/index.js';
import Plant from '../Plant/index.js';
import Ecosystem from '../Ecosystem/index.js';

import ShaderMenu from '../ShaderMenu/index.js';

class App extends Component {
  //react variables
  static propTypes = {}
  static defaultProps = {}
  state = {}

  shaderNames = [];

  constructor(props) {
    super(props);

    this.state = {
     shaderCanvas: <GouraudShading />
    };

    this.switchShader = this.switchShader.bind(this);

    this.shaderNames.push("GouraudShading");
    this.shaderNames.push("PhongShading");
    this.shaderNames.push("GoochShading");
    this.shaderNames.push("Cloud");
    this.shaderNames.push("Plant");
    this.shaderNames.push("Ecosystem");
  }

  switchShader(e) {
    e.preventDefault();

    if(e.target.textContent === "GouraudShading"){
      console.log(e.target.textContent);

      this.setState({
        shaderCanvas: <GouraudShading />
      });
    }

    if(e.target.textContent === "PhongShading"){
      console.log(e.target.textContent);

      this.setState({
        shaderCanvas: <PhongShading />
      });
    }

    if(e.target.textContent === "GoochShading"){
      console.log(e.target.textContent);

      this.setState({
        shaderCanvas: <GoochShading />
      });
    }

    if(e.target.textContent === "Cloud"){
      console.log(e.target.textContent);

      this.setState({
        shaderCanvas: <Cloud />
      });
    }

    if(e.target.textContent === "Plant"){
      console.log(e.target.textContent);

      this.setState({
        shaderCanvas: <Plant />
      });
    }

    if(e.target.textContent === "Ecosystem"){
      console.log(e.target.textContent);

      this.setState({
        shaderCanvas: <Ecosystem />
      });
    }

  //  this.forceUpdate();
    
  }

  render() {
    const { className, ...props } = this.props;
    return (
      <div className={classnames('App', className)} {...props}>
        <div className="App-header">
          {/* <img src={logo} className="App-logo" alt="logo" /> */}
          <h2>Graphics Playground</h2>
        </div>
        <ShaderMenu shaders={this.shaderNames} switchFunc={this.switchShader} />
        {this.state.shaderCanvas}
        <p className="App-intro">
          The experiment with Computer Graphics
        </p>
      </div>
    );
  }
}

export default App;
