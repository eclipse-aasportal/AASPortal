# Dockerfile to build server and client parts
FROM node:lts-alpine3.19 AS build
WORKDIR /usr/src/app
COPY . .
# RUN apk add g++ make py3-pip
RUN npm install
RUN node --no-warnings --loader ts-node/esm create-app-info.ts
RUN npm run build

FROM node:lts-alpine3.19 AS aasportal
RUN apk upgrade --update-cache --available && apk add openssl && rm -rf /var/cache/apk/*
WORKDIR /usr/src/app
COPY package.json package.json
COPY projects/aas-server/package.json package.json
COPY projects/aas-server/src/assets assets/
RUN npm install --omit=dev
COPY --from=build /usr/src/app/projects/aas-server/dist/ /usr/src/app/
COPY --from=build /usr/src/app/projects/aas-server/app-info.json /usr/src/app/app-info.json
COPY --from=build /usr/src/app/projects/aas-core/dist/ /usr/src/app/node_modules/aas-core/dist/
COPY --from=build /usr/src/app/projects/aas-core/package.json /usr/src/app/node_modules/aas-core/package.json
COPY --from=build /usr/src/app/projects/aas-portal/dist/browser/ /usr/src/app/wwwroot/
ENV NODE_LOG=./log/debug.log
ENV NODE_SERVER_PORT=80
ENV ENDPOINTS=["\"file:///endpoints/samples?name=Samples\""]
ENV NODE_ENV=production

EXPOSE 80
CMD ["node", "aas-server.js" ]
