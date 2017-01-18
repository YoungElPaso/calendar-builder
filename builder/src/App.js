import React, { Component } from 'react';

// Using some components from blueprintjs for notices etc.
import {
    Button,
    Toaster,
    Intent,
    Position,
    Popover,
    Menu,
    MenuItem,
    Navbar,
    EditableText,
    Dialog,
    PopoverInteractionKind
} from "@blueprintjs/core";

// Import the DB implmenetation that uses lokijs.
import Database from './saving.js';
// Need fullcalendar.
import 'fullcalendar';
// Think we need jQuery.
import jQuery from 'jquery';
// Need lodash utilities for arrays and JSON filtering.
import _ from 'lodash';
// Need shortid to create some nice short ids.
import shortid from 'shortid';
// Need hasha to create some hashes of titles for saving.
import hasha from 'hasha';

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
        firstRun: true,
        persist: true,
        saves: [
          // {id:3, title:'fake saved item'},
          // {id:4, title:'another fake item'}
        ],
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
  }

  handleTitleChange(event){
    this.saveDirty(false);
    this.setState({saveFileName: event.target.value}, function(){
      console.log('newname', this.state.saveFileName);
    });
  }

  // Just toggles 'firstRun' state variable and runs a callback.
  toggleFirstRun(boolean, callback){
    this.setState({firstRun: boolean}, callback);
  }

  showHelp(){
    if(!this.state.showingHelp) {
      this.setState({showingHelp: true}, function(){
      console.log('toggle true', this.state);
      });
    } else {
      this.setState({showingHelp: false}, function(){
      console.log('toggle false');
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
  reset(){
    if (!_.isEmpty(this.state.selected_tags) || this.state.onlyLocalEnabled) {
    // Again, blow away a save if actually resetting
    this.saveDirty(false);
    this.setState({selected_tags: {}, onlyLocalEnabled: false}, function(){
      // console.log(this.state);
      this.filterData(data, this.updateCal);
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
          // // This is kinda crappy.  Too high-level, just blasts away everything...
          // // this.getAllTags(data);
          
          // Better approach would be same as handling tag click...
          // Now filter the data.
          // console.log(this.state.selected_tags);
          this.filterData(data, this.updateCal);

          // Might wanna consider overriding hide/show tags if some are hidden.
          // But in practise this is super confusing and doesn't resplect the users choice.  A better option would be a notice...'
          // TODO: update the show fewer tags with number of active hidden tags.
          if (this.state.hasHiddenTags == true && this.state.onlyTopTenEnabled) {
            // this.setState({onlyTopTenEnabled: false}, function(){
            //   this.onlyTopTen();
            // });
            // this.onlyTopTen();
          }
        });
      };
    } else if (enabling == false) {
      if (this.state.onlyLocalEnabled == true) {
        this.setState({onlyLocalEnabled: false}, function(){
          // This is kinda crappy.  Too high-level, just blasts away everything...
          // Need a lower level tag and doc filtering not smash it all.
          // this.getAllTags(data);
          this.filterData(data, this.updateCal);
        });
      }
    }
    // TODO: need the actual callback after setState to do filtering and update tags.
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
        // TODO: return some message about id being disbaled!
        that.toast.show({
          message: 'Just an FYI, you might be hiding some of your selected tags!',
          timeout: 4000,
          intent: Intent.PRIMARY
        })
        return tag.num > ceiling;
      });

      this.setState({onlyTopTenEnabled: true}, function(){
        // Changes whole query and resets UI. Daunting!
        // console.log('changing top-ten to true');
        // console.log(this.state.onlyTopTenEnabled);
        // console.log('gettin moar/diff data!');
        // Think I need to blow away all the other states... Need a reset?
        // this.reset();
        // this.getAllTags(tendata);

        // Dont really need tendata - its just a big data haul to update just the tags, handle it all front-end instead.
        // this.getAllTags(data);

        // Now just a glorified show/hide...
        _.each(that.state.tags, function(tag, whichTag) {
          if (whichTag < that.state.hideTagsAfter) {
            tag.visible = true;
          } else {
            tag.visible = false;
          }
          // console.log(whichTag);
          var tagUpdtd = that.state.tags[whichTag];
          that.setState({tagUpdtd: tag});
        });

      });
    } else {
      var that = this;
      this.setState({onlyTopTenEnabled: false}, function(){
        // console.log(this.state.onlyTopTenEnabled);
        // Resets to original query.
        // this.reset();
        // this.getAllTags(data);

        // Now just a glorified show/hide...
        _.each(that.state.tags, function(tag, whichTag) {
          tag.visible = true;
          // console.log(whichTag);
          var tagUpdtd = that.state.tags[whichTag];
          that.setState({tagUpdtd: tag});
        });

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
      if (_.indexOf(deadEnd, true) < 0 ) {
        // console.log('real deadend!', tag.title);
        tag.enabled = 'disabled';
        var tagUpdtd = that.state.tags[whichTag];
        that.setState({tagUpdtd: tag});
      } 
      // else if (that.state.onlyTopTenEnabled && whichTag >= that.state.hideTagsAfter) {
      //   // Need to double check if we have topten type filter going on.
      //   // tag.enabled = 'disabled';
      // }
      else {
        // Handle case of hidden but useful tag. TODO: this needs to be done probably out of the loop and better. I.e. show all tags and explicitly trigger override. Blah...this is bad...

        // If its not visible, currently disabled, top15 is on and it should be enabled and visible and its NOT in the top 15


        // if (whichTag > that.state.hideTagsAfter && tag.enabled == true && tag.visible == true) {
        //   that.setState({onlyTopTenEnabled: false});
        //   tag.visible = true;
        // }
        //

        // If showing fewer, but we need to see one that is necessry (due to other filter), then we should show all, including that one.
        // console.log(tag.enabled);
        // console.log = function(){};
        // if (that.state.onlyTopTenEnabled && whichTag >= that.state.hideTagsAfter && tag.visible == false && tag.enabled=='enabled') {
        //   console.log('hidey hole!');
        //   that.setState({onlyTopTenEnabled: false});
        //   // show em all.
        //   tag.visible = true;
        // }


        tag.enabled = 'enabled';

        // Maybe flag that there are hidden tags in state? That would work but seems like cheating...But then again, some of these conditions should be an extra, optional layer. Annoying all the same.
        
        if (tag.visible == false && tag.enabled == 'enabled') {
          // console.log('hidden tags!');
          // that.setState({hasHiddenTags: true});
        }

        var tagUpdtd = that.state.tags[whichTag];
        that.setState({tagUpdtd: tag});
      }
    });
    // console.log(that.state.tags);

    // Do a simple check to see if all the filters are disabled, inform user they are.
    var allDisabled = _.every(that.state.tags, function(tag, whichTag) {
      // console.log('enabled?', tag.enabled);
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
    // console.log('Re-filtering data for the calendar based on...');
    // console.log(this.state.selected_tags);
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
          // console.log(_.indexOf(obj['sm_field_tags:name'], filter.title) >= 0, obj.id);
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

        //

        // TODO fix up this hard to follow boolean logic.  Make it more legible.
        // console.log(obj.id, includeChecks, _.indexOf(includeChecks, false) >= 0);
        return _.indexOf(includeChecks, false) < 0;
        // return true;
      });
      // console.log('filtered docs', filterDocs);
    } else {
      // console.log('non-filtered docs', filterDocs);
    }

    // Probably should set the state to include filteredDocs count...
      this.setState({foundDocsCount: filterDocs.length});

    //

      // TODO update status of remaining tags (i.e. disable if they're dead ends.)
    this.updateTags(filterDocs);
    // TODO fix up this callback design.  Kinda weird. This cb should update calendar.
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
    // As soon as you click, you dirty the state that may have been saved.
    this.saveDirty(false);

    // All interatctions should blow away pre-existing toast notices since they might be invalidated.
    this.toast.clear();

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


  // Indicate things have changed since save 'dirty'
  saveDirty(bool) {
    this.setState({saveStatus: bool});
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
    
    if (this.state.onlyTopTenEnabled) {
      var isVisVal = this.state.hideTagsAfter;
    } else  {
      var isVisVal = null;
    }

    raw.map((entry, key)=>{
      // Ugh. the facet_field object is stoopid!
      // Just getting the tags, not the counts. Although the counts might be usefull...
      // TODO: investigate using just the tags with a count over certain threshold, will fix issue where we return a million tags. Although politics will ruin that plan :P
      if (typeof(entry) === 'string') {
        // Argh! my beautiful simple code is turning into spaghetti!
        var isVis = isVisVal? isVisVal > key / 2 : true;
        // console.log(key / 2, isVis);
        newTags.push({
          num: key/2,
          // id: shortid.generate(), this is probably bad, cause its diff everytime we run the function!
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
        console.log('updating state from server');
    });
  }

  // Lists the saved states (search configurations) to be loaded.
  listSaves(saves) {
    console.log('updating state with list of saves');
    this.setState({
      saves: saves
    },
      function(){
        
      }
    )
  }

  static dBObject = {}

  doFileLoad(save) {
    console.log('loading save', save);
    // Get state out of the loaded save.
    var st = save.state;
    var selected_tags = st.selected_tags;
    var onlyLocalEnabled = st.onlyLocalEnabled;
    // Call reset.
    this.reset();
    // Set these elements of the state to be that of the save.
    // & Set the saveFileName to be that of the save
    this.setState(
      {
        selected_tags: selected_tags,
        onlyLocalEnabled: onlyLocalEnabled,
        saveFileName: save.title
      }, function(){
      // Run with our new state.
      this.filterData(data, this.updateCal);
    });

    // TODO: only thing is that the selected tags are not appearing as selected.
  }

  doSave(title){
    var title = this.state.saveFileName;
    if (!title) {
      // Set a default if one hasn't been entered.
      title = 'Untitled'
      this.setState({saveFileName: title});
    }
    console.log('doing a save!', title);
    // var title = 'Foobar';
    // Given that I'm basing it on titleHash and not id, probably should ditch id.
    var selected_tags = this.state.selected_tags;
    var onlyLocalEnabled = this.state.onlyLocalEnabled;
    var testDoc = {
      id: shortid.generate(),
      title: title,
      titleHash: hasha(title),
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
      console.log('new saving...');
      // And update the UI.
      t.toast.show({
          message: 'Saved!',
          timeout: 1000,
          intent: Intent.SUCCESS
        });
      t.setState({saveStatus: 'pt-icon-saved pt-intent-success'}, function(){
      });
    } else {
        var stat = this.dBObject.writeToSaves(this.dBObject.holder, 'saves', testDoc, 'u');
        t.dBObject.holder.saveDatabase();
        t.dBObject.getResults(t.dBObject.holder, t.dBObject);
        t.listSaves(t.dBObject.results);
        console.log(t.dBObject.results);
      // Update the UI.
        t.toast.show({
            message: 'Updated!',
            timeout: 1000,
            intent: Intent.SUCCESS
          });
      t.setState({saveStatus: 'pt-icon-saved pt-intent-success'}, function(){
      });
    }
  }

  componentDidMount() {
    // Get all of the tags for the UI.
    // Run update on all tags right away?
    this.getAllTags(data);

    // If persistance is on, we can check some things, like first run,
    // and saved states.
    if(this.state.persist){
      // Instantiate a Database object (contains LokiJS DB and methods for writing/saving - used for persisting state).
      this.dBObject = new Database();
      this.dBObject.create();

      // If we have a db that has a collection already, then its not first run. 
      var checkCol = this.dBObject.checkCollections(this.dBObject.holder, 'saves');
      console.log('check the db object for basic stuff', checkCol);
      if (checkCol) {
        this.toggleFirstRun(false);
      } else {
        this.toggleFirstRun(true, function(){
          console.log('first run is true!');
          this.setState({showingHelp: true});
        });
      }

      var saves = this.dBObject.doLoad().results;
      // console.log('loaded db object', dBObject);
      // console.log('saves', saves);
      // Need to update state w/ list of saved states.
      this.listSaves(saves);

      // Hrmm, probably should have a better place to hold our dBObject
      // this.dBObject = dBObject;

    }

    // Init the bloody toaster.
    this.createToaster();
  }
  render() {
    return (
      <div className="App">
      {/*

        <div className="App-header">
          <img src={calendarIcon} className="App-logo" alt="logo" />
          <h2>Welcome to Calendar Builder 1.0</h2>
        </div>
      */}
        
        {/*<p className="App-intro">
          Build a calendar by selecting available tags.  NB: tags that have no events associated with them in this set of events are disabled. Selecting tags narrows the set.
        </p>*/}

        <SavedList
          saves={this.state.saves}
          reset={this.reset}
          help={this.showHelp}
          currentCalTitle={this.state.currentCalTitle}
          saveStatus={this.state.saveStatus || null}
          saveHandler={this.doSave}
          saveFileName={this.state.saveFileName}
          handleTitleChange = {this.handleTitleChange}
          doFileLoad = {this.doFileLoad}
      />
        <Dialog
          iconName="calendar"
          isOpen={this.state.showingHelp}
          onClose={this.showHelp}
          title="Getting Started"
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

        {/*
          <h4>Getting started</h4>
        <p>To create a calendar, start by selecting some tags to narrow down the types of events you'd like to display. You can also choose the source of the events.  A preview of your calendar will appear based on your selections.
        </p>
        */}

        <div className="toasties"></div>

        <TagList tags={this.state.tags} clicky={this.handleTagClick} selected={this.state.selected_tags}/>

        <TopTen
          onClick={this.onlyTopTen} optname='showmore'
          enabledString='Show more tags'
          disabledString='Show less tags'
          enabled={this.state.onlyTopTenEnabled}
        />
        
        <h4>Sources</h4>
        <Local
          extraClass='switch-left'
          onClick={()=> this.onlyLocal(true)}
          enabled={this.state.onlyLocalEnabled == true}
          label="Local content"
          disabledString='Only include locally created content'
          
        />

        <AllSources
          extraClass='switch-right'
          onClick={()=> this.onlyLocal(false)}
          enabled={this.state.onlyLocalEnabled == false}
          label="All content"
          
          disabledString='Include all content'
        />

        {/* This popover needs work, not the best use maybe. redundant and it messes with focus cause overlay is everywhere. 
          */}
        <Popover
          content={this.state.foundDocsCount + ' matching events.'}
          isOpen={false /*this.state.foundDocsCount > 0*/}
          inline={true} 
          interactionKind={PopoverInteractionKind.CLICK}
          popoverClassName="pt-popover-content-sizing"
          position={Position.TOP_LEFT}
          useSmartPositioning={false}>
          <Calendar id="search-calendar"/>
        </Popover>
      </div>
    );
  }
}

/**
 * Holds list of saved states.
 */
class SavedList extends Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render () {
    var currentCalTitle = this.props.currentCalTitle;
    var reset = this.props.reset;
    var showHelp = this.props.help;
    var saves = this.props.saves || [];
    var saveStatus = this.props.saveStatus;
    var saveHandler = this.props.saveHandler;
    var saveFileName = this.props.saveFileName;
    var handleTitleChange = this.props.handleTitleChange;
    var doFileLoad = this.props.doFileLoad;
    // console.log('here what we got saved...', saves);

    var loadPlaceHolder = "";
    if (saves.length < 1) {
    loadPlaceHolder = (
        <MenuItem text="No calendars to load yet!" />
      )
    }
    var menuContent = (
      <div className="saved-list">
          <Menu>
              {loadPlaceHolder}
              {
                saves.map((save) =>
                  <MenuItem
                    key={save.id}
                    text={save.title}
                    onClick={doFileLoad.bind(this, save)}
                  />
                )
              }
          </Menu>
      </div>
    );
    var saveDialogue = (
      <div>
        <label className="pt-label">
          Enter a name for this calendar, e.g. 'Local winter & music'
          <input className="pt-intent-primary pt-large pt-fill" type="text" width="300px" placeholder="Name"/>
        </label>
          <button className="pt-button pt-intent-primary">Save</button> 
      </div>
    )

    var saveField = (
      <div>
        {/*
        <EditableText className="pt-intent-primary" placeholder="Edit calendar name..." value={currentCalTitle} />*/}

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
            Calendar Builder v1.0
          </div>
          {/*<Popover content={saveDialogue}
            interactionKind={PopoverInteractionKind.CLICK}
            popoverClassName="pt-popover-content-sizing"
            position={Position.RIGHT}
            useSmartPositioning={false}>
            <button className="pt-button pt-intent-primary">Save calendar</button>
          </Popover>*/}
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
    console.log('selected tags', selected);
    return (
      <div className={"tag-list"}>
        <h4>Tags</h4>
        {
          this.props.tags.map((tag) =>
            <Tag key={tag.id} title={tag.title} onClick={clicky.bind(this, tag)} toggle={_.has(selected, tag.id)} enabled={tag.enabled || 'disabled'} visible={tag.visible} count={tag.count} />
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
      <div className={'tag selected-'+ this.props.toggle + ' ' + this.props.enabled + ' viz-' + this.props.visible} onClick={this.props.onClick}>
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

class Local extends OptionToggle {
}

class AllSources extends OptionToggle {

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
 * - Need to rethink the top 15. Its probably best as a visual aid - i.e. don't show a giant list of tags more so than an explicit filtering tool, i.e. it shouldn't reset your search just cause you clicked on it. Or should it? Yeah pretty sure it should just be a way to collapse all but top 15 - i.e. set them to some hidden status (NOT selection, just hidden)
 * - TODO: need to make sure state is transferable - i.e. its saved and can be loaded anew (i.e. the tool can load a state)
 * TODO: find out about UI elements (like switches etc, use Blueprint npm maby?)
 * TODO: save the state! Load the state!
 * TODO: add some feedback if down to 0 tags/results (maybe a blueprint toast?)
 * TODO: add a toast feedback for total num of filtered docs.
 * TODO: fix up blueprint css - it overrides a bunch of stuff in ways I dont like.
 * TODO: fix up allsources toggle - it toggles by itself. - Done 
 * Also shuld dismiss toast. Also shorten toast length. - DONE 
 * Also disable show less tag hindrance (due to hidden tags) - Done 
 * Also change color of toast cause its a warning. - DONE
 * TODO: add a popover for the calendar, showing total filtered docs. - Done
 * TODO: add lokijs to save state locally -- Done
 * TOOD: add a save state button -- Done
 * TODO: add a reset state button -- Done
 * TODO: add a list of saved states (searches) -- Done
 * 
 * TODO: save saved states to localstorage (do writes) -- DONE
 * TODO: hookup load menu to loading state (do read on command) -- DONE
 * TODO: save partial state (selected_tags and local should do it - basically everything that reset resets) -- DONE!
 * TODO: add save dialogue or other UI element (title) -- DONE
 * TODO: launch toast on save confirm - or other UI element (maybe save button turns green?) -- DONE
 * TODO: actually show stuff on the calendar !!!! (HIGH PRIORITY!)
 * TODO: add a spinner if necessary (TBD)
 * TODO: Drupalify the whole thing (build and add to a module)
 * TODO: improve help text (also hide dialogue on not-first time) -- DONE
 * TODO: make the help text a variable that can be put in dialogue and also a help menu item -- DONE
 * TODO: probably dont need shortid anymore, maybe get rid of it.
 */
