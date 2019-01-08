[![Build Status](https://travis-ci.org/rasifix/orienteering.api.svg?branch=master)](https://travis-ci.org/rasifix/orienteering.api)

# orienteering.api
API server for orienteering competitions. The current implementation is focussed on single races and not suited for relays, 
team orienteering and other special forms of orienteering. The result data is retrieved from o-l.ch (SOLV - swiss orienteering) and 
so currently only data from that backend is available. 

The web server is based on expressjs.

# Getting started
You have to install nodejs (http://nodejs.org/) and then you can simply type 

 node index.js

This starts a simple webserver that provides the following routes (for complete reference check index.js):

## /api/events
list of events per year (query parameter year, defaults to current year)

## /api/events/solv/:id
event overview for particular event

## /api/events/solv/:id/categories
categories overview for particular event

## /api/events/solv/:id/categories/:categoryId
category details for particular category of event

## /api/events/solv/:id/courses
courses overview for particular event

## /api/events/solv/:id/courses/:courseId
course details for particular course of event

## /api/events/solv/:id/legs
legs overview for particular event

## /api/events/solv/:id/legs/:legId
leg details for particular leg of event

## /api/events/solv/:id/controls
controls overview for particular event

## /api/events/solv/:id/controls/:controlId
control details for particular control of event

## /api/events/solv/:id/runners
list of runners per event


# Local Store
The local store is implemented as a file store with the following folder structure:

${eventId}/splits.json
${eventId}/gps/${runnerId}.gpx
