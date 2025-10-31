# Architecture and Design
## Workspace Architecture

AASPortal is a **monorepo** using npm workspaces with the following distinct packages:

![AASPortal package diagram](./images/PackageDiagram.png "AASPortal package diagram")

| Workspace | Description | Technology Stack |
|-----------|-------------|------------------|
| **aas-core** | Shared types, utilities, and AAS data models | TypeScript, ESM, AAS Core 3.0 |
| **aas-package** | AASX package file reader/writer library | TypeScript, JSZip, xpath |
| **aas-portal** | Angular frontend application | Angular 20.x, NgRx, Bootstrap 5 |
| **aas-node** | Express.js backend API server | Express.js, JWT, OpenAPI/Swagger |
| **aas-lib** | Reusable Angular UI components | Angular 20.x Library, ng-bootstrap |
| **aas-server** | AAS server (IDTA Part 2 compliant) | Express.js, OpenAPI/Swagger (TSOA) |
| **aas-browser** | Frontend for AAS server | Angular 20.x, Bootstrap 5 |
| **aas-jest** | Custom Jest configuration utilities | Jest, TypeScript |

## AASPortal
AASPortal is an Angular based WEB application. The UI is implemented with the Bootstrap 5 frontend toolkit in conjunction with Bootstrap widgets (ng-bootstrap). For managing the global and local state of the application the NgRx framework is used.

![aas-portal-dependencies](./images/aas-portal-dependencies.png "AASPortal main dependencies")

## AASNode
AASNode is a Node.js WEB application. The REST API provided by AASNode is realized with the WEB framework *Express*. For authentication the concept JSON Web Tokens is used. The implementation uses the module *jsonwebtoken*. The AASNode provides an OpenAPI-compliant REST API. To create the living documentation of the REST API the module *swagger-ui-express* is used.

For the access to Asset Administration Shells in an OPC UA server the *node-opcua* framework is used.

![aas-node-dependencies](./images/aas-node-dependencies.png "AASNode main dependencies")
