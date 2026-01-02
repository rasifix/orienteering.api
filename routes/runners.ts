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
      const result = defineRunners(event.categories);
    
      res.json(result);
    }, (error) => {
      res.status(error.statusCode);
      res.json(error);
    });
  };
}

function defineRunners(categories: Category[]) {
  const runners = categories.flatMap((category) => {
    return category.runners.map((runner) => {
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
   
  return runners.sort((r1, r2) => {
    return r1.fullName.localeCompare(r2.fullName);
  });
}
