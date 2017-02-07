import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import 'fullcalendar/dist/fullcalendar.min.css';
// Import all of blueprint css - not great.
import '@blueprintjs/core/dist/blueprint.css';

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
