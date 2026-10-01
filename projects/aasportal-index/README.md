# AASPortal Index Database

This project manages the index data for the AASPortal application using a MySQL database. Before running the application, ensure you have a `.env` file configured with the following variables:

```.env
MYSQL_ROOT_PASSWORD=<root-password>
MYSQL_USER=<user-name>
MYSQL_PASSWORD=<user-password>
```

## Create a Container
Make sure Docker or Podman is installed on your system.

You can use either Docker Compose or Podman Compose to manage the container.

### Using Podman Compose

`npm run build:podman`

### Using Docker Compose

`npm run build:docker`

