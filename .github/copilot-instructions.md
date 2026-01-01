# Copilot Instructions for orienteering.api

## Project Overview
This is a TypeScript-based Express.js REST API that provides access to orienteering competition data from multiple sources. The API aggregates data from SOLV (Swiss Orienteering o-l.ch), PicoEvents (live results), and a local file store.

## Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript 5.9.3
- **Module System**: ES modules (`"type": "module"` in package.json)
- **Web Framework**: Express.js 4.21.2
- **HTTP Client**: Axios 1.7.9
- **Testing**: Mocha with ts-node/esm loader
- **Utilities**: @rasifix/orienteering-utils 2.0.42 (includes TypeScript definitions)

### Module Resolution
- **TypeScript Compiler**: `moduleResolution: "bundler"` with `allowImportingTsExtensions: true`, `noEmit: true`
- **Import Style**: Import `.ts` files directly with `.ts` extensions
- **Development Runtime**: Use `tsx` for running TypeScript directly (better ES module support than ts-node)
- **Production**: Compile with `tsc` to `dist/` directory, run with `node`

### Core Components

#### 1. Data Layer (Services)
Located in `services/` directory:
- **solv-loader.ts**: Fetches CSV data from o-l.ch (SOLV), parses into Event structure
- **picoevents-loader.ts**: Fetches live results from PicoEvents API, exports `loadLiveEvents` function
- **local-loader.ts**: Loads events from local API (api.zimaa.ch)
- **picoevents.ts**: Fetches event list from PicoEvents
- **time.ts**: Utility functions for time formatting/parsing (`reformatTime`, `parseTime`, `formatTime`)

All loaders follow the **callback-based async pattern**:
```typescript
type LoaderCallback = (event: Event) => void;
type ErrorCallback = (error: { statusCode: number, message: string }) => void;
type EventLoader = (id: string, callback: LoaderCallback, errorCallback: ErrorCallback) => void;
```

#### 2. Route Layer
Located in `routes/` directory (flat structure, 12 route handlers):
- **events.ts**: List all events (special case - no loader needed)
- **event.ts**: Get event details
- **categories.ts**: List all categories in event
- **category.ts**: Get specific category with ranked runners
- **courses.ts**: List all courses
- **course.ts**: Get specific course details
- **legs.ts**: List all legs (course segments)
- **leg.ts**: Get specific leg details
- **controls.ts**: List all controls
- **control.ts**: Get specific control details
- **runners.ts**: List all runners
- **starttime.ts**: Get start times

**Route Pattern**: Higher-order functions that accept an `EventLoader` and return Express middleware:
```typescript
export default function(loader: EventLoader) {
  return (req: Request, res: Response) => {
    const id = req.params.id;
    loader(id, (event) => {
      // Transform event data for response
      res.json(transformedData);
    }, (error) => {
      res.status(error.statusCode);
      res.json(error);
    });
  };
}
```

#### 3. Type Definitions
Located in `types/index.ts`:
- **Event**: Top-level event structure containing categories
- **Category**: Competition category with name, runners, course details
- **Runner**: Competitor with id, name, club, time, splits
- **Split**: Timing split at a control point
- **Course**: Course information (distance, ascent, controls)
- **Control**: Control point on course
- **Leg**: Segment between two controls

#### 4. Application Entry Points
- **index.ts**: Server entry point, starts Express on port 8080
- **app.ts**: Express application configuration
  - CORS middleware (allow all origins)
  - Compression middleware
  - Cache middleware (1 day TTL for GET requests on `/api/events`)
  - Top-level await for dynamic route imports
  - Basic auth middleware for upload endpoints

## Data Flow

### Request Flow
1. Client → Express Route Handler → EventLoader Service
2. EventLoader fetches data (CSV/JSON) from external source
3. Parser converts CSV/JSON → Event structure
4. Route handler transforms Event → specific view (categories/courses/legs/controls)
5. Response sent as JSON

### Type Conversions
When using `@rasifix/orienteering-utils` ranking functions:
- Local `Runner` type needs mapping to utils `Runner` type
- Required fields: `id` (as string), `category`, `startTime`, `splits`
- Example from [routes/category.ts](routes/category.ts#L37-L41):
```typescript
const runnersFormatted = category.runners.map(r => ({
  ...r,
  id: String(r.id),
  category: category.name,
  startTime: r.starttime || '',
  splits: r.splits || []
}));
```

## Build & Run Commands

### Development
```bash
npm run dev              # Run with tsx (development mode)
make test                # Run Mocha tests with ts-node/esm loader
```

### Production
```bash
npm run build            # Compile TypeScript → dist/
npm start                # Run compiled JavaScript from dist/
```

### Testing
- Test files in `test/` directory
- Use Mocha with ts-node/esm loader
- Configuration in `.mocharc.json`
- Command: `make test` or configure via npm scripts

## API Endpoints

### Event List
- `GET /api/events` - List all events from all sources

### SOLV Events (o-l.ch)
- `GET /api/events/:id` - Event details
- `GET /api/events/:id/categories` - Categories list
- `GET /api/events/:id/categories/:categoryId` - Category with ranked runners
- `GET /api/events/:id/courses` - Courses list
- `GET /api/events/:id/courses/:courseId` - Course details
- `GET /api/events/:id/legs` - Legs list
- `GET /api/events/:id/legs/:legId` - Leg details
- `GET /api/events/:id/controls` - Controls list
- `GET /api/events/:id/controls/:controlId` - Control details
- `GET /api/events/:id/runners` - Runners list
- `GET /api/events/:id/starttime` - Start times

### PicoEvents (Live Results)
Same endpoints as SOLV but with `picoevents/` prefix:
- `GET /api/events/picoevents/:id/*` - Same structure as above

## Coding Conventions

### Async Patterns
**DO NOT** convert to promises/async-await. This codebase uses **callback-based patterns** for consistency:
```typescript
// ✅ Correct
loader(id, (event) => {
  res.json(event);
}, (error) => {
  res.status(error.statusCode);
  res.json(error);
});

// ❌ Wrong - do not promisify
const event = await loaderPromise(id);
```

### Imports
- Import TypeScript files with `.ts` extension (not `.js`)
- Use named imports for clarity: `import { ranking } from '@rasifix/orienteering-utils'`
- Services use default exports for loaders, named exports for utilities
- Routes always use default export (higher-order function)

### Error Handling
- Use callback pattern with `errorCallback({ statusCode, message })`
- Express error middleware in [app.ts](app.ts#L84-L90) catches uncaught errors
- Return 404 for missing resources, 500 for server errors

### CSV Parsing
SOLV data is CSV with `;` delimiter and `latin1` encoding:
```typescript
axios.get(url, {
  responseType: 'arraybuffer',
  responseEncoding: 'binary'
}).then((response) => {
  const body = response.data.toString('latin1');
  const lines = body.split('\n');
  // Parse CSV lines...
});
```

### Time Handling
Use utilities from `services/time.ts`:
- `reformatTime(time: string): string` - Reformat time strings
- `parseTime(time: string): number` - Parse to seconds
- `formatTime(seconds: number): string` - Format seconds to HH:MM:SS

### Ranking Calculation
Use `@rasifix/orienteering-utils`:
```typescript
import { ranking } from '@rasifix/orienteering-utils';

const runnersFormatted = runners.map(r => ({
  id: String(r.id),
  category: categoryName,
  startTime: r.starttime || '',
  splits: r.splits || []
}));

const result = ranking.parseRanking(runnersFormatted);
// result.runners contains ranked runners with time behind leader
```

## TypeScript Configuration

### tsconfig.json Key Settings
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./"
  }
}
```

### Important Notes
- `moduleResolution: "bundler"` allows importing `.ts` files directly
- `allowImportingTsExtensions: true` + `noEmit: true` enables `.ts` imports for ts-node
- For production build, temporarily set `noEmit: false` or use separate build config

## Local Development Setup

### Data Sources Configuration
The API connects to external services:
- **SOLV**: `http://o-l.ch/cgi-bin/results` (CSV endpoint)
- **PicoEvents**: `http://www.picoevents.ch` (CSV endpoint)
- **Local API**: `http://api.zimaa.ch` (JSON endpoint)

### Local Event Storage
Events can be stored locally in `data/` directory as JSON files:
- Format: `data/{eventId}.json`
- Example: `data/1a41c01b.json`
- Structure matches `Event` interface from `types/index.ts`

## Common Tasks

### Adding a New Route
1. Create route handler in `routes/` with EventLoader parameter
2. Export default higher-order function
3. Add route registration in [app.ts](app.ts) with dynamic import
4. Follow existing pattern: `app.get('/api/events/:id/newroute', (await import('./routes/newroute')).default(solv))`

### Adding a New Data Source
1. Create loader in `services/` implementing `EventLoader` signature
2. Parse external format → `Event` structure
3. Register routes in [app.ts](app.ts) with new loader
4. Follow pattern: separate URL namespace (e.g., `/api/events/newsource/:id`)

### Modifying Type Definitions
1. Edit `types/index.ts`
2. Ensure backward compatibility with existing loaders
3. Update type conversions in route handlers if needed
4. Run `npm run build` to verify type safety

## Testing Guidelines

### Test Structure
- Tests in `test/` directory
- Use Mocha's BDD style: `describe()`, `it()`
- Assertions with `should.js`
- Mock external HTTP calls with appropriate libraries

### Running Tests
```bash
make test                # Run all tests
```

### Test Example Pattern
```typescript
import should from 'should';
import { loadEvent } from '../services/solv-loader.js';

describe('SOLV Loader', () => {
  it('should load event data', (done) => {
    loadEvent('12345', (event) => {
      should.exist(event);
      event.categories.should.be.an.Array();
      done();
    }, (error) => {
      done(error);
    });
  });
});
```

## Dependencies

### Production
- `express` 4.21.2 - Web framework
- `axios` 1.7.9 - HTTP client
- `compression` 1.7.5 - Response compression
- `@rasifix/orienteering-utils` 2.0.42 - Orienteering utilities (ranking, time formatting)

### Development
- `typescript` 5.9.3 - TypeScript compiler
- `tsx` - TypeScript execution for development (better ES module support)
- `ts-node` 10.9.2 - TypeScript execution for tests
- `@types/*` - Type definitions for libraries
- `mocha` 11.0.1 - Test framework
- `should` 13.2.3 - Assertion library

## Troubleshooting

### Common Issues

#### ES Module Import Errors
- Ensure `"type": "module"` is in package.json
- Use `.ts` extensions in imports
- Use `tsx` for running TypeScript directly (better than ts-node for ES modules)

#### Type Mismatches with orienteering-utils
- Map local types to utils types before calling ranking functions
- Ensure `id` is string, `category` and `startTime` are present
- Example in [routes/category.ts](routes/category.ts#L37-L41)

#### CSV Parsing Errors
- SOLV uses `;` delimiter and `latin1` encoding
- Check for HTML error responses (status 404)
- Validate token count before accessing array elements

#### Callback Hell
- This is expected - do not refactor to promises
- Keep callbacks shallow by extracting transformation logic

## License
Apache License 2.0 - See file headers for copyright information
