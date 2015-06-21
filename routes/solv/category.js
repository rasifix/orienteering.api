require('array.prototype.find');

var parseRanking = require('../../services/ranking').parseRanking;
var solv = require('../../services/solv-loader');

module.exports = function(req, res) {
  var id = req.params.id;
  var categoryId = req.params.categoryId;
  
  solv(id, function(event) {      
    var category = event.categories.find(function(category) {
      return category.name === categoryId;
    });
    
    res.set('Access-Control-Allow-Origin', '*');
    
    if (!category) {
      res.status(404);
      res.json({ message: 'category ' + categoryId + ' does not exist!' });
    } else {
      res.json({
        name: category.name,
        distance: category.distance,
        ascent: category.ascent,
        controls: category.controls,
        runners: parseRanking(category).runners
      });
    }    
  });
};

