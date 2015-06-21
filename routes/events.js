var request = require('request');

module.exports = function(req, res) {
  var year = parseInt(req.query.year) || new Date().getFullYear();
  
  request({ 
    url:'http://o-l.ch/cgi-bin/fixtures', 
    qs: {
      mode: 'results',
      year: year,
      json: 1
    }
  }, function(error, response, body) {
    var events = JSON.parse(body.replace(/\t/g, ' '))['ResultLists'].filter(function(entry) { 
      return entry['EventMap']; 
    }).filter(function(entry) { 
      return entry['ResultType'] === 0; 
    }).map(function(entry) {
      var row = {
        id: entry['ResultListID'],
        name: entry['EventName'],
        date: entry['EventDate'],
        map: entry['EventMap'],
        club: entry['EventClub'],
        source: 'solv'
      }
      if (entry['SubTitle']) {
        row.subtitle = entry['SubTitle'];
      }
      return row;
    });
    
    events.sort(function(e1, e2) {
      return e2.date.localeCompare(e1.date);
    });
    
    res.set('Access-Control-Allow-Origin', '*');
    res.json({ events:events });
  });
}
