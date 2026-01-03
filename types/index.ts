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
import { Competition } from '@rasifix/orienteering-utils/lib/model/competition';
import { Category } from '@rasifix/orienteering-utils/lib/model/category';
import { Runner } from '@rasifix/orienteering-utils/lib/model/runner';
import { Split } from '@rasifix/orienteering-utils/lib/model/split';

// Re-export library types
export { Competition, Category, Runner, Split };

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

export interface ApiError {
  statusCode: number;
  message: string;
}

// Callback Types
export type LoaderCallback = (event: Competition) => void;
export type ErrorCallback = (error: ApiError) => void;
export type EventLoader = (id: string, callback: LoaderCallback, errorCallback: ErrorCallback) => void;
