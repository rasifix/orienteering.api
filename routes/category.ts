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
import { Request, Response } from "express";
import { ranking } from "@rasifix/orienteering-utils";
import { EventLoader } from "../types/index";

export default function (loader: EventLoader) {
  return (req: Request, res: Response) => {
    const id = req.params.id;
    const categoryId = req.params.categoryId;

    loader(
      id,
      (event) => {
        const category = event.categories.find((category) => {
          return category.name === categoryId;
        });

        if (!category) {
          res.status(404);
          res.json({ message: "category " + categoryId + " does not exist!" });
          return;
        }

        const runnersFormatted = category.runners.map((r) => ({
          ...r,
          id: String(r.id),
          category: category.name,
          startTime: r.startTime || "",
          yearOfBirth: r.yearOfBirth?.toString(),
          splits: r.splits || [],
        }));
        res.json({
          name: category.name,
          distance: category.distance,
          ascent: category.ascent,
          controls: category.controls,
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
