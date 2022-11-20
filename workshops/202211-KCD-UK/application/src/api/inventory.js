'use strict'

const axios = require('axios')
const createError = require('http-errors')

const INVENTORY_COLLECTION_NAME = 'inventory'

async function rondStandaloneEval(rondStandaloneUrl, apiVerb, apiPath, headers) {
  try {
    const { headers: responseHeaders } = await axios({
      method: apiVerb,
      url: `${rondStandaloneUrl}/eval/${apiPath}`,
      path: apiPath,
      headers,
    })
    return { securityQuery: getSecurityQuery(responseHeaders) }
  } catch (error) {
    if (error?.response?.status === 403) {
      throw createError(403, 'asd')
    }
    throw error
  }
}

function getSecurityQuery(headers) {
  const rawQuery = headers['x-security-query']
  if (!rawQuery) {
    return
  }

  return JSON.parse(rawQuery)
}

async function getHandler(req) {
  const { log, headers } = req
  let securityQuery
  if (this.rondStandalone) {
    log.info('rond is running in standalone mode, here we are going to invoke evaluation')
    const { securityQuery: secQ } = await rondStandaloneEval(this.rondStandaloneUrl, 'get', 'inventory', {
      authorization: headers['authorization'],
    })
    securityQuery = secQ
  } else {
    securityQuery = getSecurityQuery(headers)
  }

  if (securityQuery) {
    log.info({ securityQuery }, 'received security query')
  }

  const inventory = await this.mongo.client.db().collection(INVENTORY_COLLECTION_NAME)
  const inventoryItems = await (await inventory.find(securityQuery || {})).toArray()
  log.info({ foundItems: inventoryItems.length }, 'inventory items fetched')

  return inventoryItems
}

const getOptions = {
  schema: {
    tags: ['KCD Store'],
    headers: {
      authorization: { type: 'string' },
    },
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            sku: { type: 'number' },
            price: { type: 'number' },
          },
        },
      },
    },
  },
}

async function postHandler(req) {
  const { log, body, headers } = req
  log.info({ body }, 'request body')

  if (this.rondStandalone) {
    log.info('rond is running in standalone mode, here we are going to invoke evaluation')
    await rondStandaloneEval(this.rondStandaloneUrl, 'post', 'inventory', {
      authorization: headers['authorization'],
    }, body)
  }

  let result
  try {
    result = await this.mongo.client.db()
      .collection(INVENTORY_COLLECTION_NAME)
      .insertOne(body)
  } catch (error) {
    log.error(error, 'failed insertion')
    throw new Error('failed database insertion')
  }

  log.info({ createdId: result.insertedId }, 'created item')
  return { ok: true, itemId: result.insertedId }
}

const postOptions = {
  schema: {
    tags: ['KCD Store'],
    headers: {
      authorization: { type: 'string' },
    },
    body: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        sku: { type: 'number' },
        price: { type: 'number' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          itemId: { type: 'string' },
        },
      },
    },
  },
}

async function deleteHandler(req, reply) {
  const { log, query, headers } = req
  log.info({ query }, 'request body')

  if (this.rondStandalone) {
    log.info('rond is running in standalone mode, here we are going to invoke evaluation')
    await rondStandaloneEval(this.rondStandaloneUrl, 'delete', 'inventory', {
      authorization: headers['authorization'],
    })
  }

  try {
    await this.mongo.client.db()
      .collection(INVENTORY_COLLECTION_NAME)
      .deleteOne({ name: query.name })
  } catch (error) {
    log.error(error, 'failed deletion')
    throw new Error('failed database deletion')
  }

  log.info('deleted item')
  reply.status(204)
}

const deleteOptions = {
  schema: {
    tags: ['KCD Store'],
    headers: {
      authorization: { type: 'string' },
    },
    querystring: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    },
    response: {
      204: {},
    },
  },
}

module.exports = {
  getHandler,
  getOptions,
  postHandler,
  postOptions,
  deleteHandler,
  deleteOptions,
  INVENTORY_COLLECTION_NAME,
}
