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
import { Request, Response } from 'express';
import { EventLoader } from '../types/index';
import { defineControls } from '../services/control-builder';

export default function(loader: EventLoader) {
  return (req: Request, res: Response) => {
    const id = req.params.id;
    loader(id, (event) => {
      const legs = defineControls(event.categories);
      res.json(legs);
    }, (error) => {
      res.status(error.statusCode);
      res.json(error);
    });
  };
}
