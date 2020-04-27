import React, { Component } from 'react';
import Euler from './component/Euler';
import './index.scss';

export class HomePage extends Component {
  render() {
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
      </div>
    );
  } 
}
