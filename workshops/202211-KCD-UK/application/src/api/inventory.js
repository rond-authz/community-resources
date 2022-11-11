'use strict'

async function getHandler() {
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

async function postHandler() {
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
