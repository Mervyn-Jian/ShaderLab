// src/components/App/index.js
import React, { Component } from 'react';
import classnames from 'classnames';

import './style.css';

class ShaderMenu extends Component {
  //react variables
  static propTypes = {}
  static defaultProps = {}
  state = {}

  contents = [];

  constructor(props) {
    super(props);

    this.handleClick = this.props.switchFunc.bind(this);

    for(var i=0; i<this.props.shaders.length; i++){
      this.contents.push(<li onClick={this.handleClick}>{this.props.shaders[i]}</li>);
    }
  }

  render() {
    const { className, ...props } = this.props;
    return (
      <div className="shader_menu">
        <ul>
          {this.contents}
        </ul>
      </div>
    );
  }
}

export default ShaderMenu;
