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
import { Request, Response } from 'express';
import { EventLoader, Category } from '../types/index.ts';

export default function(loader: EventLoader) {
  return (req: Request, res: Response) => {
    const id = req.params.id;
    loader(id, (event) => {
      const courses = defineCourses(event.categories);
    
      res.json(courses);
    }, (error) => {
      res.status(error.statusCode);
      res.json(error);
    });
  };
}

function defineCourses(categories: Category[]) {
  const groupedCategories: { [key: string]: Category[] } = {};
  categories.forEach((category) => {
    if (category.runners.length === 0) {
      // category without runners are ignored
      return;
    }

    // find categories with identical courses
    const controls = category.runners[0].splits!.map((split) => split.code).join('-');
    if (!groupedCategories[controls]) {
      groupedCategories[controls] = [];
    }
    groupedCategories[controls].push(category);
  });

  // build courses
  const courses: any[] = [];
  Object.keys(groupedCategories).forEach((grouped) => {
    const cats = groupedCategories[grouped];
    const id = cats.map((cat) => cat.name).sort().join('-');
    courses.push({ 
      id: id,
      name: id,
      distance: (cats[0] as any).distance,
      ascent: (cats[0] as any).ascent,
      controls: (cats[0] as any).controls,
      runners: cats.reduce((prev, cat) => prev + cat.runners.length, 0)
    });
  });

  courses.sort((c1, c2) => { 
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
