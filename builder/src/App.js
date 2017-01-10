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
// import data from './data/new-test-events-lots.json';
import data from './data/big-data.json';
// Get the data for just top 10 facets...
import tendata from './data/big-data-max-row-1000-max-facet-10.json'
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

    // TODO: state should be empty and loaded from localstorage, if we want something fancy.  
    if (!this.state) {
      this.state = {
        tags: [],
        query: '',
        selected_tags: {},
        onlyTopTenEnabled: false,
        onlyLocalEnabled: false,
        onlyLocalVal: 'https://testbed13.ccs.mcgill.ca/wms'
      };
    }
    this.handleTagClick = this.handleTagClick.bind(this);
    this.onlyLocal = this.onlyLocal.bind(this);
    this.onlyTopTen = this.onlyTopTen.bind(this);
  }
  // Blows away all tag states.
  reset(){
    this.setState({selected_tags:{}});
  }

  // Toggles the onlyLocal filtering.
  onlyLocal(){
    console.log('parent local');
    if (this.state.onlyLocalEnabled === false || !this.state.onlyLocalEnabled) {
      this.setState({onlyLocalEnabled: true}, function(){
        // This is kinda crappy.  Too high-level, just blasts away everything...
        this.getAllTags(data);
      });
    } else {
      this.setState({onlyLocalEnabled: false}, function(){
        // This is kinda crappy.  Too high-level, just blasts away everything...
        // Need a lower level tag and doc filtering not smash it all.
        this.getAllTags(data);
      });
    }
    // TODO: need the actual callback after setState to do filtering and update tags.
  }
  // Toggles the top ten filtering.
  onlyTopTen(){
    if (this.state.onlyTopTenEnabled === false || !this.state.onlyTopTenEnabled) {
      this.setState({onlyTopTenEnabled: true}, function(){
        // Changes whole query and resets UI. Daunting!
        console.log('changing top-ten to true');
        console.log(this.state.onlyTopTenEnabled);
        console.log('gettin moar/diff data!');
        // Think I need to blow away all the other states... Need a reset?
        this.reset();
        // this.getAllTags(tendata);

        // Dont really need tendata - its just a big data haul to update just the tags, handle it all front-end instead.
        this.getAllTags(data);
      });
    } else {
      this.setState({onlyTopTenEnabled: false}, function(){
        console.log(this.state.onlyTopTenEnabled);
        // Resets to original query.
        this.reset();
        this.getAllTags(data);
      });
    }
    // TODO: need the actual callback after setState to do filtering and update tags.
  }

  // Updates the state of the tags based on filter actions.
  updateTags(docs) {
    // For filter check if its in any of docs (ideally docs are narrowed at this point) if it is, its still enabled, if it isn't disable it.'
    console.log('updating tags');
    var that = this;
    _.each(that.state.tags, function(tag, whichTag) {
      var deadEnd = [];
      tag.count = 0;
      _.each(docs, function(doc) {
        // TODO make this not hardcoded....and better var name
        // var extry = doc['ss_field_source_site:url'] !== 'https://testbed13.ccs.mcgill.ca/wms';
        var extry = false;
        if (that.state.onlyLocalEnabled) {
            extry = doc['ss_field_source_site:url'] !== that.state.onlyLocalVal;
        }

        if(_.indexOf(doc['sm_field_tags:name'], tag.title) < 0 || extry) {
          deadEnd.push(false);
          // console.log('count', tag.count);
        } else {
          // Fix this operator up.
          tag.count = tag.count + 1;
          deadEnd.push(true);
        };
      });
      // TODO clean up these conditionals, kinda ugly.
      if (_.indexOf(deadEnd, true) < 0) {
        console.log('real deadend!', tag.title);
        tag.enabled = 'disabled';
        var tagUpdtd = that.state.tags[whichTag];
        that.setState({tagUpdtd: tag});
      } else {
        tag.enabled = 'enabled';
        var tagUpdtd = that.state.tags[whichTag];
        that.setState({tagUpdtd: tag});
      }
    });
    // console.log(that.state.tags);
  }

  filterData(data, cb) {
    // console.log('Re-filtering data for the calendar based on...');
    // console.log(this.state.selected_tags);
    var filterDocs = data.response.docs;
    var filters = this.state.selected_tags;
    // Only do filtering if there are any filters.
    if (!_.isEmpty(filters)) {
      // Filter through each doc, and check if its tags match ours selected.
      filterDocs = _.filter(filterDocs, function(obj) {
        var includeChecks = [];
        // Check each filter against the doc.
        _.each(filters, function(filter){
          // console.log(_.indexOf(obj['sm_field_tags:name'], filter.title) >= 0, obj.id);
          // array that if includes one false, excludes the doc (AND operator)
          includeChecks.push(_.indexOf(obj['sm_field_tags:name'], filter.title) >= 0);
        });
        // TODO fix up this hard to follow boolean logic.  Make it more legible.
        console.log(obj.id, includeChecks, _.indexOf(includeChecks, false) >= 0);
        return _.indexOf(includeChecks, false) < 0;
        // return true;
      });
      // console.log('filtered docs', filterDocs);
    } else {
      // console.log('non-filtered docs', filterDocs);
    }
      // TODO update status of remaining tags (i.e. disable if they're dead ends.)
    this.updateTags(filterDocs);
    // TODO fix up this callback design.  Kinda weird.
    cb(filterDocs);
    // var that = this;
    // _.each(this.state.selected_tags, function(val){
    //   console.log(that.state.selected_tags[val].title);
    // })
    
  }

  // Now update the calendar.
  updateCal(docs) {
    console.log('filtered docs', docs);
  }

  handleTagClick(tag) {
    if (tag.enabled !== 'disabled') {
      // Update the tag display and the state to hold which tags are selected.
      // console.log('tag clicked', tag);
      var selected = this.state.selected_tags;
      // If the tag isn't already selected.
      if (_.has(selected, tag.id) === false) {
        selected[tag.id] = tag;
        // console.log('adding tag', selected);
      } else {
        _.unset(selected, [tag.id]);
        // console.log('removed', selected);
      }
        
      this.setState({selected_tags: selected}, function(){
        // Now filter the data.
        // console.log(this.state.selected_tags);
        this.filterData(data, this.updateCal);
      });
    
    }
  }
  getAllTags(data) {
    // TODO: need to filter out all the tags that have a 0 count, so probably need to bring back the counts....
    // console.log('mounted');
    // console.log(this.state);
    // This is fixture stuff, should be wrapped in AJAX call.
    var raw = data.facet_counts.facet_fields['sm_field_tags:name'];
    // console.log(data);
    // console.log(raw);
    var newTags = [];
    raw.map((entry, key)=>{
      // Ugh. the facet_field object is stoopid!
      // Just getting the tags, not the counts. Although the counts might be usefull...
      // TODO: investigate using just the tags with a count over certain threshold, will fix issue where we return a million tags. Although politics will ruin that plan :P
      if (typeof(entry) === 'string') {
        newTags.push({
          id: shortid.generate(),
          title: entry
        })
      }
      // Intevene to expose only top-ten tags.
      if (this.state.onlyTopTenEnabled) {
        // Changing it to 15-bad variable and function names now...
        newTags = _.slice(newTags, 0, 15);
      }
      return newTags;
    });
    this.setState({
      tags: newTags
      },
      function(){
        this.updateTags(data.response.docs);
        console.log('updating state from server');
    });
  }
  componentDidMount() {
    // Get all of the tags for the UI.
    // Run update on all tags right away?
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
          Build a calendar by selecting available tags.  NB: tags that have no events associated with them in this set of events are disabled. Selecting tags narrows the set.
        </p>
        <h3>Calendar building options: </h3>
        <Local onClick={this.onlyLocal} enabled={this.state.onlyLocalEnabled} label="Only local content:" />
        <TopTen onClick={this.onlyTopTen} label="Showing Only top 15 tags" enabled={this.state.onlyTopTenEnabled}/>
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
            <Tag key={tag.id} title={tag.title} onClick={clicky.bind(this, tag)} toggle={_.has(selected, tag.id)} enabled={tag.enabled || 'enabled'} count={tag.count} />
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
      <div className={'tag selected-'+ this.props.toggle + ' ' + this.props.enabled } onClick={this.props.onClick}>
      {this.props.title} <span className="count">{this.props.count}</span>
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
      </div>
    )
  }
}

class OptionToggle extends Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render () {
    var enabled = this.props.enabled || false;
    return (
      <div className={'option-toggle ' + 'option-' + enabled} onClick={this.props.onClick}>
        {this.props.label} {/*enabled.toString()*/}
      </div>
    )
  }
}

class Local extends OptionToggle {
}

class TopTen extends OptionToggle {
}

// Removes all console calls to actual console.
// console.log = function(){};

export default App;


// General todos:
/**
 * - Sort the tags at first by number of hits? But then does it re-sort? Hrm...the solr response is by most, but I just dont have all the docs to support it! One of the issues with having count...
 * - Have a local/non-local toggle - should cycle through all tags and disable empty ones like updateTags does regularly
 * - Top 10 tag toggle? Simplifies the UI, but limits utility. Still might be useful to think about since it sorta forces content creators to think in terms of top-ten or twenty tags (this would work well with sorting)
 * - Investigate solr query more - i.e. limit tags to top 10? see about getting a lot more docs, and maybe facet count for that result set, not the total result set. That would be a key distinction.  
 * - Seems can get top 10 facets - but that should trigger a whole new data query/source. Which is ok. TODO: add top-10 funcitonality that gets new data set with only top-10 facets.  Hmmm...issue with this is that facet changes (in count) doesn't limit results, just the returned facets so its not really worth another trip to the server....99% of the data is identical. Easier tho...
 * - So, showing only top 15 or whatever is interesting in that as you click a facet there should be a new top 15 and we could do this by ordering tags on number before slicing, BUT if we don't, then it reveals what events are COMMON to the top 15 only, emphasizing those categories always, which in fact is useful
 * - Arguably top 15 should be enabled by default.
 * - Maybe order the tags in alphabetical order.
 * - If alphabetical maybe ditch the numbers? Are they misleading?
 * - TODO: split this file up, its getting fugly. App  component should have own file.
 * - Only local should be a lower lvl toggle like facets, top 10 facets should be higher level?
 * - Hrm, these top 15 and only local complicate matters - they are ANDS right? and are they on same level as any other filter? Not the top 15 I guess...only local should be/could be a tag (facet) like any other I'm sure?
 */