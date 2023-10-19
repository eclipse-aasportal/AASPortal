# Dockerfile to build server and client parts
FROM node:lts-alpine3.16 as build
WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN node create-app-info.js
RUN npm run build

FROM node:lts-alpine3.16 as aas-server-app
RUN apk upgrade --update-cache --available && apk add openssl && rm -rf /var/cache/apk/*
WORKDIR /usr/src/app
COPY package.json package.json
COPY projects/aas-server/package.json projects/aas-server/package.json
COPY --from=build /usr/src/app/projects/aas-server/dist/ /usr/src/app/
COPY --from=build /usr/src/app/projects/aas-server/app-info.json /usr/src/app/app-info.json
COPY --from=build /usr/src/app/projects/common/dist/ /usr/src/app/node_modules/common/dist/
COPY --from=build /usr/src/app/projects/common/package.json /usr/src/app/node_modules/common/package.json
COPY --from=build /usr/src/app/projects/aas-portal/dist/ /usr/src/app/wwwroot
RUN npm install -w=aas-server --omit=dev
COPY projects/aas-server/src/assets assets/
ENV NODE_LOG=./log/debug.log
ENV NODE_SERVER_PORT=80
ENV ENDPOINTS=["\"file:///samples?name=Samples\""]
ENV NODE_ENV=production

EXPOSE 80
CMD ["node", "aas-server.js" ]
