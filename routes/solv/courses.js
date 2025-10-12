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

module.exports = function(loader) {
  return function(req, res) {
    var id = req.params.id;
    loader(id, function(event) {
      var courses = defineCourses(event.categories);
    
      res.json(courses);
    });
  };
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