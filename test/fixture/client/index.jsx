import React, {Component} from 'react'
import './index.scss';

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  async loadAsync() {
    this.setState({ async: true });
  }

  render() {
    return (
      <div>index view</div>
    )
  }
}
