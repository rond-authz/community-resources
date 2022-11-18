'use strict'

async function handler(req) {
  const { log } = req
  if (this.rondStandalone) {
    log.info('rond is running in standalone mode, here we are going to invoke evaluation')
  }
  
  const stores = await this.mongo.client.db().collection('stores');
  const docs = await stores.findOne()
  const { _id, ...data } = docs;
  
  return data;
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
