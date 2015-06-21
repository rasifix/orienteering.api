var solv = require('../../services/solv-loader');

module.exports = function(req, res) {
  var id = req.params.id;
  
  solv(id, function(event) {      
    var categories = { };
    
    var result = event.categories.map(function(category) {
      return {
        name: category.name,
        distance: category.distance,
        ascent: category.ascent,
        controls: category.controls,
        runners: category.runners.length
      }
    });
    
    res.set('Access-Control-Allow-Origin', '*');
    res.json(result);
  });
};

