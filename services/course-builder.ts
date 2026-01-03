/*
 * Copyright 2015-2026 Simon Raess
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
import { parseTime } from '@rasifix/orienteering-utils';
import { Category } from '../types/index.js';
import { Runner } from '@rasifix/orienteering-utils/lib/model/runner';

export interface CourseBase {
  id: string;
  name: string;
  distance: number;
  ascent: number;
  controls: number;
}

export interface CourseSummary extends CourseBase {
  runners: number;
}

export interface CourseDetail extends CourseBase {
  runners: Runner[];
}

interface CategoryWithCourseInfo {
  name: string;
  distance?: number;
  ascent?: number;
  controls: number;
  runners: Runner[];
}

/**
 * Groups categories by their course (based on control sequence)
 */
function groupCategoriesByCourse(categories: Category[]): { [key: string]: Category[] } {
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

  return groupedCategories;
}

/**
 * Builds course summary list (with runner counts only)
 */
export function buildCourseSummaries(categories: Category[]): CourseSummary[] {
  const groupedCategories = groupCategoriesByCourse(categories);
  
  const courses: CourseSummary[] = [];
  Object.keys(groupedCategories).forEach((grouped) => {
    const cats = groupedCategories[grouped] as CategoryWithCourseInfo[];
    const id = cats.map((cat) => cat.name).sort().join('-');
    courses.push({ 
      id: id,
      name: id,
      distance: cats[0].distance ?? 0,
      ascent: cats[0].ascent ?? 0,
      controls: cats[0].controls ?? 0,
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

/**
 * Builds detailed course list (with full runner objects)
 */
export function buildCourseDetails(categories: Category[]): CourseDetail[] {
  const groupedCategories = groupCategoriesByCourse(categories);
  
  const courses: CourseDetail[] = [];
  Object.keys(groupedCategories).forEach((grouped) => {
    const cats = groupedCategories[grouped] as CategoryWithCourseInfo[];
    let idx = 0;
    const id = cats.map((cat) => cat.name).sort().join('-');
    courses.push({
      id: id,
      name: id,
      distance: cats[0].distance ?? 0,
      ascent: cats[0].ascent ?? 0,
      controls: cats[0].controls ?? 0,
      runners: cats.reduce((prev, cat) => {
        return prev.concat(
          cat.runners.map((runner) => {
            return {
              id: "" + ++idx,
              startTime: runner.startTime,
              yearOfBirth: runner.yearOfBirth,
              time: runner.time,
              splits: runner.splits,
              club: runner.club,
              fullName: runner.fullName,
              city: runner.city,
              category: cat.name,
            } as Runner;
          })
        );
      }, [] as Runner[])
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
  })
  .forEach((course) => {
    // sort the runners according to their run time
    course.runners.sort((r1, r2) => {
      const t1 = parseTime(r1.time);
      const t2 = parseTime(r2.time);
      if (t1 === null && t2 === null) {
        return 0;
      } else if (t1 !== null && t2 === null) {
        return -1;
      } else if (t1 === null && t2 !== null) {
        return 1;
      } else {
        return (parseTime(r1.time) ?? 0) - (parseTime(r2.time) ?? 0);
      }
    });
  });

  return courses;
}
