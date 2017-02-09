import React, { Component } from 'react';

// Using some components from blueprintjs for notices etc.
import {
    Toaster,
    Intent,
    Position,
    Popover,
    Dialog,
    ProgressBar,
    PopoverInteractionKind
} from "@blueprintjs/core";

// Import the DB implmenetation that uses lokijs.
import Database from './saving.js';

// Need moment to work w/ fullCalendar events.
import moment from 'moment';

// Need lodash utilities for arrays and JSON filtering.
import _ from 'lodash';
// Need shortid to create some nice short ids.
import shortid from 'shortid';
// Need hasha to create some hashes of titles for saving.
import hasha from 'hasha';

// Need some sample data.
// Use lodash filtering to create a function that locally re-queries the JSON based on facets selected. No need to keep going back to the server.
// import data from './data/big-data.json';
var data = {};

// Bring in the css.
import './App.css';

// Import a bunch of sub-components.
import Calendar from './components/Calendar.js'
import Autoload from './components/Autoload.js'

class Client extends Component {
  constructor(props) {
    super(props);
    // The app state holds the tags we initially get, the inital query and other things.

    // If there is no state, set some initially.
    if (!this.state) {
      this.state = {
        firstRun: true,
        persist: true,
        saves: [],
        tags: [],
        query: '',
        selected_tags: {},
        onlyTopTenEnabled: true,
        hideTagsAfter: 15,
        onlyLocalEnabled: false,
        onlyLocalVal: 'https://testbed13.ccs.mcgill.ca/wms'
      };
    }
    // Binds all tags.
    this.handleTagClick = this.handleTagClick.bind(this);
    // Binds show/hide local content only button.
    this.onlyLocal = this.onlyLocal.bind(this);
    // Binds show/hide tags button.
    this.onlyTopTen = this.onlyTopTen.bind(this);
    // Binds reset button.
    this.reset  = this.reset.bind(this);
    // Binds showHelp buttons.
    this.showHelp = this.showHelp.bind(this);
    // Binds save button.
    this.doSave = this.doSave.bind(this);
    // Binds handling title change.
    this.handleTitleChange = this.handleTitleChange.bind(this);
    // Binds loading from load menu.
    this.doFileLoad = this.doFileLoad.bind(this);



    // If persistance is on, we can check some things, like first run,
    // and saved states.
    if(this.state.persist){
      // Instantiate a Database object (contains LokiJS DB and methods for writing/saving - used for persisting state).
      this.dBObject = new Database();
      this.dBObject.create();
    }
      // // If we have a db that has a collection already, then its not first run. 
      // var checkCol = this.dBObject.checkCollections(this.dBObject.holder, 'saves');
      // if (checkCol) {
      //   this.toggleFirstRun(false);
      // } else {
      //   this.toggleFirstRun(true, function(){
      //     this.setState({showingHelp: true});
      //   });
      // }

      // var saves = this.dBObject.doLoad().results;
      // // Need to update state w/ list of saved states.
      // that.listSaves(saves);
    

  }

  // Sets the file name to save.
  handleTitleChange(event){
    this.saveDirty(false);
    this.setState({saveFileName: event.target.value}, function(){
    });
  }

  // Just toggles 'firstRun' state variable and runs a callback.
  toggleFirstRun(boolean, callback){
    this.setState({firstRun: boolean}, callback);
  }

  // Shows the help text or not.
  showHelp(){
    if(!this.state.showingHelp) {
      this.setState({showingHelp: true}, function(){
      });
    } else {
      this.setState({showingHelp: false}, function(){
      });
    }
  }

  // Create a toaster for 'toast messages'.
  createToaster(){
    var toastHolder = document.getElementsByClassName('toasties')[0];
    // Instantiate Toaster.
    this.toast = Toaster.create({
      className: "my-toaster",
      position: Position.TOP,
      timeout: 3000,
      inline: false,
    }, toastHolder);
  }

  // Blows away all filter states.
  reset(callback){
    var callback = callback;
    if (!_.isEmpty(this.state.selected_tags) || this.state.onlyLocalEnabled || typeof(callback) == 'function') {
    // Again, blow away a save if actually resetting
    this.saveDirty(false);
    this.setState({selected_tags: {}, onlyLocalEnabled: false}, function(){
      if(typeof(callback) == 'function') {
        callback();
      } else {
        // Default action on reset?
        this.filterData(data);
      }
    });
    } 
  }

  // Toggles the onlyLocal filtering.
  onlyLocal(enabling){
    // Again, new filter change, dirty.
    this.saveDirty(false);  

    // All interatctions should blow away pre-existing toast notices since they might be invalidated.
    this.toast.clear();

    if (enabling == true) {
      if (this.state.onlyLocalEnabled == false) {
        this.setState({onlyLocalEnabled: true}, function(){
          // Better approach would be same as handling tag click...
          // Now filter the data.
          this.filterData(data);
        });
      };
    } else if (enabling == false) {
      if (this.state.onlyLocalEnabled == true) {
        this.setState({onlyLocalEnabled: false}, function(){
          // This is kinda crappy.  Too high-level, just blasts away everything...
          // Need a lower level tag and doc filtering not smash it all.
          // this.getAllTags(data);
          this.filterData(data);
        });
      }
    }
  }

  // Toggles the top ten filtering.
  onlyTopTen(){
    // All interatctions should blow away pre-existing toast notices since they might be invalidated.
    this.toast.clear();
    // Overriding to disable this feature. Instead will provide feedback.
    // Less user-hostile.
    var cantHide = false; 
    if ((this.state.onlyTopTenEnabled === false || !this.state.onlyTopTenEnabled) && !cantHide) {
      var that = this;
      // Check if selected tags would become invisible if most are collapsed. Ie. if this is activated.
      var selected = this.state.selected_tags;
      var ceiling = this.state.hideTagsAfter;
      cantHide = _.some(selected, function(tag){
        //TODO: the logic above is faulty, message appears too often.
        that.toast.show({
          message: 'Just an FYI, you might be hiding some of your selected tags!',
          timeout: 4000
        })
        return tag.num > ceiling;
      });

      this.setState({onlyTopTenEnabled: true}, function(){
        // Now just a glorified show/hide...
        _.each(that.state.tags, function(tag, whichTag) {
          if (whichTag < that.state.hideTagsAfter) {
            tag.visible = true;
          } else {
            tag.visible = false;
          }
          var tagUpdtd = that.state.tags[whichTag];
          that.setState({tagUpdtd: tag});
        });

      });
    } else {
      var that = this;
      this.setState({onlyTopTenEnabled: false}, function(){
        // Now just a glorified show/hide...
        _.each(that.state.tags, function(tag, whichTag) {
          tag.visible = true;
          // console.log(whichTag);
          var tagUpdtd = that.state.tags[whichTag];
          that.setState({tagUpdtd: tag});
        });

      });
    }
  }

  // Updates the state of the tags based on filter actions.
  updateTags(docs) {
    // For filter check if its in any of docs (ideally docs are narrowed at this point) if it is, its still enabled, if it isn't disable it.'
    var that = this;
    _.each(that.state.tags, function(tag, whichTag) {
      var deadEnd = [];
      tag.count = 0;
      _.each(docs, function(doc) {
        // TODO make this not hardcoded....and better var name
        var extry = false;
        if (that.state.onlyLocalEnabled) {
            extry = doc['ss_field_source_site:url'] !== that.state.onlyLocalVal;
        }

        if(_.indexOf(doc['sm_field_tags:name'], tag.title) < 0 || extry) {
          deadEnd.push(false);
        } else {
          // Fix this operator up.
          tag.count = tag.count + 1;
          deadEnd.push(true);
        };
      });
      // TODO clean up these conditionals, kinda ugly.
      if (_.indexOf(deadEnd, true) < 0 ) {
        tag.enabled = 'disabled';
        var tagUpdtd = that.state.tags[whichTag];
        that.setState({tagUpdtd: tag});
      } 
      else {
        tag.enabled = 'enabled';
        var tagUpdtd = that.state.tags[whichTag];
        that.setState({tagUpdtd: tag});
      }
    });

    // Do a simple check to see if all the filters are disabled, inform user they are.
    var allDisabled = _.every(that.state.tags, function(tag, whichTag) {
      return tag.enabled == 'disabled';
    });
    if (allDisabled) {
      this.toast.show({
        message:'There are no valid tags for your filter. Try again.',
        intent: Intent.PRIMARY,
        timeout: 4000
      });
    }
  }

  filterData(data, cb) {
    // 'Re-filtering data for the calendar.
    var filterDocs = data.response.docs;
    var filters = this.state.selected_tags;
    var doLocalFilter = this.state.onlyLocalEnabled;
    var onlyLocalVal = this.state.onlyLocalVal;

    // Only do filtering if there are any filters.
    if (!_.isEmpty(filters) || doLocalFilter) {
      // Filter through each doc, and check if its tags match ours selected.
      filterDocs = _.filter(filterDocs, function(obj) {
        var includeChecks = [];
        // Check each filter against the doc.
        _.each(filters, function(filter){
          // array that if includes one false, excludes the doc (AND operator)
          includeChecks.push(_.indexOf(obj['sm_field_tags:name'], filter.title) >= 0);
        });
        // New! Filters aren't only tags. This tag stuff above ^ is way to tightly coupled...
        // Gotta do a check for localOnly for includeChecks
        var extry = true;
        if (doLocalFilter) {
            extry = obj['ss_field_source_site:url'] == onlyLocalVal;
            includeChecks.push(extry);
        }
        // TODO fix up this hard to follow boolean logic.  Make it more legible.
        return _.indexOf(includeChecks, false) < 0;
      });

    } else {
      // console.log('non-filtered docs', filterDocs);
    }
    // Probably should set the state to include filteredDocs count...
    this.setState({foundDocsCount: filterDocs.length});
    // Update status of remaining tags (i.e. disable if they're dead ends.)
    this.updateTags(filterDocs);
    this.updateCal(filterDocs);
  }

  // Not even sure what this does anymore...
  static calObj = {id:'foobar'}

  // Now update the calendar.
  updateCal(docs) {
    if (docs.length > 0) {
      // Hide other toasts, show one about loading events.
      if(this.toast) {
        this.toast.clear();
      }
      this.toast.show({
        message: (
          <div>
            <span className="pt-ui-text-large">{'Loading ' + docs.length + ' events'}</span>
            <ProgressBar
              className="block"
              intent={Intent.PRIMARY}
              value={1}
            />
          </div>
        ),
        timeout: 1500
      });
    }

    var cal = this.calObj;
    // Remove all events that were there before.
    cal.removeEvents();    
    // Init an empty array to hold our events.
    var eventCollection = [];
    // Loop through all events and put them on the calendar.
    _.each(docs, function(doc){
      // Get start and end dates, convert them to UTC w/ moment.
      var start = doc['ds_field_channels_event_date:value'];
      var end = doc['ds_field_channels_event_date:value2'];
      var momStart = moment.utc(start);
      var momEnd = moment.utc(end);
      var newEvent = {
        title: doc['tm_title'][0],
        start: momStart,
        end: momEnd
      }
      eventCollection.push(newEvent);
    });
    // This is much better than calling renderEvent on each event in loop.
    cal.addEventSource(eventCollection);
  }

  // Handles tag click events.
  handleTagClick(tag) {
    // As soon as you click, you dirty the state that may have been saved.
    this.saveDirty(false);

    // All interactions should blow away pre-existing toast notices since they might be invalidated.
    this.toast.clear();

    if (tag.enabled !== 'disabled') {
      // Update the tag display and the state to hold which tags are selected.
      var selected = this.state.selected_tags;
      // If the tag isn't already selected.
      if (_.has(selected, tag.id) === false) {
        selected[tag.id] = tag;
      } else {
        _.unset(selected, [tag.id]);
      }
        
      this.setState({selected_tags: selected}, function(){
        // Now filter the data.
        this.filterData(data);
      });
    
    }
  }

  // Indicate things have changed since save 'dirty'.
  saveDirty(bool) {
    this.setState({saveStatus: bool});
  }

  // Creates a set of tags from the data provided.
  getAllTags(data) {
    // This is fixture stuff, should be wrapped in AJAX call.
    var raw = data.facet_counts.facet_fields['sm_field_tags:name'];
    var newTags = [];
    var isVisVal;
    if (this.state.onlyTopTenEnabled) {
      isVisVal = this.state.hideTagsAfter;
    } else  {
      isVisVal = null;
    }

    raw.map((entry, key)=>{
      // Ugh. the facet_field object is stoopid!
      // Just getting the tags, not the counts. Although the counts might be usefull...
      // TODO: investigate using just the tags with a count over certain threshold, will fix issue where we return a million tags. Although politics will ruin that plan :P
      if (typeof(entry) === 'string') {
        // Argh! my beautiful simple code is turning into spaghetti!
        var isVis = isVisVal? isVisVal > key / 2 : true;
        newTags.push({
          num: key/2,
          id: hasha(entry),
          title: entry,
          visible: isVis,
          enabled: 'disabled'
        })
      }
      // Intevene to expose only top-ten tags.
      if (this.state.onlyTopTenEnabled) {
        // Changing it to 15-bad variabl@e and function names now...
        // newTags = _.slice(newTags, 0, 15);

        // Just gonna make the others invisible.
      }
      return newTags;
    });
    this.setState({
      tags: newTags
      },
      function(){
        this.updateTags(data.response.docs);
    });
  }

  // Lists the saved states (search configurations) to be loaded.
  listSaves(saves) {
    this.setState({
      saves: saves
    },
      function(){
      }
    )
  }

  // Holds dBObject for later reference in this scope.
  static dBObject = {}

  // Loads a 'file' from ocal storage via LokiJS.
  doFileLoad(save) {
    // Need to actually load the save from storage, dont rely on menu.
    var t = this;
    // Call reset and once that's done, set new state.
    // this.reset(function(){
    // Theres a bug somewhere were save here gets updated (probably cause it derives some props from state, which gets updated and so updates save) TRICKY! So we need to actually reload the DB version of the save.
    var dbSave = t.dBObject.getAResult(t.dBObject.holder, t.dBObject, save);
    var loaded = dbSave;
    // Get state out of the loaded save.
    var st = loaded.state;
    var title = loaded.title;
    var selected_tags = st.selected_tags;
    var onlyLocalEnabled = st.onlyLocalEnabled;
      // Set these elements of the state to be that of the save.
      // & Set the saveFileName to be that of the save
      t.setState(
        {
          selected_tags: selected_tags,
          onlyLocalEnabled: onlyLocalEnabled,
          saveFileName: title,
          loadedCal: true,
          saveStatus: 'pt-icon-saved pt-intent-success'
        }, function(){
          // Run with our new state.
          t.filterData(data);
      });
    // });
  }

  // Saves a calendar configuration to localstorage with LokiJS.
  doSave(title){
    var title = this.state.saveFileName;
    if (!title) {
      // Set a default if one hasn't been entered.
      title = 'Untitled'
      this.setState({saveFileName: title});
    }
    var selected_tags = this.state.selected_tags;
    var onlyLocalEnabled = this.state.onlyLocalEnabled;
    var testDoc = {
      id: shortid.generate(),
      title: title,
      titleHash: hasha(title, {algorithm: 'md5'}),
      state: {
        selected_tags: selected_tags,
        onlyLocalEnabled: onlyLocalEnabled
      }
    }
    var t = this;
    var stat = this.dBObject.writeToSaves(this.dBObject.holder, 'saves', testDoc, 'w')
    if (stat == true) {
      t.dBObject.holder.saveDatabase();
      t.dBObject.getResults(t.dBObject.holder, t.dBObject);
      t.listSaves(t.dBObject.results);
      // And update the UI.
      t.toast.show({
          message: (<span className='pt-ui-text-large'>{testDoc.title} saved</span>),
          timeout: 1000,
        });
      t.setState({saveStatus: 'pt-icon-saved pt-intent-success'}, function(){
      });
    } else {
        var stat = this.dBObject.writeToSaves(this.dBObject.holder, 'saves', testDoc, 'u');
        t.dBObject.holder.saveDatabase();
        t.dBObject.getResults(t.dBObject.holder, t.dBObject);
        t.listSaves(t.dBObject.results);
      // Update the UI.
        t.toast.show({
            message: (<span className='pt-ui-text-large'>{testDoc.title} updated</span>),
            timeout: 1000,
          });
      t.setState({saveStatus: 'pt-icon-saved pt-intent-success'}, function(){
      });
    }
  }

  // React lifecycle method: when the main App component loads, start doing somethings...
  componentDidMount() {
    // Trying fetch...
    var that = this;
    fetch ('/super-data.json')
    .then(function(response){
      response.json().then(function(json){
        console.log('json?', json);
        data = json;

        
        // Get all of the tags for the UI.
        // Run update on all tags right away?
        that.getAllTags(data);

        

      });
    });
        // Init the bloody toaster.
        that.createToaster();
  }
  // The main JSX for rendering the app.  Note all the sub-components.
  render() {
    return (
      <div className="App">

        <Autoload doFileLoad = {this.doFileLoad} save={this.props.params.hash} title={this.state.saveFileName} data={data} loaded={this.state.loadedCal || false} />

        <Dialog
          iconName="calendar"
          isOpen={this.state.showingHelp}
          onClose={this.showHelp}
          title="Getting Started with CalendarBuilder"
        >
          <div className="pt-dialog-body">
            <h5>Basics</h5>
            <p>
            To create a calendar, start by selecting some tags to narrow down the types of events you'd like to display. You can also choose the source of the events.  A preview of your calendar will appear based on your selections. <br/>
            <em>NB. this is just a preview, the real calendar may vary slightly.</em>
            </p>
            <h5>Saving & Loading</h5>
            <p>
            If you like how your calendar appears, and are happy with your filters you can give it a name and save it.  Once there's at least one calendar saved, you can reload it next time you use the builder.
            </p>
            <hr />
            <p>This message will self-destruct, but you can see it again, by clicking the <span className="pt-icon-standard pt-icon-help"></span> Help button in the top-right of the window.
            </p>

          </div>
        </Dialog>

        <div className="toasties"></div>
        
        <Popover
          content={this.state.foundDocsCount + ' matching events.'}
          isOpen={false /*this.state.foundDocsCount > 0*/}
          inline={true} 
          interactionKind={PopoverInteractionKind.CLICK}
          popoverClassName="pt-popover-content-sizing"
          position={Position.TOP_LEFT}
          useSmartPositioning={false}>
          <Calendar id="search-calendar" parent={this}/>
        </Popover>
      </div>
    );
  }
}

export default Client;


// General todos:
/**
 * TODO: remove toolbar, just want calendar.
 * TODO: using router, load a default filter from url hash (i.e a tag) so no user entered tag UI is required
 * TODO: load data, via request, not bundled, illustrate how this can be done. So flow looks like this: init, load data, filter based on url hash value for tag, update calendar.
 */
