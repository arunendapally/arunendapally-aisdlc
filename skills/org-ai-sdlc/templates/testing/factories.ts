// Unit-level test data: factories with sensible defaults, unique values per run, and overrides.
// A test states only what matters to it: makeOrder({ status: 'shipped' }).
const run = Math.random().toString(36).slice(2, 8)
let seq = 0
const unique = (prefix: string) => `${prefix}-${run}-${++seq}`

export type User = { id: string; email: string; name: string }
export type Order = { id: string; userId: string; total: number; status: 'open' | 'shipped' | 'cancelled' }

export const makeUser = (over: Partial<User> = {}): User => ({
  id: unique('user'),
  email: `${unique('test')}@example.test`,
  name: 'Test User',
  ...over,
})

export const makeOrder = (over: Partial<Order> = {}): Order => ({
  id: unique('order'),
  userId: over.userId ?? makeUser().id,
  total: 100,
  status: 'open',
  ...over,
})

// The marker every generated row carries, so a data check can find leftovers: see dataCheckCommand.
export const TEST_MARKER = `-${run}-`
