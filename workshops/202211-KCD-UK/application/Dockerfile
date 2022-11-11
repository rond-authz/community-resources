FROM node:16.18.0-alpine as build

WORKDIR /build-dir

COPY .npmrc .
COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

########################################################################################################################

FROM node:16.18.0-alpine

RUN apk add --no-cache tini

ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV SERVICE_PREFIX=/
ENV HTTP_PORT=3000
ENV EXPOSE_METRICS=false

WORKDIR /home/node/app

COPY --from=build /build-dir ./

USER node

# Tini is now available at /sbin/tini
ENTRYPOINT ["/sbin/tini", "--"]

CMD ./node_modules/.bin/lc39 ./index.js --port=${HTTP_PORT} --log-level=${LOG_LEVEL} --prefix=${SERVICE_PREFIX} --expose-metrics=${EXPOSE_METRICS}
