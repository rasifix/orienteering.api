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
import express, { Request, Response, NextFunction, Application } from 'express';
import compress from 'compression';
import rateLimit from 'express-rate-limit';

import solv from './services/solv-loader';
import * as picoevents from './services/picoevents-loader';

const app: Application = express();
app.use(compress());

// Rate limiting - prevent abuse and DoS attacks
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS - Allow all origins for this public API
// Note: This is intentional as this is a public orienteering results API
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  next();
});

// Request parameter validation middleware
const validateId = (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id || req.params.categoryId || req.params.courseId || req.params.legId || req.params.controlId;
  if (id) {
    // Only allow alphanumeric characters and hyphens/underscores (safe for external API calls)
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      res.status(400);
      res.json({ statusCode: 400, message: 'Invalid ID format' });
      return;
    }
  }
  next();
};
app.use('/api/events/:id*', validateId);

// Cache middleware for GET requests - 1 day TTL
const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET') {
    const oneDayInSeconds = 86400; // 24 * 60 * 60
    res.set('Cache-Control', 'public, max-age=' + oneDayInSeconds);
  }
  next();
};

app.use('/api/events', cacheMiddleware);

app.get('/api/events', (await import('./routes/events.ts')).default);

// solv
app.get('/api/events/:id', (await import('./routes/event.ts')).default(solv));
app.get('/api/events/:id/categories', (await import('./routes/categories.ts')).default(solv));
app.get('/api/events/:id/categories/:categoryId', (await import('./routes/category.ts')).default(solv));
app.get('/api/events/:id/courses', (await import('./routes/courses.ts')).default(solv));
app.get('/api/events/:id/courses/:courseId', (await import('./routes/course.ts')).default(solv));
app.get('/api/events/:id/legs', (await import('./routes/legs.ts')).default(solv));
app.get('/api/events/:id/legs/:legId', (await import('./routes/leg.ts')).default(solv));
app.get('/api/events/:id/controls', (await import('./routes/controls.ts')).default(solv));
app.get('/api/events/:id/controls/:controlId', (await import('./routes/control.ts')).default(solv));
app.get('/api/events/:id/runners', (await import('./routes/runners.ts')).default(solv));
app.get('/api/events/:id/starttime', (await import('./routes/starttime.ts')).default(solv));

// solv
app.get('/api/events/solv/:id', (await import('./routes/event.ts')).default(solv));
app.get('/api/events/solv/:id/categories', (await import('./routes/categories.ts')).default(solv));
app.get('/api/events/solv/:id/categories/:categoryId', (await import('./routes/category.ts')).default(solv));
app.get('/api/events/solv/:id/courses', (await import('./routes/courses.ts')).default(solv));
app.get('/api/events/solv/:id/courses/:courseId', (await import('./routes/course.ts')).default(solv));
app.get('/api/events/solv/:id/legs', (await import('./routes/legs.ts')).default(solv));
app.get('/api/events/solv/:id/legs/:legId', (await import('./routes/leg.ts')).default(solv));
app.get('/api/events/solv/:id/controls', (await import('./routes/controls.ts')).default(solv));
app.get('/api/events/solv/:id/controls/:controlId', (await import('./routes/control.ts')).default(solv));
app.get('/api/events/solv/:id/runners', (await import('./routes/runners.ts')).default(solv));
app.get('/api/events/solv/:id/starttime', (await import('./routes/starttime.ts')).default(solv));

// picoevents
app.get('/api/events/picoevents/:id', (await import('./routes/event.ts')).default(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/categories', (await import('./routes/categories.ts')).default(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/categories/:categoryId', (await import('./routes/category.ts')).default(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/courses', (await import('./routes/courses.ts')).default(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/courses/:courseId', (await import('./routes/course.ts')).default(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/legs', (await import('./routes/legs.ts')).default(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/legs/:legId', (await import('./routes/leg.ts')).default(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/controls', (await import('./routes/controls.ts')).default(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/controls/:controlId', (await import('./routes/control.ts')).default(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/runners', (await import('./routes/runners.ts')).default(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/starttime', (await import('./routes/starttime.ts')).default(picoevents.loadLiveEvents));


// fallback route -> send to entry point
app.get('/*', (req: Request, res: Response) => {
  res.status(404);
  res.json({ message: 'Resource not found' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log full error for debugging
  console.error('Server error:', err);
  
  res.status(500);
  
  // In production, don't expose internal error details
  const isDevelopment = process.env.NODE_ENV !== 'production';
  res.json({
    statusCode: 500,
    message: 'Internal server error',
    ...(isDevelopment && { error: err.message, stack: err.stack })
  });
});

export default app;
