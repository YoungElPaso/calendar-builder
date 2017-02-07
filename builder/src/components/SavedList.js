import React, { Component } from 'react'

// Using some components from blueprintjs for notices etc.
import {
    Popover,
    Position,
    Menu,
    MenuItem,
    MenuDivider,
    PopoverInteractionKind
} from "@blueprintjs/core";

import calendarIcon from '../calendar-icon.svg';

/**
 * Holds list of saved states.
 */
class SavedList extends Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render () {
    var reset = this.props.reset;
    var showHelp = this.props.help;
    var saves = this.props.saves || [];
    var saveStatus = this.props.saveStatus;
    var saveHandler = this.props.saveHandler;
    var saveFileName = this.props.saveFileName;
    var handleTitleChange = this.props.handleTitleChange;
    var doFileLoad = this.props.doFileLoad;

    var loadPlaceHolder = "";
    if (saves.length < 1) {
      loadPlaceHolder = (
        <MenuDivider title="No calendars to load yet!" />
      )
    } else {
      loadPlaceHolder = (
        <MenuDivider title="Select a calendar to load" />
      )
    }
    var menuContent = (
      <div className="saved-list">
          <Menu>
              {loadPlaceHolder}
              {
                saves.map((save) =>
                  <MenuItem
                    iconName="calendar"
                    key={save.id}
                    text={save.title}
                    onClick={doFileLoad.bind(this, save)}
                  />
                )
              }
          </Menu>
      </div>
    );

    var saveField = (
      <div>

        <input className="pt-input" type="text" width="300px" placeholder="Enter a name for your calendar" onChange={handleTitleChange} value={saveFileName}/> 
        &nbsp;
        <button
          className={"pt-button pt-intent-primary pt-icon-document " + saveStatus}
          onClick={saveHandler.bind(this)}
          >
            Save
        </button>
      </div>
    )

    return (
      <nav className="pt-navbar pt-fixed-top">
        <div className='pt-navbar-group pt-align-left'>
            <img src={calendarIcon} className="" alt="logo"  height="50px" />
          <div className="pt-navbar-heading">
            CalendarBuilder v1.0
          </div>
          <span className="pt-navbar-divider"></span>
          
          {saveField}
          <span className="pt-navbar-divider"></span>
          <Popover content={menuContent}
            interactionKind={PopoverInteractionKind.CLICK}
            popoverClassName="pt-popover-content-sizing"
            position={Position.BOTTOM}
            useSmartPositioning={false}>
            <button className="pt-button pt-intent-primary pt-icon-document-open">Load</button>
          </Popover>
        </div>
        <div className='pt-navbar-group pt-align-right'>
          <button
            onClick={reset.bind(this)}
            className="pt-button pt-intent-primary pt-icon-remove">
            Reset filters
          </button>
          <span className="pt-navbar-divider"></span>
          <button
            onClick={showHelp.bind(this)}
            className="pt-button pt-intent-primary pt-icon-help">
            Help
          </button>
        </div>
      </nav>
    );
  }
}

export default SavedList