# Creates an all-in-one Docker image
ARG NODE_IMAGE=node:24.12.0-alpine
ARG GITHUB_RUN_NUMBER
ARG GITHUB_REF_NAME

FROM $NODE_IMAGE AS build
WORKDIR /usr/src/app
COPY . .
RUN npm ci
RUN npm run set-version $GITHUB_RUN_NUMBER $GITHUB_REF_NAME
RUN npm run create-app-info
RUN npm run build

FROM $NODE_IMAGE AS aasportal
RUN apk upgrade --update-cache --available && apk add openssl && rm -rf /var/cache/apk/*
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/projects/aas-node/package.json package.json
RUN npm install --omit=dev
COPY --from=build /usr/src/app/projects/aas-node/src/assets assets/
COPY --from=build /usr/src/app/projects/aas-node/dist/ .
COPY --from=build /usr/src/app/projects/aas-core/dist/ node_modules/aas-core/dist/
COPY --from=build /usr/src/app/projects/aas-core/package.json node_modules/aas-core/package.json
COPY --from=build /usr/src/app/projects/aas-package/dist/ node_modules/aas-package/dist/
COPY --from=build /usr/src/app/projects/aas-package/package.json node_modules/aas-package/package.json
COPY --from=build /usr/src/app/projects/aas-portal/dist/browser/ wwwroot/
COPY --from=build /usr/src/app/projects/aas-portal/src/config.js wwwroot/config.js.template
COPY --from=build /usr/src/app/welcome/ wwwroot/assets/welcome/
COPY docker-entrypoint-aas-portal.sh /usr/src/app/docker-entrypoint-aas-portal.sh
RUN chmod +x /usr/src/app/docker-entrypoint-aas-portal.sh

ENV AAS_NODE_PORT=80
ENV ENDPOINTS=["\"file:///endpoints/samples?name=Samples\""]

EXPOSE 80
ENTRYPOINT ["/usr/src/app/docker-entrypoint-aas-portal.sh"]
CMD ["node", "aas-node.js" ]
