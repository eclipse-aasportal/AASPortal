# AASNode

AASNode is a component of the AASPortal ecosystem responsible for managing Asset Administration Shell (AAS) endpoints and their documents.

## Environment variables

## AASNode Environment Variables

```.env
# Port to listen on.
AAS_NODE_PORT=1337

# AAS lifetime in milliseconds (default: 1 day).
AAS_EXPIRES_IN=86400000

# THE URL to the AAS index database.
AAS_INDEX=aas-index.db

# Filesystem locations.
ASSETS=./assets
CONTENT_ROOT=./
COOKIE_STORE=aasportal-users.db
USER_STORE=aasportal-users.db
USER_RIGHTS_STORE=aasportal-users.db
SESSION_STORE=aasportal-users.db
WEB_ROOT=./wwwroot

# JSON arrays of permitted origins and initial AAS container endpoints.
CORS_ORIGIN='["http://localhost:4200","http://localhost:1337"]'
ENDPOINTS='["file:///endpoints/samples?name=Samples"]'

# HTTPS configuration. Set one of HTTPS_KEY_FILE/HTTPS_CERT_FILE or HTTPS_PFX_FILE.
HTTPS_CERT_FILE=
HTTPS_KEY_FILE=
HTTPS_PFX_FILE=
HTTPS_PFX_PASSWORD=

# Identity provider configuration.
IDENTITY_PROVIDER=file:///identity-provider
CLIENT_ID=
CLIENT_SECRET=
HOST_URL=
REDIRECT_URI=

LOG_LEVEL=Info
MAX_WORKERS=2
SCAN_ENDPOINT_TIMEOUT=3600000

# Session configuration (session time to live in seconds)
SESSION_SECRET=
SESSION_TTL=86400
```

### Mandatory Environment Variables

Before starting the application, ensure all mandatory environment variables are set in your `.env` file as described below.

```.env
CLIENT_ID=<client-id>
CLIENT_SECRET=<client-secret>
SESSION_SECRET=<session-secret>
```
