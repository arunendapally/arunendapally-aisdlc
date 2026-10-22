// E2E level: Playwright fixtures that seed data through the API before a test and delete it after,
// even when the test fails. The test reads as the user journey; the data plumbing lives here.
import { test as base, expect, type APIRequestContext } from '@playwright/test'

type Shopper = { id: string; email: string; password: string }

async function createShopper(api: APIRequestContext): Promise<Shopper> {
  const email = `test-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}@example.test`
  const password = 'Test-only-password-1'
  const res = await api.post('/test-support/users', { data: { email, password } })
  expect(res.status()).toBe(201)
  return { id: (await res.json()).id, email, password }
}

export const test = base.extend<{ shopper: Shopper }>({
  shopper: async ({ request }, use) => {
    const shopper = await createShopper(request) // setup
    await use(shopper) // the test runs here
    await request.delete(`/test-support/users/${shopper.id}`) // teardown, also after a failure
  },
})

export { expect }

// Usage, in e2e/saved-items.spec.ts:
//
// import { test, expect } from './e2e-fixtures'
//
// test('AC-3 a saved item that sells out is marked unavailable', async ({ page, shopper }) => {
//   await page.goto('/login')
//   await page.getByLabel('Email').fill(shopper.email)
//   await page.getByLabel('Password').fill(shopper.password)
//   await page.getByRole('button', { name: 'Sign in' }).click()
//   ...
//   await expect(page.getByText('Blue mug')).toContainText('unavailable')
// })
