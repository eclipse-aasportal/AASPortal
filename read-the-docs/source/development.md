# Development Guide

This guide covers advanced development workflows, debugging techniques, and best practices for AASPortal development.

## Table of Contents
- [Development Environment Setup](#development-environment-setup)
- [Build System](#build-system)
- [Testing Workflows](#testing-workflows)
- [Debugging](#debugging)
- [Code Standards](#code-standards)
- [Performance Optimization](#performance-optimization)
- [Deployment](#deployment)

## Development Environment Setup

### IDE Configuration

**Visual Studio Code (Recommended)**
```json
// .vscode/settings.json
{
    "typescript.preferences.importModuleSpecifier": "relative",
    "eslint.workingDirectories": ["projects/aas-core", "projects/aas-portal", "projects/aas-node", "projects/aas-lib"],
    "jest.rootPath": "./",
    "angular.experimental-ivy": true
}
```

**Recommended Extensions:**
- Angular Language Service
- TypeScript Importer
- ESLint
- Prettier
- Jest
- Docker

### Environment Variables

Create `.env` files for each workspace:

**projects/aas-node/.env** (Backend)
```bash
# Server Configuration
AAS_NODE_PORT=80
NODE_ENV=development

# Database URLs
USER_STORAGE=mongodb://localhost:27017/aasportal-users
TEMPLATE_STORAGE=./templates

# Authentication
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=604800

# AAS Endpoints
ENDPOINTS=["file:///samples?name=Samples"]

# CORS
CORS_ORIGIN=http://localhost:4200

# Logging
NODE_LOG=./log/debug.log
```

**projects/aas-portal/.env** (Frontend)
```bash
# API Configuration
API_URL=http://localhost:80
```

## Build System

### Build Architecture

AASPortal uses different build tools optimized for each workspace:

| Workspace | Build Tool | Output Format | Watch Mode |
|-----------|------------|---------------|------------|
| aas-core | TypeScript Compiler | ESM | `tsc --watch` |
<<<<<<< HEAD
| aas-portal | Angular CLI | Browser Bundle | `ng build --watch` |
| aas-node | esbuild | ESM | `esbuild --watch` |
| aas-lib | ng-packagr | Angular Package | `ng build --watch` |
| aas-jest | TypeScript Compiler | CommonJS | `tsc --watch` |
=======
| aas-package | TypeScript Compiler + esbuild | ESM Bundle | `npm run watch` |
| aas-portal | Angular CLI | Browser Bundle | `ng build --watch` |
| aas-node | esbuild | ESM | `esbuild --watch` |
| aas-lib | ng-packagr | Angular Package | `ng build --watch` |
| aas-server | esbuild | ESM | `esbuild --watch` |
| aas-browser | Angular CLI | Browser Bundle | `ng build --watch` |
| aas-jest | TypeScript Compiler + esbuild | ESM Bundle | `npm run watch` |
>>>>>>> development

### Development Build Commands

**Watch Mode Development:**
```bash
# Terminal 1: Build core dependencies in watch mode
npm run build:debug -w aas-core -- --watch

# Terminal 2: Build and serve backend
npm run build:debug -w aas-node -- --watch
npm run serve

# Terminal 3: Serve frontend with hot reload
ng serve --project aas-portal
```

**Production Builds:**
```bash
npm run build -ws                    # All workspaces
npm run build -w aas-core           # Single workspace
NODE_ENV=production npm run build   # Production optimized
```

### Build Optimization

**TypeScript Configuration:**
```json
// Shared tsconfig options
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "ES2022",
        "moduleResolution": "node",
        "strict": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
    }
}
```

**esbuild Configuration (aas-node):**
```javascript
// Optimized for development speed
{
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production'
}
```

## Testing Workflows

### Test Architecture

**Backend Tests (Jest)**
```bash
# Run all backend tests
npm run test -w aas-core -w aas-node -w aas-jest

# Watch mode
npm run test -w aas-node -- --watch

# Coverage
npm run test -w aas-core -- --coverage

# Debug mode
npm run test -w aas-node -- --runInBand --detectOpenHandles
```

**Frontend Tests (Karma + Jasmine)**
```bash
# Run Angular tests
npm run test -w aas-portal -w aas-lib

# Headless testing
ng test aas-portal --watch=false --browsers=ChromeHeadless

# Debug in browser
ng test aas-portal --browsers=Chrome
```

### Test Organization

**Unit Test Structure:**
```typescript
// aas-core example
describe('AAS Type Guards', () => {
    describe('isProperty', () => {
        it('should return true for valid Property', () => {
            const property: Property = {
                category: 'PROPERTY',
                idShort: 'test',
                valueType: 'string'
            };
            expect(isProperty(property)).toBe(true);
        });

        it('should return false for invalid Property', () => {
            expect(isProperty({})).toBe(false);
        });
    });
});
```

**Integration Test Example:**
```typescript
// aas-node API test
describe('AAS API Endpoints', () => {
    let app: Express;

    beforeAll(async () => {
        app = await createTestApp();
    });

    it('should get AAS by ID', async () => {
        const response = await request(app)
            .get('/api/v1/aas/test-id')
            .expect(200);
        
        expect(response.body).toMatchObject({
            idShort: 'TestAAS'
        });
    });
});
```

### Test Coverage Goals

- **aas-core**: >90% (pure logic, high testability)
- **aas-node**: >80% (API endpoints, business logic)
- **aas-portal**: >70% (UI components, services)
- **aas-lib**: >85% (reusable components)

## Debugging

### Backend Debugging (aas-node)

**VS Code Launch Configuration:**
```json
// .vscode/launch.json
{
    "type": "node",
    "request": "launch",
    "name": "Debug AAS Node",
    "program": "${workspaceFolder}/projects/aas-node/dist/aas-node.js",
    "env": {
        "NODE_ENV": "development"
    },
    "sourceMaps": true,
    "outFiles": ["${workspaceFolder}/projects/aas-node/dist/**/*.js"]
}
```

**Debug with Node Inspector:**
```bash
node --inspect-brk projects/aas-node/dist/aas-node.js
# Open chrome://inspect in browser
```

**Logging Configuration:**
```typescript
// Enhanced logging for development
import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'debug.log' })
    ]
});
```

### Frontend Debugging (aas-portal)

**Angular DevTools:**
```bash
# Install Angular DevTools browser extension
# Access via browser developer tools
```

**NgRx DevTools:**
```typescript
// Enable in development
StoreModule.forRoot(reducers, {
    runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
    }
}),
StoreDevtoolsModule.instrument({
    maxAge: 25,
    logOnly: environment.production
})
```

**Debug Service Calls:**
```typescript
// HTTP Interceptor for debugging
@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        console.log('HTTP Request:', req);
        return next.handle(req).pipe(
            tap(event => {
                if (event instanceof HttpResponse) {
                    console.log('HTTP Response:', event);
                }
            })
        );
    }
}
```

### Container Debugging

**Debug Container Issues:**
```bash
# Check container logs
docker logs AASPortal
podman logs AASPortal

# Interactive shell in container
docker exec -it AASPortal /bin/sh
podman exec -it AASPortal /bin/sh

# Network debugging
docker network ls
podman network ls
```

## Code Standards

### TypeScript Guidelines

**Strict Configuration:**
```json
{
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
}
```

**Preferred Patterns:**
```typescript
// Use readonly for immutability
interface ReadonlyConfig {
    readonly apiUrl: string;
    readonly timeout: number;
}

// Prefer type unions over enums
type AASCategory = 'PROPERTY' | 'OPERATION' | 'FILE';

// Use proper error handling
class AASError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'AASError';
    }
}
```

### Angular Best Practices

**Component Structure:**
```typescript
@Component({
    selector: 'aas-component',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AasComponent implements OnInit, OnDestroy {
    // Inputs first
    @Input() data!: AAS;
    
    // Outputs
    @Output() dataChange = new EventEmitter<AAS>();
    
    // Public properties
    readonly isLoading$ = this.store.select(selectLoading);
    
    // Private properties
    private readonly destroy$ = new Subject<void>();
    
    constructor(
        private readonly store: Store,
        private readonly cdr: ChangeDetectorRef
    ) {}
    
    ngOnInit(): void {
        // Initialization logic
    }
    
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
```

**Service Pattern:**
```typescript
@Injectable({ providedIn: 'root' })
export class AasService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl;
    
    getAAS(id: string): Observable<AAS> {
        return this.http.get<AAS>(`${this.baseUrl}/aas/${id}`).pipe(
            catchError(this.handleError),
            shareReplay(1)
        );
    }
    
    private handleError = (error: HttpErrorResponse): Observable<never> => {
        console.error('AAS Service Error:', error);
        return throwError(() => new AASError('Failed to fetch AAS', 'FETCH_ERROR', { error }));
    };
}
```

### ESLint Configuration

**Shared Rules:**
```json
{
    "extends": [
        "@typescript-eslint/recommended",
        "prettier"
    ],
    "rules": {
        "@typescript-eslint/explicit-member-accessibility": "error",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/prefer-readonly": "error",
        "prefer-const": "error",
        "no-var": "error"
    }
}
```

## Performance Optimization

### Backend Optimization (aas-node)

**Memory Management:**
```typescript
// Use streaming for large files
app.get('/download/:id', (req, res) => {
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
});

// Connection pooling
const pool = mysql.createPool({
    host: 'localhost',
    user: 'user',
    database: 'aas',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000
});
```

**Caching Strategy:**
```typescript
// Redis caching for AAS data
class AASCache {
    constructor(private redis: RedisClient) {}
    
    async getAAS(id: string): Promise<AAS | null> {
        const cached = await this.redis.get(`aas:${id}`);
        return cached ? JSON.parse(cached) : null;
    }
    
    async setAAS(id: string, aas: AAS, ttl = 3600): Promise<void> {
        await this.redis.setex(`aas:${id}`, ttl, JSON.stringify(aas));
    }
}
```

### Frontend Optimization (aas-portal)

**OnPush Change Detection:**
```typescript
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedComponent {
    // Use trackBy for *ngFor
    trackByFn = (index: number, item: AAS): string => item.id;
}
```

**Lazy Loading:**
```typescript
// Route-level code splitting
const routes: Routes = [
    {
        path: 'aas',
        loadChildren: () => import('./aas/aas.module').then(m => m.AasModule)
    }
];
```

**Bundle Analysis:**
```bash
ng build --stats-json
npx webpack-bundle-analyzer dist/aas-portal/stats.json
```

## Deployment

### Production Build

**Environment Configuration:**
```typescript
// environment.prod.ts
export const environment = {
    production: true,
    apiUrl: 'https://api.example.com',
    enableDevTools: false
};
```

**Build Commands:**
```bash
# Production build
NODE_ENV=production npm run build -ws

# Verify build
npm run test -ws
npm run lint -ws
```

### Docker Deployment

**Multi-stage Dockerfile:**
```dockerfile
# Build stage
<<<<<<< HEAD
FROM node:22.12.0-alpine AS build
=======
FROM node:22.16.0-alpine AS build
>>>>>>> development
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
<<<<<<< HEAD
FROM node:22.12.0-alpine AS production
=======
FROM node:22.16.0-alpine AS production
>>>>>>> development
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
COPY --from=build --chown=nodejs:nodejs /app .
CMD ["node", "dist/aas-node.js"]
```

### Health Checks

**Backend Health Endpoint:**
```typescript
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version
    });
});
```

**Frontend Health Check:**
```typescript
// Service worker for offline capability
@Injectable({ providedIn: 'root' })
export class HealthService {
    checkBackendHealth(): Observable<HealthStatus> {
        return this.http.get<HealthStatus>('/api/health').pipe(
            timeout(5000),
            catchError(() => of({ status: 'error' }))
        );
    }
}
```
