var solv = require('../../services/solv-loader');

module.exports = function(req, res) {
  var id = req.params.id;
  
  solv(id, function(event) {      
    var result = defineRunners(event.categories);
    
    res.set('Access-Control-Allow-Origin', '*');
    res.json(result);
  });
};

function defineRunners(categories) {
  var arrayOfArray = categories.map(function(category) {
    return category.runners.map(function(runner) {
      return {
        id: runner.id,
        fullName: runner.fullName,
        club: runner.club,
        city: runner.city,
        yearOfBirth: runner.yearOfBirth,
        category: category.name
      };
    });
  });
   
  var runners = [];
  return runners.concat.apply(runners, arrayOfArray).sort(function(r1, r2) {
    return r1.fullName.localeCompare(r2.fullName);
  });
}
