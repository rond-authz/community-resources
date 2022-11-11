'use strict'

async function handler(req) {
  const { log } = req
  if (this.rondStandalone) {
    log.info('rond is running in standalone mode, here we are going to invoke evaluation')
  }

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
