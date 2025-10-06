# Creates an all-in-one Docker image
ARG NODE_IMAGE=${NODE_IMAGE}

FROM $NODE_IMAGE AS build
WORKDIR /usr/src/app
COPY . .
RUN npm ci
RUN node --no-warnings --loader ts-node/esm create-app-info.ts
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
COPY --from=build /usr/src/app/projects/aas-portal/dist/browser/ wwwroot/
COPY --from=build /usr/src/app/welcome/ wwwroot/assets/welcome/
ENV AAS_NODE_PORT=80
ENV ENDPOINTS=["\"file:///endpoints/samples?name=Samples\""]

EXPOSE 80
CMD ["node", "aas-node.js" ]
