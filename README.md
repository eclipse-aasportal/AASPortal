# AASPortal

[![Docs](https://readthedocs.org/projects/aasportal/badge/?version=latest "Documentation Status")](https://aasportal.readthedocs.io/en/latest/?badge=latest)
[![Build & Test](https://github.com/eclipse-aasportal/AASPortal/actions/workflows/build-and-test-workflow.yml/badge.svg "GitHub Actions Build & Test")](https://github.com/eclipse-aasportal/AASPortal/actions/workflows/build-and-test-workflow.yml)
[![Docker Hub](https://img.shields.io/docker/pulls/fraunhoferiosb/aasportal_aio.svg "Docker Hub pulls")](https://hub.docker.com/r/fraunhoferiosb/aasportal_aio)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg "Apache-2.0 License")](LICENSE)

![AASPortal logo](./read-the-docs/source/images/AASPortal_mid.png "AASPortal logo")

**AASPortal** is a Node.js-based portal for visualizing and orchestrating Asset Administration Shells (AAS) end to end. It implements the IDTA "Details of the Asset Administration Shell" specification (CC BY 4.0) and combines ready-to-run Angular frontends, backend services, and reference AASX data sources for Industrie 4.0 scenarios.

## Why AASPortal?
- **Unified workspaces** – Angular frontends, TypeScript libraries, and Node.js services share a single monorepo and toolchain.
- **Standards-first** – Implements IDTA Part 2 compliant AAS Server APIs and supports AASX packages (JSON/XML, V1–V3).
- **Deployment flexibility** – Run locally, via Docker/Podman, or on Kubernetes with sub-path aware routing.
- **Extensible UI** – Reusable Angular component library (`aas-lib`) and NgRx-powered shell adapt to your digital-twin use case.
- **Proven automation** – GitHub Actions CI, semantic-release, and coverage reports keep the project production-ready.

> 📘 Prefer the hosted documentation at https://aasportal.readthedocs.io/. The source `.mdx` files remain under `read-the-docs/` for local editing.

**AASPortal is under active development—see the [Contributing](CONTRIBUTING.md) guide to get involved.**

## Prerequisites
- **Node.js v22.16.0** (required for development and CI; install via nvm or the Node.js downloads site)
- **npm 10.x** (bundled with Node.js 22)
- **Visual Studio Code** (recommended)
- **Docker Desktop 4.x or Podman Desktop** (for container workflows)
- **Git**

## Quick start

| Path | When to use | Commands |
|------|-------------|----------|
| **All-in-one container** | Evaluate the latest release without building locally. | ```bash
docker run -p 80:80 fraunhoferiosb/aasportal_aio
# or
podman run -p 80:80 docker.io/fraunhoferiosb/aasportal_aio
```
Then open http://localhost/. |
| **Full-stack development** | Work across multiple workspaces simultaneously. | ```bash
git clone https://github.com/eclipse-aasportal/AASPortal.git
cd AASPortal
npm install
npm run build --workspaces
npm run serve
```
Before running `npm run serve`, provide environment variables (e.g., `AAS_NODE_PORT`, `USER_STORAGE`, database credentials). Create a `.env.local` or export variables in your shell—see the [Getting Started guide](https://aasportal.readthedocs.io/en/latest/gettingstarted.html#environment-configuration) for the required keys. |
| **Focused builds** | Iterate on specific packages without rebuilding everything. | ```bash
npm run lib:build             # aas-core + aas-lib
npm run aas-portal:build      # Angular portal only
npm run aas-node:build        # Backend service only
npm run aas-server:build      # Reference server + browser demo stack
```
Use the corresponding `:build:debug` variants for faster incremental builds. |

## Workspace architecture

AASPortal is an npm workspaces monorepo (TypeScript + ESM + Jest) organized as follows:

![AASPortal workspace diagram](./read-the-docs/source/images/PackageDiagram.png "AASPortal package diagram")

| Workspace | Purpose | Key technologies |
|-----------|---------|------------------|
| **aas-jest** | Shared Jest preset, setup files, and matchers for all packages. | Jest 30, jsdom |
| **aas-core** | Platform-neutral AAS type definitions, utilities, and parsers. | TypeScript, AAS Core 3.0 |
| **aas-package** | Library to read/write AASX packages (JSON/XML, v1–v3). | TypeScript, JSZip, xpath |
| **aas-node** | Backend API (TSOA + Express) exposing AAS data, auth, and storage services. | Node.js 22, Express 5, TSOA |
| **aas-lib** | Angular component library (charts, forms, NgRx stores) shared by frontends. | Angular 20, Bootstrap 5, NgRx |
| **aas-portal** | Main Angular portal for browsing and managing AAS instances. | Angular 20, Bootstrap 5, NgRx |
| **aas-server** | Reference AAS Server compliant with IDTA Part 2 APIs and sample AASX data. | Node.js 22, Express 5 |
| **aas-browser** | Lightweight UI to explore data served by `aas-server`. | Angular 20 |
| **aasportal-cloud** | Template storage helper (Nextcloud-based) for container deployments. | Node.js 22 |
| **aasportal-index** | MySQL-backed index service referenced by `.env` defaults. | Node.js 22, MySQL |
| **aasportal-users** | MongoDB-backed user storage helper service. | Node.js 22, MongoDB |

## Common npm scripts

```bash
npm run build                 # Build all workspaces (production)
npm run build:debug           # Build all workspaces (development)
npm run test                  # Run tests in all workspaces
npm run coverage              # Generate coverage reports
npm run lint                  # Lint all workspaces
npm run format                # Format all workspaces
```

### Workspace-scoped helpers
```bash
npm run test -w aas-core           # Run tests for a single workspace
npm run lint -w aas-portal         # Lint the Angular portal only
npm run aas-portal:build           # Build frontend dependencies + portal
npm run aas-node:build             # Build backend dependencies + aas-node
npm run aas-server:build           # Build server + browser demo stack
```

## Container development

**Docker**
```bash
npm run start              # Build and run the full docker-compose stack
npm run user-db            # Start MongoDB for user storage
npm run compose:up         # Bring up all services via docker-compose
```

**Podman**
```bash
npm run start:podman       # Build and run the full Podman stack
npm run user-db:podman     # Start MongoDB for user storage
npm run compose:up:podman  # Bring up all services via podman-compose
```

The default `.env` file in the repo contains sample credentials for the composed services—override these values in a local `.env.local` or Git-ignored file for real deployments.

## Deploying to Kubernetes

AASPortal supports:
- Root-path deployments (`/`) and sub-path deployments (e.g., `/aasportal/`) via the `BASE_HREF` environment variable.
- Optional ingress path rewriting and TLS termination.
- Horizontal Pod Autoscaler-ready stateless services.

**Minimal deployment example:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aas-portal
spec:
  selector:
    matchLabels:
      app: aas-portal
  template:
    metadata:
      labels:
        app: aas-portal
    spec:
      containers:
        - name: aas-portal
          image: fraunhoferiosb/aasportal:latest
          env:
            - name: BASE_HREF
              value: "/aasportal/"
```

👉 See the [Kubernetes guide](https://aasportal.readthedocs.io/en/latest/kubernetes.html) for production manifests, ingress templates, and environment-variable reference tables.

## Troubleshooting

### Container networking
Containers cannot reach services bound to the host `localhost`. Use the runtime-specific host mappings instead:

```bash
http://host.containers.internal:5001   # Podman
http://host.docker.internal:5001       # Docker
http://192.168.1.100:5001              # Host IP
# avoid: http://localhost:5001
```

### Build & test tips
```bash
node --version                     # Ensure v22.16.0
npm run test -w aas-core -- --verbose
npm run format && npm run lint -- --fix
```

More recipes live in the [Development guide](https://aasportal.readthedocs.io/en/latest/development.html#troubleshooting).

## Documentation & changelog
- Overview: https://aasportal.readthedocs.io/
- Getting started: https://aasportal.readthedocs.io/en/latest/gettingstarted.html
- Architecture: https://aasportal.readthedocs.io/en/latest/architecture.html
- Usage guide: https://aasportal.readthedocs.io/en/latest/usage.html
- Changelog: https://aasportal.readthedocs.io/en/latest/changelog/changelog.html

## Contributors

| Name | GitHub |
|------|--------|
| Ralf Aron | [ralfaron](https://github.com/ralfaron) |
| Alexander Wollbrink | [AlexanderWollbrink](https://github.com/AlexanderWollbrink) |
| Juilee Tikekar | [juileetikekar](https://github.com/juileetikekar) |
| Florian Pethig | [fpethig](https://github.com/fpethig) |

## Support & security
- Report bugs or request features via [GitHub issues](https://github.com/eclipse-aasportal/AASPortal/issues).
- For sensitive security disclosures, email security@iosb-ina.fraunhofer.de.
- General contact: aasportal@iosb-ina.fraunhofer.de.

## License

Distributed under the Apache 2.0 License. See [LICENSE](LICENSE) for details.

Copyright (C) 2019-2025, Fraunhofer IOSB-INA Lemgo, eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft zur Foerderung der angewandten Forschung e.V.

You should have received a copy of the Apache 2.0 License along with this program. If not, see https://www.apache.org/licenses/LICENSE-2.0.html.
