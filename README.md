# Calendar Builder

A calendar app that is built with React to consume Solr API data and render it on a FullCalendar instance.

This is a prototype that is designed to illustrate how the Solr API can be used to provide data (in this case via JSON), which can be filtered, and re-rendered via custom built React components to provide a rich user interface for handling a lot of events, on the client-side.

## Why Use React?

React, to quote it's creators at Facebook is

  > A JavaScript library for building user interfaces...

and,

  > React makes it painless to create interactive UIs ...

and it can,

  > Build encapsulated components that manage their own state, then compose them to make complex UIs...

meanwhile, 

  > We don't make assumptions about the rest of your technology stack, so you can develop new features in React without rewriting existing code.

Futher, React is one of the major options for building complex, modern user interfaces for web applications and it's created by Facebook. It also can be rendered on a server with an initial state so even if JS is disabled on the client, the app will have some functionality.

Finally, React is just the 'view' in MVC, so it can be used on top of existing code, and along side other libraries like jQuery or FullCalendar (as is the case in this application).

## Why Solr?

Solr is the source for the data used in this app.  It supports facets, and has a good API for retrieving many documents and returning them in JSON.