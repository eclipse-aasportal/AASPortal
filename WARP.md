# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AASPortal is a Node.js-based web portal for visualization and management of Asset Administration Shells (AAS) implementing Industry 4.0 standards. It's a monorepo project using npm workspaces with Angular frontend and Express.js backend.

## Architecture

The project follows a modular workspace architecture:

- **aas-core**: Shared types, utilities, and AAS data models used across workspaces
- **aas-portal**: Angular-based frontend application using Bootstrap 5 and NgRx state management
- **aas-node**: Express.js backend with REST API, authentication (JWT), and OpenAPI/Swagger documentation
- **aas-lib**: Angular library containing reusable UI components and services
- **aas-jest**: Custom Jest configuration utilities

### Key Technologies
- Frontend: Angular 19, NgRx, Bootstrap 5, ng-bootstrap, Chart.js
- Backend: Express.js, MongoDB (user storage), MariaDB (AAS index), JWT authentication
- Build: esbuild (backend), Angular CLI (frontend), TypeScript, ESM modules
- Infrastructure: Docker, OPC UA support, WebDAV, file system endpoints

## Development Commands

### Setup and Installation
```bash
npm install                    # Install all dependencies
npm run build -ws             # Build all workspaces
```

### Building
```bash
npm run build                 # Build all workspaces (production)
npm run build:debug           # Build all workspaces (development)
npm run lib:build             # Build only aas-core and aas-lib
npm run aas-portal:build      # Build frontend dependencies + aas-portal
npm run aas-node:build        # Build backend dependencies + aas-node
```

### Testing
```bash
npm run test                  # Run tests in all workspaces
npm run test -w aas-core      # Run tests for specific workspace
npm run coverage              # Generate coverage reports
```

### Linting and Formatting
```bash
npm run lint                  # Lint all workspaces
npm run format               # Format all workspaces
npm run lint -w aas-portal   # Lint specific workspace
```

### Development Server
```bash
npm run serve               # Build and start AAS Node server locally
ng serve --project aas-portal  # Angular dev server (from aas-portal workspace)
```

### Docker
```bash
npm run start              # Build and run complete Docker setup
npm run user-db           # Start MongoDB for user storage
docker-compose up         # Full multi-service setup
```

## Code Structure Insights

### AAS Data Model (aas-core)
The core contains TypeScript definitions for Asset Administration Shell standards including:
- AAS elements (Properties, Files, Blobs, Operations, etc.)
- Reference and relationship types
- Environment and endpoint management utilities
- Type guards and validation functions

### State Management (aas-portal)
Uses NgRx pattern with feature stores:
- `aas.store.ts` - AAS entity state
- `dashboard.store.ts` - Dashboard state
- `shells.store.ts` - Shell management state

### API Layer (aas-node)
RESTful Express.js API with:
- TSOA for OpenAPI specification generation
- Swagger UI at `/api-docs`
- JWT-based authentication with HS256/RS256 support
- Multi-source AAS providers (file system, OPC UA, WebDAV)

### Build System
- Uses esbuild for fast Node.js compilation with ESM output
- Angular CLI for frontend builds
- TypeScript strict mode enabled across all workspaces
- ESLint with Prettier integration

## Testing Strategy

- **Jest** for Node.js backend testing (aas-core, aas-node)
- **Karma + Jasmine** for Angular testing (aas-portal, aas-lib)
- Coverage reports generated in `reports/` directory
- XML output for CI/CD integration

## Environment Configuration

### Key Environment Variables (aas-node)
- `AAS_NODE_PORT`: Server port (default: 80)
- `ENDPOINTS`: Initial AAS container URLs
- `USER_STORAGE`: MongoDB URL for user management
- `JWT_SECRET`: JWT signing secret or private key path
- `TEMPLATE_STORAGE`: Template storage URL
- `CORS_ORIGIN`: CORS configuration

### Development vs Production
- Development builds preserve source maps and disable optimization
- Production builds use minification and bundle optimization
- Environment-specific configurations in `environment.ts` files

## Deployment

### CI/CD Pipeline (.gitlab-ci.yml)
- Semantic release versioning
- Multi-stage builds (build → test → deploy)
- Docker images built with Kaniko
- Coverage reporting with Cobertura format

### Docker Setup
- Multi-service architecture with docker-compose
- Separate containers for portal, node, databases
- Health checks for MariaDB
- Volume persistence for data

## Common Development Patterns

### Workspace Commands
Always use `-w <workspace>` or `-ws` flags:
```bash
npm run build -w aas-core     # Single workspace
npm run test -ws              # All workspaces
```

### TypeScript Configuration
- Strict mode enabled with ESM module resolution
- `@types` packages for Node.js APIs
- Experimental decorators for Angular/DI

### Code Style
- ESLint + Prettier integration
- Explicit member accessibility required
- Prefer for-of loops over traditional for loops
- No unused variables enforcement

### Testing Individual Components
```bash
# Frontend component test
ng test aas-portal --watch=false --browsers=ChromeHeadless

# Backend unit test
npm run test -w aas-node -- --testNamePattern="specific test"

# Debug mode with watch
npm run test:debug -w aas-core
```

## Troubleshooting

### Container Networking Issues

When adding AAS endpoints that run on the host machine (localhost), remember that containers have isolated networking:

- **Problem**: `http://localhost:5001` fails with "invalid or not supported AAS endpoint"
- **Solution**: Use container-to-host networking:
  - **Podman**: `http://host.containers.internal:5001`
  - **Docker**: `http://host.docker.internal:5001`
  - **Alternative**: Use the host's actual IP address instead of localhost

### Common Endpoint URL Patterns
```bash
# ✅ Correct for containerized AASPortal
http://host.containers.internal:5001       # Podman
http://host.docker.internal:5001           # Docker  
http://192.168.1.100:5001                  # Host IP

# ❌ Wrong for containerized AASPortal
http://localhost:5001                       # Container's localhost
http://127.0.0.1:5001                      # Container's loopback
```
