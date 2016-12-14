import React, { Component } from 'react';
// Need fullcalendar.
import 'fullcalendar';
// Think we need jQuery.
import jQuery from 'jquery';
// Need lodash utilities for arrays and JSON filtering.
import _ from 'lodash';
// Need shortid to create some nice short ids.
import shortid from 'shortid';

// Need a nice icon.
import calendarIcon from './calendar-icon.svg';
// Need some sample data.
// import data from './data/test13-channels-index-with-tagname-facet.json';

// TODO: try filtering on client side, instead of extra ajax for prototype.
// Yeah use lodash filtering to create a function that locally re-queries the JSON based on facets selected. No need to keep going back to the server.
import data from './data/new-test-events.json';
// Bring in the css.
import './App.css';


class App extends Component {
  constructor(props) {
    // console.log('constructed');
    super(props);
    // Thought I wanted some dummy data at first, but naw, setState does a merge.
    // var tags = [
    //   // {id:1, title:'foobar'},
    //   // {id:2, title:'barf'},
    //   // {id:3, title:'puke'}
    // ];
    // The app state holds the tags we initially get, the inital query and other things.
    this.state = {tags: [], query: '', selected_tags: {}};
    this.handleTagClick = this.handleTagClick.bind(this);
  }
  filterData(data) {
    console.log('Re-filtering data for the calendar based on...');
    console.log(this.state.selected_tags);
    // var that = this;
    // _.each(this.state.selected_tags, function(val){
    //   console.log(that.state.selected_tags[val].title);
    // })
  }

  handleTagClick(tag) {
    // Update the tag display and the state to hold which tags are selected.
    // console.log('tag clicked', tag);
    var selected = this.state.selected_tags;
    // If the tag isn't already selected.
    if (_.has(selected, tag.id) === false) {
      // selected.push(tag);
      selected[tag.id] = tag;
      // selected[tag.id] = tag;
      console.log('adding tag', selected);
    } else {
      _.unset(selected, [tag.id]);
      console.log('removed', selected);
    }
      //TODO: duh! figure out the slice/drop or whatver method. WHy does this still run w/ old state? need replaceState?
    this.setState({selected_tags: selected}, function(){
      // console.log(this.state);
      // console.log(selected);
      // console.log(!_.indexOf(selected, tag.id));
      // Now filter the data.
      console.log(this.state.selected_tags);
      this.filterData(data);
      // Now update the calendar.
      // this.updateCal();
    });
    
  }
  getAllTags(data) {
    // console.log('mounted');
    // console.log(this.state);
    // This is fixture stuff, should be wrapped in AJAX call.
    var raw = data.facet_counts.facet_fields['sm_field_tags:name'];
    // console.log(data);
    // console.log(raw);
    var newTags = [];
    raw.map((entry, key)=>{
      // Ugh. the facet_field object is stoopid!
      // Just getting the tags, not the counts.
      if (typeof(entry) === 'string') {
        newTags.push({
          id: shortid.generate(),
          title: entry
        })
      }
      return newTags;
    });
    this.setState({
      tags: newTags
      },
      function(){
        console.log('updating state from server');
    });
  }
  componentDidMount() {
    // Get all of the tags for the UI.
    this.getAllTags(data);
  }
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={calendarIcon} className="App-logo" alt="logo" />
          <h2>Welcome to Calendar Builder 1.0</h2>
        </div>
        <p className="App-intro">
          This app will access Solr and spew out some tags to filter by and eventually show a calendar.
        </p>
        <TagList tags={this.state.tags} clicky={this.handleTagClick} selected={this.state.selected_tags}/>
        <Calendar id="search-calendar"/>
      </div>
    );
  }
}

/**
 * Holds a bunch of tags.
 */
class TagList extends Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render () {
    // console.log('rendered');
    // This seems weird, but I gotta pass down the click handler.
    // There's other methods I guess.
    // TODO investigate how one is to do this. What's the reac-way? Passing down a big component that holds all methods?
    var clicky = this.props.clicky;
    var selected = this.props.selected;
    return (
      <div className={"tag-list"}>
        <h3>Available tags:</h3>
        {
          this.props.tags.map((tag) =>
            <Tag key={tag.id} title={tag.title} onClick={clicky.bind(this, tag)} toggle={_.has(selected, tag.id)} />
          )
        }
      </div>
    );
  }
}

// function doFoo() {
//   console.log('foo');
// }

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
      <div className={'tag selected-'+ this.props.toggle} onClick={this.props.onClick}>
      {this.props.title}
      </div>
    );
  }
}

// TODO: merge this with taglist (should be one big Component).
class Calendar extends Component {
  componentDidMount() {
    // Use the fullCalendar plugin.
    jQuery('#'+this.props.id).fullCalendar();
  }
  render() {
    return (
      <div className="calendar-element" id={this.props.id}>
        <h2> TODO: The calendar goes here? This needs to go? Its not replaced? WEird</h2>
      </div>
    )
  }
}

export default App;
