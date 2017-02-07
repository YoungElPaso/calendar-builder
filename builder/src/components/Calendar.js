import React, {Component} from 'react'

// Need fullcalendar.
import 'fullcalendar'
// Need jQuery.
import jQuery from 'jquery'


class Calendar extends Component {
  componentDidMount() {
    // TODO: look into this, this seems weird. this parent stuff.
    var parent = this.props.parent;

    // Use the fullCalendar plugin.
    var cal = jQuery('#'+this.props.id).fullCalendar();
    parent.calObj = jQuery('#'+this.props.id).fullCalendar('getCalendar');

  }
  render() {
    return (
      <div className="calendar-element" id={this.props.id}>
      </div>
    )
  }
}

export default Calendar