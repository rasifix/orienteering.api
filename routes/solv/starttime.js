var solv = require('../../services/solv-loader');
var parseTime = require('../../services/time').parseTime;

module.exports = function(req, res) {
  var id = req.params.id;
  
  solv(id, function(event) {      
    var result = { categories: [ ] };

    event.categories.forEach(function(category) {
      var cat = { name: category.name, runners: [] };
      result.categories.push(cat);

      var last = null;
      var pos = 1;
      var filtered = category.runners.filter(function(runner) { return parseTime(runner.time) !== null; });
      filtered.forEach(function(runner, idx) {
        if (last != null) {
          if (parseTime(runner.time) > last) {
            pos = idx + 1;
          }
        }
        var point = {
          id: runner.id,
          startTime: runner.startTime,
          time: runner.time,
          rank: pos,
          fullName: runner.fullName,
          sex: runner.sex,
          category: category.name
        };
        cat.runners.push(point);
        last = parseTime(runner.time);
      });
    });
    
    res.set('Access-Control-Allow-Origin', '*');
    res.json(result);
  });
};
