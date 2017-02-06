import React, { Component } from 'react';

/**
 * Is one tag.
 */
class Tag extends Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render () {
    return (
      <div className={'tag selected-'+ this.props.toggle + ' ' + this.props.enabled + ' viz-' + this.props.visible} onClick={this.props.onClick}>
      {this.props.title} <span className="count">{this.props.count}</span>
      </div>
    );
  }
}

export default Tag