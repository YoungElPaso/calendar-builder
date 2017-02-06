import React, { Component } from 'react';

class OptionToggle extends Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render () {
    // We can use a bunch of these props to have very dynamic labels.
    // Two such toggles, with states that are opposites can act like a switch.
  
    var enabled = this.props.enabled || false;
    var optname = this.props.optname || null;
    var label = this.props.label;
    var enabledString = this.props.enabledString || null; 
    var disabledString = this.props.disabledString || null

    var optXtraClass = this.props.extraClass || null;

    if (disabledString && enabledString) {
      if (enabled) {
        label = this.props.enabledString;
      } else {
        label = this.props.disabledString;
      }
    }
    return (
      <div className={'option-toggle option-xtras-' + optXtraClass + ' option-name-' + optname + ' option-' + enabled} onClick={this.props.onClick}>
        {label}&nbsp;
      </div>
    )
  }
}

export default OptionToggle