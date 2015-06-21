require('array.prototype.find');

var solv = require('../../services/solv-loader');
var parseRanking = require('../../services/ranking').parseRanking;
var parseTime = require('../../services/time').parseTime;

module.exports = function(req, res) {
  var id = req.params.id;
  var courseId = req.params.courseId;
  
  solv(id, function(event) {      
    var courses = defineCourses(event.categories);
    var course = courses.find(function(course) {
      return course.id === courseId;
    });
    res.set('Access-Control-Allow-Origin', '*');
        
    if (!course) {
      res.status(404);
      res.json({ message: 'course ' + courseId + ' does not exist!' });
    } else {
      res.json({
        name: course.name,
        distance: course.distance,
        ascent: course.ascent,
        controls: course.controls,
        runners: parseRanking(course).runners
      });
    }    
  });
};

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
      runners: cats.reduce(function(prev, cat) { 
        return prev.concat(cat.runners.map(function(runner) {
          return {
            id: idx++,
            startTime: runner.startTime,
            yearOfBirth: runner.yearOfBirth,
            time: runner.time,
            sex: runner.sex,
            ecard: runner.ecard,
            splits: runner.splits,
            club: runner.club,
            fullName: runner.fullName,
            nation: runner.nation,
            city: runner.city,
            category: cat.name
          };
        })); 
      }, [ ])
    });
  });
   
  courses.sort(function(c1, c2) { 
    if (c1.id < c2.id) {
      return -1;
    } else if (c1.id > c2.id) {
      return 1;
    } else {
      return 0;
    }    
  }).forEach(function(course) {
    // sort the runners according to their run time
    course.runners.sort(function(r1, r2) {
      var t1 = parseTime(r1.time);
      var t2 = parseTime(r2.time);
      if (t1 === null && t2 === null) {
        return 0;
      } else if (t1 !== null && t2 === null) {
        return -1;
      } else if (t1 === null && t2 !== null) {
        return 1;
      } else {
        return parseTime(r1.time) - parseTime(r2.time);
      }
    });
  });
  
  return courses;
}