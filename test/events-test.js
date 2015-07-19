var should = require('should'); 
var assert = require('assert');
var request = require('supertest');  
var nock = require('nock');

var app = require('../app');

describe('Events', function() {
  
  describe('Test', function() {    
    it('should return proper event list', function(done) {  
      var n = nock('http://o-l.ch').get('/cgi-bin/fixtures').query(true).reply(200, {
          'ResultLists' : [
             {
              'UniqueID'  : 0,
              'EventDate' : '2015-01-03',
              'EventName' : 'Ski-O Meeting lang',
              'EventCity' : 'Bernau',
              'EventMap'  : 'Bernau',
              'EventClub' : 'Ski-O Swiss',
              'SubTitle'  : '',
              'ResultListID'  : 3260,
              'ResultType'    : 0,
              'ResultModTime' : '20150103T151819'
            }, {
              'UniqueID'  : 7496,
              'EventDate' : '2015-01-04',
              'EventName' : 'Kakowa Winter-OL',
              'EventCity' : 'Lausen',
              'EventMap'  : 'Grammet-Limperg',
              'EventClub' : 'OLG Kakowa',
              'SubTitle'  : 'Dummy',
              'ResultListID'  : 3263,
              'ResultType'    : 0,
              'ResultModTime' : '20150104T165326'
            }
          ]
      });

      request(app)
        .get('/api/events')
        .set('Connection', 'keep-alive')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({
          'events': [
            {
              'id': 3263,
              'name': 'Kakowa Winter-OL',
              'date': '2015-01-04',
              'subtitle': 'Dummy',
              'map': 'Grammet-Limperg',
              'club': 'OLG Kakowa',
              'source': 'solv'
            },
            {
              'id': 3260,
              'name': 'Ski-O Meeting lang',
              'date': '2015-01-03',
              'map': 'Bernau',
              'club': 'Ski-O Swiss',
              'source': 'solv'
            }
          ]
        }, done);
    });
  });
});