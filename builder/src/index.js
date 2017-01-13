import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import 'fullcalendar/dist/fullcalendar.min.css';
// Annoyingly I get a bunch of other css w/ blueprint, not just the toast stuff.
// import '@blueprintjs/core/dist/blueprint.css';
// So f, that, I'll have my own version.
import './blueprint.css';

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
