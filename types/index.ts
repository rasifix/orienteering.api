/*
 * Copyright 2026 Simon Raess
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

// Domain Models
export interface Runner {
  id: string;
  fullName: string;
  yearOfBirth?: number;
  city?: string;
  club?: string;
  ranking?: string;
  time?: string;
  splits?: Split[];
  sex?: Sex;
  starttime?: string;
}

export enum Sex {
    'male' = 'm',  
    'female' = 'f'
}

export interface Split {
  code: string;
  time: string;
}

export interface Category {
  name: string;
  shortName?: string;
  runners: Runner[];
  course?: Course;
  distance?: number;
  ascent?: number;
  controls?: number;
}

export interface Course {
  name: string;
  length?: number;
  climb?: number;
  controls: Control[];
}

export interface Control {
  code: string;
  order: number;
}

export interface Leg {
  from: string;
  to: string;
  ranking: RankingEntry[];
}

export interface RankingEntry {
  id: number;
  fullName: string;
  yearOfBirth?: number;
  city?: string;
  club?: string;
  split: string;
  category: string;
}

export interface Event {
  id?: string;
  name?: string;
  date?: string;
  location?: string;
  categories: Category[];
}

export interface ApiError {
  statusCode: number;
  message: string;
}

// Callback Types
export type LoaderCallback = (event: Event) => void;
export type ErrorCallback = (error: ApiError) => void;
export type EventLoader = (id: string, callback: LoaderCallback, errorCallback: ErrorCallback) => void;
