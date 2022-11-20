'use strict'

const fastifyEnv = require('@fastify/env')
const fp = require('fastify-plugin')
const mongodb = require('@fastify/mongodb')

const store = require('./api/store')
const inventory = require('./api/inventory')


// eslint-disable-next-line
// admin_jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZXRoIiwibmFtZSI6IkJldGggU21pdGgiLCJpYXQiOjE1MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.M_Fe4mtcHCDtmd1CEnPgGo2cY-oXGPBXG4RJAUKNlS4"
// eslint-disable-next-line
// user_jet: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZXRoIiwibmFtZSI6IkplcnJ5IFNtaXRoIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoidXNlciJ9.LjI6XBWM0z94eUP0NLiRqlXPSzorsOnJ7J8jPfN-JNc"

const envSchema = {
  type: 'object',
  properties: {
    DOCKER_COMPOSE_MODE: { type: 'boolean' },
    MONGODB_URL: { type: 'string' },
  },
  required: ['MONGODB_URL'],
}

async function handlers(fastify) {
  const { config: { DOCKER_COMPOSE_MODE } } = fastify
  fastify.log.info({ mode: DOCKER_COMPOSE_MODE ? 'centralized' : 'distributed' }, 'running mode')

  fastify.decorate('rondStandalone', DOCKER_COMPOSE_MODE)

  fastify.get('/store-info', store.options, store.handler)
  fastify.get('/inventory', inventory.getOptions, inventory.getHandler)
  fastify.post('/inventory', inventory.postOptions, inventory.postHandler)
  fastify.log.info('router setup done')
}

async function registerMongo(fastify) {
  const { config: { MONGODB_URL } } = fastify
  fastify.register(mongodb, {
    forceClose: true,
    url: MONGODB_URL,
  })
}

module.exports = async function application(fastify, opts) {
  fastify
    .register(fastifyEnv, { schema: envSchema, data: [process.env, opts], env: false })
    .register(fp(registerMongo, { decorators: { fastify: ['config'] } }))
    .register(fp(handlers))
}
