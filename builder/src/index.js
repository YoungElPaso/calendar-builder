import React from 'react';
import ReactDOM from 'react-dom';
// Import react-router modules.
import { Router, Route, Link, browserHistory} from 'react-router'
// Import the main App component.
import App from './App';
// Import the Client component.
import Client from './Client';

import './index.css';
import 'fullcalendar/dist/fullcalendar.min.css';
// Import all of blueprint css - not great.
import '@blueprintjs/core/dist/blueprint.css';

ReactDOM.render(
  <Router history={browserHistory}>
    <Route path="/" component={App} />
    <Route path="/client" component={Client} />
  </Router>,
  document.getElementById('root')
);
