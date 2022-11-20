'use strict'

const fastifyEnv = require('@fastify/env')
const fp = require('fastify-plugin')
const mongodb = require('@fastify/mongodb')

const store = require('./api/store')
const inventory = require('./api/inventory')

const envSchema = {
  type: 'object',
  properties: {
    DOCKER_COMPOSE_MODE: { type: 'boolean' },
    MONGODB_URL: { type: 'string' },
    ROND_STANDALONE_URL: { type: 'string' },
  },
  required: ['MONGODB_URL'],
}

async function handlers(fastify) {
  const { config: { DOCKER_COMPOSE_MODE, ROND_STANDALONE_URL } } = fastify
  fastify.log.info({ mode: DOCKER_COMPOSE_MODE ? 'centralized' : 'distributed' }, 'running mode')

  fastify.decorate('rondStandalone', DOCKER_COMPOSE_MODE)
  fastify.decorate('rondStandaloneUrl', ROND_STANDALONE_URL)

  fastify.get('/store-info', store.options, store.handler)
  fastify.get('/inventory', inventory.getOptions, inventory.getHandler)
  fastify.post('/inventory', inventory.postOptions, inventory.postHandler)
  fastify.delete('/inventory', inventory.deleteOptions, inventory.deleteHandler)
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
    .register(fp(handlers, { decorators: { fastify: ['config'] } }))
}
