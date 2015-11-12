/*
 * Copyright 2015 Simon Raess
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
        .set('Accept-Encoding', 'gzip')
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
              'source': 'solv',
              '_link': 'http://ol.zimaa.ch/api/events/solv/3263'
            },
            {
              'id': 3260,
              'name': 'Ski-O Meeting lang',
              'date': '2015-01-03',
              'map': 'Bernau',
              'club': 'Ski-O Swiss',
              'source': 'solv',
              '_link': 'http://ol.zimaa.ch/api/events/solv/3260'
            }
          ]
        }, done);
    });
  });
});