// Contracts a reviewer can see: an ER diagram for data changes and an OpenAPI file for API changes.
// - erProblems(): the plan's Data model holds a Mermaid erDiagram whose "%% changed:" line names the
//   entities this change adds or alters, each drawn in the diagram. GitHub and Confluence render it.
// - openapiProblems(): a structural check of an OpenAPI 3 file (a YAML subset: block style, two-space
//   indent), with no dependencies. Full validation belongs in CI (Redocly or Spectral).
// - breakingChanges(): operations and response codes the base branch had that this file no longer has.
import { section } from './lib.mjs'

const METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace']

export function erProblems(planText) {
  const model = section(planText, '## Data model') ?? ''
  const block = model.match(/```mermaid\s*\n([\s\S]*?)```/)?.[1]
  if (!block || !/^\s*erDiagram\b/m.test(block)) return ['plan.md "## Data model" has no Mermaid erDiagram: draw the entities this change touches (```mermaid erDiagram ...```)']
  const problems = []
  const entities = new Map()
  for (const m of block.matchAll(/^\s*([A-Za-z_][\w-]*)\s*\{([^}]*)\}/gm)) {
    entities.set(m[1].toUpperCase(), m[2].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%')))
  }
  const related = [...block.matchAll(/^\s*([A-Za-z_][\w-]*)\s+[|}o][|o]?--[|o{][|{o]?\s+([A-Za-z_][\w-]*)\s*:/gm)]
  for (const r of related) for (const e of [r[1], r[2]]) if (!entities.has(e.toUpperCase())) entities.set(e.toUpperCase(), entities.get(e.toUpperCase()) ?? null)
  if (!entities.size) problems.push('the erDiagram draws no entities')
  for (const [name, attrs] of entities) if (attrs && !attrs.length) problems.push(`entity ${name} lists no attributes`)
  const changed = block.match(/^\s*%%\s*changed:\s*(.+)$/im)?.[1]
  if (!changed) problems.push('the erDiagram has no "%% changed: ENTITY, ..." line naming what this change adds or alters')
  else {
    for (const name of changed.split(/[,\s]+/).filter(Boolean).map(n => n.toUpperCase())) {
      if (!entities.has(name)) problems.push(`"%% changed:" names ${name}, which the erDiagram does not draw`)
      else if (!entities.get(name)) problems.push(`${name} is changed, so draw it with its attributes, not only in a relationship`)
    }
  }
  return problems
}

// Parse the YAML subset an OpenAPI file uses into { openapi, info, paths, schemas } facts.
export function readOpenapi(text) {
  const lines = text.split(/\r?\n/).map((raw, i) => ({ n: i + 1, raw, indent: raw.match(/^ */)[0].length, body: raw.trim() }))
    .filter(l => l.body && !l.body.startsWith('#'))
  const top = key => lines.find(l => l.indent === 0 && l.body.startsWith(`${key}:`))
  const childrenOf = (parent, depth) => {
    const out = []
    const start = lines.indexOf(parent)
    for (let i = start + 1; i < lines.length && lines[i].indent > parent.indent; i++) if (lines[i].indent === depth) out.push({ line: lines[i], i })
    return out
  }
  const value = l => l.body.replace(/^[^:]+:\s*/, '').replace(/^['"]|['"]$/g, '')
  const info = top('info')
  const paths = top('paths')
  const components = top('components')
  const schemasLine = components && childrenOf(components, 2).find(c => c.line.body.startsWith('schemas:'))?.line
  const schemas = schemasLine ? childrenOf(schemasLine, 4).map(c => c.line.body.replace(/:.*$/, '')) : []
  const operations = []
  for (const p of paths ? childrenOf(paths, 2) : []) {
    const route = p.line.body.replace(/:\s*$/, '').replace(/^['"]|['"]$/g, '')
    for (const op of childrenOf(p.line, 4)) {
      const method = op.line.body.replace(/:.*$/, '')
      if (!METHODS.includes(method)) continue
      const fields = childrenOf(op.line, 6)
      const responses = fields.find(f => f.line.body.startsWith('responses:'))
      const codes = responses ? childrenOf(responses.line, 8).map(c => c.line.body.replace(/:.*$/, '').replace(/['"]/g, '')) : []
      const operationId = fields.find(f => f.line.body.startsWith('operationId:'))
      operations.push({ route, method, line: op.line.n, codes, operationId: operationId ? value(operationId.line) : null })
    }
  }
  return {
    version: top('openapi') ? value(top('openapi')) : null,
    title: info && childrenOf(info, 2).find(c => c.line.body.startsWith('title:')) ? true : false,
    infoVersion: info && childrenOf(info, 2).find(c => c.line.body.startsWith('version:')) ? true : false,
    hasPaths: Boolean(paths),
    operations,
    schemas,
    refs: [...text.matchAll(/\$ref:\s*['"]?#\/components\/schemas\/([\w.-]+)['"]?/g)].map(m => m[1]),
  }
}

// Field-shaped names (snake_case or camelCase, in backticks or quotes) that the contract never defines,
// as { name, where }. Advice only (issue #26): it becomes blocking only if it proves reliable.
export function undefinedFields(openapiText, docs) {
  const defined = new Set([...openapiText.matchAll(/^\s*(?:-\s*name:\s*)?([A-Za-z_][\w-]*)\s*:/gm), ...openapiText.matchAll(/^\s*-?\s*name:\s*([A-Za-z_][\w-]*)/gm)].map(m => m[1]))
  const found = new Map()
  for (const [where, text] of Object.entries(docs)) {
    for (const m of text.matchAll(/[`"]([a-z][a-z0-9]*(?:_[a-z0-9]+)+|[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)+)[`"]/g)) if (!defined.has(m[1]) && !found.has(m[1])) found.set(m[1], where)
  }
  return [...found].map(([name, where]) => ({ name, where }))
}

export function openapiProblems(text) {
  const o = readOpenapi(text)
  const problems = []
  if (!/^3\.(0|1)\.\d+$/.test(o.version ?? '')) problems.push(`"openapi:" must be 3.0.x or 3.1.x, not ${o.version ?? 'missing'}`)
  if (!o.title) problems.push('info has no title')
  if (!o.infoVersion) problems.push('info has no version')
  if (!o.hasPaths || !o.operations.length) problems.push('paths defines no operations')
  const ids = new Map()
  for (const op of o.operations) {
    const name = `${op.method.toUpperCase()} ${op.route}`
    if (!op.codes.length) problems.push(`${name} (line ${op.line}) has no responses`)
    if (!op.operationId) problems.push(`${name} (line ${op.line}) has no operationId`)
    else if (ids.has(op.operationId)) problems.push(`operationId ${op.operationId} is used by ${ids.get(op.operationId)} and ${name}`)
    else ids.set(op.operationId, name)
  }
  for (const ref of new Set(o.refs)) if (!o.schemas.includes(ref)) problems.push(`$ref to #/components/schemas/${ref}, which components.schemas does not define`)
  return problems
}

// What a client relying on the base version would lose: a whole operation, or a response code.
export function breakingChanges(baseText, text) {
  const before = readOpenapi(baseText).operations
  const after = readOpenapi(text).operations
  const out = []
  for (const b of before) {
    const a = after.find(x => x.route === b.route && x.method === b.method)
    if (!a) out.push(`removed ${b.method.toUpperCase()} ${b.route}`)
    else for (const code of b.codes.filter(c => !a.codes.includes(c))) out.push(`${b.method.toUpperCase()} ${b.route} no longer returns ${code}`)
  }
  return out
}
