'use strict'

const INVENTORY_COLLECTION_NAME = 'inventory'

function getSecurityQuery(headers) {
  const rawQuery = headers['x-security-query']
  if (!rawQuery) {
    return
  }

  return JSON.parse(rawQuery)
}

async function getHandler(req) {
  const { log, headers } = req
  if (this.rondStandalone) {
    log.info('rond is running in standalone mode, here we are going to invoke evaluation')
  }

  const securityQuery = getSecurityQuery(headers)
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
  const { log, body } = req
  log.info({ body }, 'request body')

  if (this.rondStandalone) {
    log.info('rond is running in standalone mode, here we are going to invoke evaluation')
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

module.exports = {
  getHandler,
  getOptions,
  postHandler,
  postOptions,
  INVENTORY_COLLECTION_NAME,
}
