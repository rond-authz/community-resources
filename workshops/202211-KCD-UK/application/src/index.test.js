'use strict'

const tap = require('tap')
const lc39 = require('@mia-platform/lc39')

async function launchService(envVariables, logLevel = 'silent') {
  const service = await lc39('./src/index.js', {
    logLevel,
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
  t.end()
})

tap.test('get inventory api', async t => {
  const service = await launchService({}, 'info')
  t.teardown(async() => {
    await service.close()
  })

  t.test('with security query', async t => {
    const response = await service.inject({
      method: 'GET',
      url: `/inventory`,
      headers: {
        'x-security-query': '{"sku": 13}',
      },
    })

    t.equal(response.statusCode, 200)
    t.end()
  })

  t.test('without security query', async t => {
    const response = await service.inject({
      method: 'GET',
      url: `/inventory`,
    })

    t.equal(response.statusCode, 200)
    t.end()
  })

  t.end()
})

tap.test('post inventory api', async t => {
  const service = await launchService({}, 'info')
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
  t.end()
})
