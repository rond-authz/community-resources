'use strict'

async function handler() {
  return {
    storeName: 'KCD Shop',
    address: 'CodeNode, 10 South Pl, London EC2M 7EB, UK',
  }
}

const options = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          storeName: { type: 'string' },
          address: { type: 'string' },
        },
      },
    },
  },
}

module.exports = {
  handler,
  options,
}
