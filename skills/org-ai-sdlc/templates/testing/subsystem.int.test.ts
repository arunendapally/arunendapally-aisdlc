// Subsystem level: the real service code against a real, throwaway Postgres.
// Each test runs inside a transaction that is rolled back, so no test sees another's rows.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { Client } from 'pg'
import { makeOrder, makeUser } from './factories'
import { migrate } from '../src/db/migrate' // the repo's own migrations, so the schema is the real one
import { cancelOrder } from '../src/orders' // the code under test, given a db client

let container: StartedPostgreSqlContainer
let db: Client

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine').start()
  db = new Client({ connectionString: container.getConnectionUri() })
  await db.connect()
  await migrate(db)
}, 120_000)

afterAll(async () => {
  await db?.end()
  await container?.stop()
})

beforeEach(async () => db.query('BEGIN'))
afterEach(async () => db.query('ROLLBACK')) // teardown runs even when the test fails

describe('orders', () => {
  test('AC-4 a shopper can cancel their own order before it ships', async () => {
    const user = makeUser()
    const order = makeOrder({ userId: user.id })
    await db.query('INSERT INTO users (id, email, name) VALUES ($1, $2, $3)', [user.id, user.email, user.name])
    await db.query('INSERT INTO orders (id, user_id, total, status) VALUES ($1, $2, $3, $4)', [order.id, order.userId, order.total, order.status])

    await cancelOrder(db, { orderId: order.id, userId: user.id })

    const { rows } = await db.query('SELECT status FROM orders WHERE id = $1', [order.id])
    expect(rows[0].status).toBe('cancelled')
  })
})
