import React, { Component } from 'react'

/**
 * Autoloads a given save. A non-ui component? Not sure there is really such a thing. Maybe this is a 'container component'?
 * But then I want it to display some info, so I guess it is UI.
 */
class Autoload extends Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  componentDidMount() {
    // Figure out the state to load based on router hash?
    // console.log('autoload state', this.props);
    var doFileLoad = this.props.doFileLoad;
    // For demo purposes, using real save or 'Fall (md5)' as default.
    var save = this.props.save || '58fa788345ab5ac21c2cef38907d4580';
    if (save) {
      var doc = {
        titleHash: save
      }
      // TODO: doFileLoad should handle errors a lot better!
      doFileLoad(doc);
    }
  }
  
  render () {
    // Title for the calendar block.
    var title = this.props.title
    return (
      <nav className="pt-navbar pt-dark pt-fixed-top">
        <div className='pt-navbar-group pt-align-left'>
          <div className="pt-navbar-heading">
            Calendar Block: {title}
          </div>
        </div>
      </nav>
    );
  }
}

export default Autoload