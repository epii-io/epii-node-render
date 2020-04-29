import React, { Component } from 'react';
import Euler from './component/Euler';
import './index.scss';

export class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  async loadDelayData() {
    return new Promise((resolve) => setTimeout(() => {
      this.setState({ 'hello': 'world' });
      resolve();
    }, 1000));
  }
  
  componentDidMount() {
    this.loadDelayData();
  }

  render() {
    const { hello } = this.state;
    return (
      <div>
        <p className='logo'>
          epii render
        </p>
        <p>
          <a href="https://github.com/epiijs/epii-render">
            github.com/epiijs/epii-render
          </a>
        </p>
        <Euler />
        <p>{ hello }</p>
      </div>
    );
  } 
}
