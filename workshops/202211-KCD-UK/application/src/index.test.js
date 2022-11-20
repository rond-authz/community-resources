'use strict'

const tap = require('tap')
const { MongoClient } = require('mongodb')
const nock = require('nock')
const { omit } = require('ramda')
const lc39 = require('@mia-platform/lc39')

const { INVENTORY_COLLECTION_NAME } = require('./api/inventory')

const CI_CONNECTION_STRING = 'mongodb://localhost:27017/demoapp'

async function launchService(envVariables, logLevel = 'silent') {
  const service = await lc39('./src/index.js', {
    logLevel,
    envVariables: {
      MONGODB_URL: CI_CONNECTION_STRING,
      ...envVariables,
    },
  })
  return service
}

const envForCentralizedConfig = {
  DOCKER_COMPOSE_MODE: true,
  ROND_STANDALONE_URL: 'http://rondalone',
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
  const mongoClient = new MongoClient(CI_CONNECTION_STRING)
  await populateInventoryForTests(t, mongoClient)

  const service = await launchService({})
  t.teardown(async() => {
    await service.close()
    await mongoClient.db().dropCollection(INVENTORY_COLLECTION_NAME)
    await mongoClient.db().dropDatabase()
    await mongoClient.close()
  })

  t.test('distributed', t => {
    t.test('with security query', async t => {
      const { statusCode, payload } = await service.inject({
        method: 'GET',
        url: `/inventory`,
        headers: {
          'x-security-query': '{"sku": 13}',
        },
      })

      t.equal(statusCode, 200)
      t.strictSame(JSON.parse(payload), [
        { name: '13 units', sku: 13, price: 100 },
      ])
      t.end()
    })

    t.test('without security query', async t => {
      const { statusCode, payload } = await service.inject({
        method: 'GET',
        url: `/inventory`,
      })

      t.equal(statusCode, 200)
      t.strictSame(JSON.parse(payload), [
        { name: 't-shirt', sku: 42, price: 16 },
        { name: 'golden necklace', sku: 0, price: 200 },
        { name: '13 units', sku: 13, price: 100 },
        { name: 'wine', sku: 2, price: 6 },
      ])
      t.end()
    })
    t.end()
  })

  t.test('centralized', async t => {
    const service = await launchService(envForCentralizedConfig)
    t.teardown(async() => {
      await service.close()
    })

    t.test('with security query', async t => {
      const standaloneRond = nock('http://rondalone/', {
        reqheaders: {
          authorization: 'the-header-from-the-client',
        },
      })
        .get('/eval/inventory')
        .reply(200, null, {
          'x-security-query': '{"sku": 13}',
        })

      const { statusCode, payload } = await service.inject({
        method: 'GET',
        url: `/inventory`,
        headers: {
          authorization: 'the-header-from-the-client',
        },
      })

      t.equal(statusCode, 200)
      t.strictSame(JSON.parse(payload), [
        { name: '13 units', sku: 13, price: 100 },
      ])
      t.ok(standaloneRond.isDone())
      t.end()
    })

    t.test('without security query', async t => {
      const expectedItems = [
        { name: 't-shirt', sku: 42, price: 16 },
        { name: 'golden necklace', sku: 0, price: 200 },
        { name: '13 units', sku: 13, price: 100 },
        { name: 'wine', sku: 2, price: 6 },
      ]

      t.test('no header', async t => {
        const standaloneRond = nock('http://rondalone/', {
          reqheaders: {
            authorization: 'the-header-from-the-client',
          },
        })
          .get('/eval/inventory')
          .reply(200, null, {})

        const { statusCode, payload } = await service.inject({
          method: 'GET',
          url: `/inventory`,
          headers: { authorization: 'the-header-from-the-client' },
        })

        t.equal(statusCode, 200)

        t.ok(standaloneRond.isDone())
        t.strictSame(JSON.parse(payload), expectedItems)
        t.end()
      })

      t.test('empty header', async t => {
        const standaloneRond = nock('http://rondalone/', {
          reqheaders: {
            authorization: 'the-header-from-the-client',
          },
        })
          .get('/eval/inventory')
          .reply(200, null, { 'x-security-query': '' })

        const { statusCode, payload } = await service.inject({
          method: 'GET',
          url: `/inventory`,
          headers: { authorization: 'the-header-from-the-client' },
        })

        t.equal(statusCode, 200)

        t.ok(standaloneRond.isDone())
        t.strictSame(JSON.parse(payload), expectedItems)
        t.end()
      })

      t.end()
    })

    t.end()
  })

  t.end()
})

tap.test('post inventory api', async t => {
  const mongoClient = new MongoClient(CI_CONNECTION_STRING)
  const service = await launchService({})
  t.teardown(async() => {
    await service.close()
    await mongoClient.db().dropCollection(INVENTORY_COLLECTION_NAME)
    await mongoClient.db().dropDatabase()
    await mongoClient.close()
  })

  t.test('distributed', async t => {
    t.test('insertion ok', async t => {
      const response = await service.inject({
        method: 'POST',
        url: `/inventory`,
        payload: {
          name: 'new item from distributed',
          sku: 13,
          price: 12,
        },
      })

      t.equal(response.statusCode, 200)
      const foundItem = await mongoClient.db().collection(INVENTORY_COLLECTION_NAME)
        .findOne({ name: 'new item from distributed' })
      t.strictSame(omit(['_id'], foundItem), {
        name: 'new item from distributed',
        sku: 13,
        price: 12,
      })
      t.end()
    })

    t.end()
  })

  t.test('centralized', async t => {
    const service = await launchService(envForCentralizedConfig)
    t.teardown(async() => {
      await service.close()
    })

    t.test('ok', async t => {
      const standaloneRond = nock('http://rondalone/', {
        reqheaders: {
          authorization: 'the-header-from-the-client',
        },
      })
        .post('/eval/inventory')
        .reply(200)

      const response = await service.inject({
        method: 'POST',
        url: `/inventory`,
        headers: {
          authorization: 'the-header-from-the-client',
        },
        payload: {
          name: 'new item from centralized',
          sku: 13,
          price: 12,
        },
      })

      t.equal(response.statusCode, 200, response.payload)
      const foundItem = await mongoClient.db().collection(INVENTORY_COLLECTION_NAME)
        .findOne({ name: 'new item from centralized' })
      t.strictSame(omit(['_id'], foundItem), {
        name: 'new item from centralized',
        sku: 13,
        price: 12,
      })

      t.ok(standaloneRond.isDone())

      t.end()
    })

    t.test('not ok', async t => {
      const standaloneRond = nock('http://rondalone/')
        .post('/eval/inventory')
        .reply(403, { error: 'forbidden' })

      const response = await service.inject({
        method: 'POST',
        url: `/inventory`,
        payload: {
          name: 'new item from centralized ko',
          sku: 13,
          price: 12,
        },
      })

      t.equal(response.statusCode, 403, response.payload)
      const foundItem = await mongoClient.db().collection(INVENTORY_COLLECTION_NAME)
        .findOne({ name: 'new item from centralized ko' })
      t.notOk(foundItem)

      t.ok(standaloneRond.isDone())

      t.end()
    })

    t.test('not ok on non-forbidden error', async t => {
      const standaloneRond = nock('http://rondalone/')
        .post('/eval/inventory')
        .reply(400, { error: 'forbidden' })

      const response = await service.inject({
        method: 'POST',
        url: `/inventory`,
        payload: {
          name: 'new item from centralized ko',
          sku: 13,
          price: 12,
        },
      })

      t.equal(response.statusCode, 500, response.payload)
      const foundItem = await mongoClient.db().collection(INVENTORY_COLLECTION_NAME)
        .findOne({ name: 'new item from centralized ko' })
      t.notOk(foundItem)

      t.ok(standaloneRond.isDone())

      t.end()
    })

    t.end()
  })

  t.end()
})

tap.test('OAS documentations', async t => {
  const service = await launchService({})
  t.teardown(async() => {
    await service.close()
  })

  const { statusCode, payload } = await service.inject({
    method: 'GET',
    url: `/documentation/json`,
  })

  t.equal(statusCode, 200)
  t.ok(payload)
})

async function populateInventoryForTests(t, client) {
  await client.db().collection(INVENTORY_COLLECTION_NAME)
    .insertMany([
      { name: 't-shirt', sku: 42, price: 16 },
      { name: 'golden necklace', sku: 0, price: 200 },
      { name: '13 units', sku: 13, price: 100 },
      { name: 'wine', sku: 2, price: 6 },
    ])
}

module.exports = launchService
