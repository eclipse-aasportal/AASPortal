# Getting Started
## Prerequisites
- **Node.js v22.12.0** (required for development)
- **Visual Studio Code** (recommended IDE)
- **Docker Desktop 4.x OR Podman Desktop** (for containerized development)
- **Git** (for version control)

## Getting Started
You can find a detailed documentation :blue_book: [here](https://aasportal.readthedocs.io/)

### Using Docker/Podman (Easiest)

Run the all-in-one image from DockerHub:
```bash
# Docker
docker run -p 80:80 fraunhoferiosb/aasportal_aio

# Podman
podman run -p 80:80 docker.io/fraunhoferiosb/aasportal_aio
```

Then open http://localhost/ in your browser.

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/eclipse-aasportal/AASPortal.git
   cd AASPortal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build all workspaces:**
   ```bash
   npm run build -ws
   ```

4. **Start the development server:**
   ```bash
   npm run serve
   ```

5. **Open http://localhost/ in your browser**

Alternatively, the application can be started by specifying an Asset Administration Shell:

    http://localhost/?id='value'

`value` can be the AAS identification:

    http://localhost/?id=http://boschrexroth.com/shells/0608842005/917004878

the identification base64URL encoded

    http://localhost/?id=aHR0cDovL2Jvc2NocmV4cm90aC5jb20vc2hlbGxzLzA2MDg4NDIwMDUvOTE3MDA0ODc4

or the name (idShort) of the AAS

    http://localhost/?id=Bosch_NexoPistolGripNutrunner

## Workspace Architecture

AASPortal is a **monorepo** using npm workspaces with 5 distinct packages:

```txt
aasportal
  ├── projects
  │     ├── aas-core
  │     │     └── package.json
  │     ├── aas-jest
  │     │     └── package.json
  │     ├── aas-lib
  │     │     └── package.json
  │     ├── aas-node
  │     │     └── package.json
  │     └── aas-portal
  │          └── package.json
  └── package.json

```

| Workspace | Description | Technology Stack |
|-----------|-------------|------------------|
| **aas-core** | Shared types, utilities, and AAS data models | TypeScript, ESM |
| **aas-portal** | Angular frontend application | Angular 20.1.6, NgRx, Bootstrap 5 |
| **aas-node** | Express.js backend API server | Express.js, JWT, OpenAPI/Swagger |
| **aas-lib** | Reusable Angular UI components | Angular Library, ng-bootstrap |
| **aas-jest** | Custom Jest configuration utilities | Jest, TypeScript |

## Development Commands

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

### Code Quality
```bash
npm run lint                 # Lint all workspaces
npm run format               # Format all workspaces
npm run lint -w aas-portal   # Lint specific workspace
```

### Container Development

AASPortal uses a unified `docker-compose.yml` that works seamlessly with both Docker and Podman:

```bash
# Using Docker
docker compose up -d            # Start all services
docker compose down             # Stop all services
docker compose logs             # View logs

# Using Podman (identical commands)
podman compose up -d            # Start all services  
podman compose down             # Stop all services
podman compose logs             # View logs
```

**Alternative npm scripts:**
```bash
npm run start              # Build and run complete Docker setup
npm run user-db            # Start MongoDB for user storage (Docker)
npm run user-db:podman     # Start MongoDB for user storage (Podman)
npm run compose:up         # Full multi-service setup
```

## AASNode 
AASNode is a Node.js server application based on the Express framework. The main feature of AASNode is the provision of Asset Administration Shells from different data sources (AASX server, OPC UA server, file system). AASNode can read Asset Administration Shells in JSON, XML and OPC UA format. An Asset Administration Shell is always provided to a web client (AASPortal) in JSON version 3 format.

AASNode provides a user management. Authentication of a user is based on Json Web Token. 

## Environment Variables
| Name             |                                                                       | default                                        |
| ---------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| ASSETS           | AASNode root directory local endpoints and templates.               | './assets'                                     |
| CONTENT_ROOT     | The root directory where AASNode is located.                        | './'                                           |
| CORS_ORIGIN      |                                                                       | '*'                                            |
| ENDPOINTS        | The URLs of the initial AAS container endpoints.                      | ['file:///samples']                            |
| HTTPS_CERT_FILE  | Certification file to enable HTTPS.                                   |                                                |
| HTTPS_KEY_FILE   | Key file to enable HTTPS.                                             |                                                |
| JWT_EXPIRES_IN   | The period for the validity of a JWT.                                 | 604800 (1 week)                                |
| JWT_PUBLIC_KEY   | Public key file for RS256 encryption.                                 |                                                |
| JWT_SECRET       | Secret for HS256 encryption or private key file for RS256 encryption. | 'The quick brown fox jumps over the lazy dog.' |
| MAX_WORKERS      | Number of background worker that scan AAS containers.                 | 8                                              |
| AAS_NODE_PORT | The port number where AASNode is listening.                         | 80                                             |
| USER_STORAGE     | URL of the user database.                                             | './users'                                      |
| TEMPLATE_STORAGE | URL of the template storage                                           |                                                |
| TIMEOUT          | Timeout until a new scan starts (ms).                                 | 5000                                           |
| WEB_ROOT         | The root directory for static file resources.                         | './wwwroot'                                    |

## Endpoints
An endpoint is an URL and a unique name to an AAS container. An AAS container can be:
- AASX Server
- OPC UA Server
- AAS Registry
- Directory in a file system that contains *.aasx files

## Users
AASPortal supports anonymous (guest) and authenticated access. The guest has limited read-only access to data and functions of AASPortal. AASPortal offers the possibility to manage data of registered users in a MongoDB. For this purpose, a URL to a MongoDB must be entered in the environment variable USER_STORAGE:

`USER_STORAGE=mongodb://<address>:<port>/aasportal-users`

A local, file-based user database is available for testing purposes.

## AAS Templates
Templates denote submodels or concrete submodel elements for creating and editing Asset Administration Shells.

```txt
templates
  ├── submodel
  │     └── *.json
  └── submodel-element
        └── *.json
```

## OpenAPI (Swagger)
The AASNode provides an OpenAPI-compliant REST API. The Swagger UI is accessible via the URL:

`http://localhost/api-docs`

## Authentication with Json Web Tokens (JWT)
AASPortal uses JSON web tokens for authorization. Environment variables can be used to choose between HS256 or RS256 encryption. The expiration date of a token can also be defined via an environment variable.

`JWT_EXPIRES_IN=`*`<seconds>`*

The value is to be entered in seconds. By default, a token is valid for one week.

### HS256 Encryption
HS256 (HMAC with SHA-256) involves a combination of a hashing function and one (secret) key that is shared between the two parties used to generate the hash that will serve as the signature. Since the same key is used both to generate the signature and to validate it, care must be taken to ensure that the key is not compromised.

`JWT_SECRET=`*`<secret>`*

### RS256 Encryption
RS256 (RSA Signature with SHA-256) is an asymmetric algorithm, and it uses a public/private key pair: the identity provider has a private (secret) key used to generate the signature, and the consumer of the JWT gets a public key to validate the signature.

`JWT_SECRET=`*`<path to private key file>`*

`JWT_PUBLIC_KEY=`*`<path to public key file>`*

## HTTPS
To enable HTTPS 

`HTTPS_CERT_FILE=`*`<path to certificate file>`*

`HTTPS_KEY_FILE=`*`<path to key file>`*
