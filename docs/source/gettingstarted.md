# Getting Started
## Prerequisites
- Visual Studio Code
- Node.js v18.10.0
- GIT 2.36.0.windows.1
- Docker Desktop 4.x

*AASPortal* is a mono-repository project. It is implemented using the *npm workspaces* concept. The project consists of four workspaces:
- aas-portal: The browser app of *AASPortal*.
- aas-node: The Node.js app of *AASPortal*.
- aas-lib: UI components and services in an Angular library.
- common: Types and functions used by aas-portal and aas-node.

```txt
aasportal
  ├── projects
  │     ├── aas-core
  │     │     └── package.json
  │     ├── aas-lib
  │     │     └── package.json
  │     ├── aas-node
  │     │     └── package.json
  │     └── aas-portal
  │          └── package.json
  └── package.json

```

## Docker(hub)
The easiest way to run AASPortal locally, is using the latest "all in one" image from Dockerhub:

`docker run -p 80:80 fraunhoferiosb/aasportal_aio`

Then go to http://localhost/ in your browser and enjoy.

## Setup Visual Studio Code
The preferred development environment is Visual Studio Code. Clone *AASPortal*'s GIT repository. Open aasportal in Visual Studio Code. In a terminal window execute the the following commands:

`npm install`

and

`npm run build -ws`

restart Visual Studio Code.

## Start AASPortal
The following command creates and executes a composed Docker image:

`npm run start`

Open one of the supported web browsers and go to the Web site:

    http://localhost/

Alternatively, the application can be started by specifying an Asset Administration Shell:

    http://localhost/?id='value'

`value` can be the AAS identification:

    http://localhost/?id=http://boschrexroth.com/shells/0608842005/917004878

the identification base64URL encoded

    http://localhost/?id=aHR0cDovL2Jvc2NocmV4cm90aC5jb20vc2hlbGxzLzA2MDg4NDIwMDUvOTE3MDA0ODc4

or the name (idShort) of the AAS

    http://localhost/?id=Bosch_NexoPistolGripNutrunner

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
