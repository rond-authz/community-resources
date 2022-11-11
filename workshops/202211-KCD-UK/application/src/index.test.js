'use strict'

const tap = require('tap')
const lc39 = require('@mia-platform/lc39')

async function launchService(envVariables) {
  const service = await lc39('./src/index.js', {
    logLevel: 'silent',
    envVariables,
  })
  return service
}

tap.test('store api', async t => {
  const service = await launchService({})
  t.teardown(async() => {
    await service.close()
  })

  const response = await service.inject({
    method: 'GET',
    url: `/store-info`,
  })

  t.equal(response.statusCode, 200)
  t.strictSame(JSON.parse(response.payload), {
    storeName: 'KCD Shop',
    address: 'CodeNode, 10 South Pl, London EC2M 7EB, UK',
  })
})

tap.test('get inventory api', async t => {
  const service = await launchService({})
  t.teardown(async() => {
    await service.close()
  })

  const response = await service.inject({
    method: 'GET',
    url: `/inventory`,
  })

  t.equal(response.statusCode, 200)
})

tap.test('post inventory api', async t => {
  const service = await launchService({})
  t.teardown(async() => {
    await service.close()
  })

  const response = await service.inject({
    method: 'POST',
    url: `/inventory`,
    payload: {
      name: 'new item',
      sku: 13,
      price: 12,
    },
  })

  t.equal(response.statusCode, 200)
})
