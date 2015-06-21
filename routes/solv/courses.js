var solv = require('../../services/solv-loader');

module.exports = function(req, res) {
  var id = req.params.id;
  solv(id, function(event) {
    var courses = defineCourses(event.categories);
    
    res.set('Access-Control-Allow-Origin', '*');
    res.json(courses);
  });
}

function defineCourses(categories) {
  var groupedCategories = { };
  categories.forEach(function(category) {
    if (category.runners.length === 0) {
      // category without runners are ignored
      return;
    }

    // find categories with identical courses
    var controls = category.runners[0].splits.map(function(split) { return split.code; }).join('-');
    if (!groupedCategories[controls]) {
      groupedCategories[controls] = [];
    }
    groupedCategories[controls].push(category);
  });

  // build courses
  var courses = [];
  Object.keys(groupedCategories).forEach(function(grouped) {
    var cats = groupedCategories[grouped];
    var idx = 0;
    var id = cats.map(function(cat) { return cat.name; }).sort().join('-');
    courses.push({ 
      id: id,
      name: id,
      distance: cats[0].distance,
      ascent: cats[0].ascent,
      controls: cats[0].controls,
      runners: cats.reduce(function(prev, cat) { return prev + cat.runners.length}, 0)
    })
  });

  courses.sort(function(c1, c2) { 
    if (c1.id < c2.id) {
      return -1;
    } else if (c1.id > c2.id) {
      return 1;
    } else {
      return 0;
    }    
  });
  
  return courses;
}