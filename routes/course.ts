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
import { Request, Response } from "express";
import { ranking, parseTime } from "@rasifix/orienteering-utils";
import { EventLoader, Category } from "../types/index.ts";
import { Runner } from "@rasifix/orienteering-utils/lib/model/runner";

interface Course {
  id: string;
  name: string;
  distance: number;
  ascent: number;
  controls: number;
  runners: Runner[];
}

export default function (loader: EventLoader) {
  return (req: Request, res: Response) => {
    const id = req.params.id;
    const courseId = req.params.courseId;

    loader(
      id,
      (event) => {
        const courses = defineCourses(event.categories);
        const course = courses.find((course) => {
          return course.id === courseId;
        });

        if (!course) {
          res.status(404);
          res.json({ message: "course " + courseId + " does not exist!" });
          return;
        }

        const runnersFormatted = course.runners.map((r) => ({
          ...r,
          id: String(r.id),
          startTime: r.startTime || "",
          yearOfBirth: r.yearOfBirth?.toString(),
          splits: r.splits || [],
        }));
        res.json({
          name: course.name,
          distance: course.distance,
          ascent: course.ascent,
          controls: course.controls,
          runners: ranking.parseRanking(runnersFormatted).runners,
        });
      },
      (error) => {
        res.status(error.statusCode);
        res.json(error);
      }
    );
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
    const controls = category.runners[0]
      .splits!.map((split) => split.code)
      .join("-");
    if (!groupedCategories[controls]) {
      groupedCategories[controls] = [];
    }
    groupedCategories[controls].push(category);
  });

  // build courses
  const courses: Course[] = [];
  Object.keys(groupedCategories).forEach((grouped) => {
    const cats = groupedCategories[grouped];
    let idx = 0;
    const id = cats
      .map((cat) => cat.name)
      .sort()
      .join("-");
    courses.push({
      id: id,
      name: id,
      distance: (cats[0] as any).distance,
      ascent: (cats[0] as any).ascent,
      controls: (cats[0] as any).controls,
      runners: cats.reduce((prev, cat) => {
        return prev.concat(
          cat.runners.map((runner) => {
            return {
              id: "" + ++idx,
              startTime: runner.starttime,
              yearOfBirth: runner.yearOfBirth,
              time: runner.time,
              splits: runner.splits,
              club: runner.club,
              fullName: runner.fullName,
              city: runner.city,
              category: cat.name,
            };
          })
        );
      }, [] as any[]),
    });
  });

  courses
    .sort((c1, c2) => {
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
