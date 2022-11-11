'use strict'

function getSecurityQuery(headers) {
  const rawQuery = headers['x-security-query']
  if (!rawQuery) {
    return
  }

  return JSON.parse(rawQuery)
}

async function getHandler(req) {
  const { log, headers } = req
  const securityQuery = getSecurityQuery(headers)
  log.info({ securityQuery }, 'received security query')
  return [
    { name: 't-shirt', sku: 42, price: 16 },
    { name: 'golden necklace', sku: 0, price: 200 },
    { name: 'wine', sku: 2, price: 6 },
  ]
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
  return {
    ok: true,
    itemId: 'todo',
  }
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
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            itemId: { type: 'string' },
          },
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
}
