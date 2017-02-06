import React, { Component } from 'react';

// Need lodash utilities for arrays and JSON filtering.
import _ from 'lodash';

// Import tag component.
import Tag from './Tag.js'

/**
 * Holds a bunch of tags.
 */
class TagList extends Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render () {
    // This seems weird, but I gotta pass down the click handler.
    // There's other methods I guess.
    // TODO investigate how one is to do this. What's the reac-way? Passing down a big component that holds all methods?
    var clicky = this.props.clicky;
    var selected = this.props.selected;
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

export default TagList