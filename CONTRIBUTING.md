# Contributing to AASPortal

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions are **greatly appreciated**.

If you have a suggestion for improvements, please fork the repo and create a pull request. You can also simply open an issue.
Don't forget to rate the project! Thanks again!

## Getting Started

### Prerequisites
- Node.js v22.12.0
- Visual Studio Code (recommended)
- Docker Desktop 4.x OR Podman Desktop

### Development Setup

1. Fork the Project
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/AASPortal.git`
3. Create your Feature Branch: `git checkout -b feature/AmazingFeature`
4. Install dependencies: `npm install`
5. Build all workspaces: `npm run build -ws`

## Development Workflow

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

### Code Formatting and Linting
The project uses ESLint and Prettier for code formatting. All code must pass linting checks before merging.

```bash
npm run lint                 # Lint all workspaces
npm run format               # Format all workspaces
npm run lint -w aas-portal   # Lint specific workspace
```

**Important**: Always run linting and formatting before committing your changes.

### Development Server
```bash
npm run serve                  # Build and start AAS Node server locally
ng serve --project aas-portal  # Angular dev server (from aas-portal workspace)
```

## Workspace Structure

AASPortal uses npm workspaces with the following structure:
- **aas-core**: Shared types, utilities, and AAS data models
- **aas-portal**: Angular frontend application
- **aas-node**: Node.js/Express.js backend API
- **aas-lib**: Reusable Angular UI components
- **aas-jest**: Custom Jest configuration

### Working with Workspaces
Use workspace-specific commands:
```bash
npm run build -w aas-core     # Single workspace
npm run test -ws              # All workspaces
```

## Submitting Changes

1. Ensure your code passes all tests: `npm run test`
2. Ensure your code is properly formatted: `npm run lint && npm run format`
3. Commit your Changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the Branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## Code Standards

- TypeScript strict mode is enabled across all workspaces
- Follow existing code patterns and naming conventions
- Write tests for new functionality
- Update documentation for API changes
- Use semantic commit messages

## Testing

- **Backend**: Jest for Node.js testing (aas-core, aas-node)
- **Frontend**: Karma + Jasmine for Angular testing (aas-portal, aas-lib)
- Coverage reports are generated in `reports/` directory

## Container Development

The project uses a unified `docker-compose.yml` that works seamlessly with both Docker and Podman.

### Using Compose (Recommended)
```bash
# Docker
docker compose up -d       # Start all services
docker compose down        # Stop all services
docker compose logs        # View logs

# Podman (identical commands)
podman compose up -d       # Start all services
podman compose down        # Stop all services  
podman compose logs        # View logs
```

### Alternative npm scripts
```bash
npm run start              # Build and run complete Docker setup
npm run user-db            # Start MongoDB for user storage (Docker)
npm run user-db:podman     # Start MongoDB for user storage (Podman)
npm run compose:up         # Full multi-service setup
```

### Container Networking
When adding AAS endpoints that run on the host machine, use container-to-host networking:
- **Podman**: `http://host.containers.internal:5001`
- **Docker**: `http://host.docker.internal:5001`
- **Alternative**: Use the host's actual IP address

❌ **Wrong**: `http://localhost:5001` (fails in containers)  
✅ **Correct**: `http://host.containers.internal:5001`

## Third Party Dependencies

When adding new dependencies:
1. Ensure licenses are compatible with Apache 2.0
2. Update package.json in the appropriate workspace
3. Run `npm install` to update lock files
4. Document any breaking changes
