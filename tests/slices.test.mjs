// Issue #28: a big capability is sliced into features, and specs/<capability>/slices.md records the
// slices and their order. Each slice's PRD names its capability, and status shows how far each has got.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo } from './helpers.mjs'

const SLICES = '# Slices: checkout\n\n## Outcome\n\nShoppers pay in one step.\n\n## Slices\n\n- cart-save: the basket survives a reload. Depends on: none. Status: planned\n- pay-later: pay within 30 days. Depends on: cart-save. Status: planned\n'

test('a slice names its capability in its PRD, and the capability must exist', () => {
  const r = makeRepo()
  assert.match(r.sdlc('init', 'cart-save', '--capability', 'checkout').out, /No specs\/checkout\/slices\.md: write the capability's outcome and slices there first/)
  assert.equal(r.write('specs/checkout/slices.md', SLICES), 'allow', 'the CTO writes the record before any slice exists')
  r.put('specs/checkout/slices.md', SLICES)
  const out = r.sdlc('init', 'cart-save', '--capability', 'checkout')
  assert.equal(out.status, 0, out.out)
  assert.match(fs.readFileSync(path.join(r.repo, 'specs', 'cart-save', 'prd.md'), 'utf8'), /^# PRD: <feature>\n\nCapability: checkout \(specs\/checkout\/slices\.md\)\n/)
  assert.equal(r.state('cart-save').capability, 'checkout')
})

test('status shows each capability with its slices and how far each has got', () => {
  const r = makeRepo()
  r.put('specs/checkout/slices.md', SLICES)
  r.sdlc('init', 'cart-save', '--capability', 'checkout')
  const out = r.sdlc('status').out
  assert.match(out, /Capability checkout: Shoppers pay in one step\./)
  assert.match(out, /\n  cart-save: stage 1 Plan \(light lane\)/)
  assert.match(out, /\n  pay-later: not started \(planned\), depends on cart-save/)
})
