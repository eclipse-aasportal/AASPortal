# AASPort User Database

This project manages user data for the AASPort application using a MongoDB database. Before running the application, ensure you have a `.env` file configured with the following variables:
Example .env file:

```.env
MONGO_INITDB_ROOT_USERNAME=<user-name>
MONGO_INITDB_ROOT_PASSWORD=<root-password>
```

## Create a Container
Make sure Docker or Podman is installed on your system.

You can use either Docker Compose or Podman Compose to manage the container.

### Using Podman Compose

`npm run build:podman`

### Using Docker Compose

`npm run build:docker`

