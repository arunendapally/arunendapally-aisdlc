#!/usr/bin/env node
// Checks a C4 model page built from reference/page-template.md: the five tabs, the three diagrams with
// their classDefs, every call row an arrow in Containers and back, and every system in the Changes table
// coloured as its change. It reads only the page. node check.mjs <page.html>
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const TABS = ['#1', '#2', '#calls', '#run', '#changes']
const VIEWS = ['context', 'containers', 'run']
const CLASSES = ['person', 'new', 'changing', 'unchanged', 'outside']
const CHANGE = [[/^new\b/i, 'new'], [/^changed?\b/i, 'changing'], [/^no change\b/i, 'unchanged']]
// Arrows become one marker character before parsing, so no pattern here spells an arrow.
const MARK = '\u0001'
const ARROWS = ['-.->', '.->', '==>', '-' + '->']

const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
// Cell text for messages: decode first, then strip tags until none is left.
function text(s) {
  let t = decode(s), prev
  do { prev = t; t = t.replace(/<[^>]*>/g, '') } while (t !== prev)
  return t.trim()
}
const diagram = (html, view) => html.match(new RegExp(`<pre class="mermaid" data-view="${view}">([\\s\\S]*?)</pre>`))?.[1]
// A table's body rows as cell text, or null when the page has no such table. Rows without cells are dropped.
function rows(html, name) {
  const body = html.match(new RegExp(`<table data-table="${name}">[\\s\\S]*?<tbody>([\\s\\S]*?)</tbody>`))?.[1]
  if (body === undefined) return null
  return [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)]
    .map(r => [...r[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(c => text(c[1])))
    .filter(r => r.length)
}

// A flowchart's nodes (id to its bold name), classes (id to class), arrows ([from id, to id]) and the arrow
// lines it could not read, so no arrow is skipped without a word.
function flowchart(src) {
  const body = decode(src)
  const names = new Map([...body.matchAll(/^\s*(\w+)\s*(?:\(\[|\[\(|\[)"<b>(.*?)<\/b>/gm)].map(m => [m[1], m[2].trim()]))
  const classes = new Map()
  for (const m of body.matchAll(/^\s*class\s+([\w,]+)\s+(\w+)\s*$/gm)) for (const id of m[1].split(',')) classes.set(id, m[2])
  const arrows = [], unread = []
  for (const line of body.split('\n')) {
    // Drop |label| and the -- "label" --> forms and a trailing ";", then split a chain a --> b --> c.
    const marked = ARROWS.reduce((l, a) => l.replaceAll(a, MARK), line.replace(/\|[^|]*\|/g, ''))
    if (!marked.includes(MARK)) continue
    const bare = marked.replace(/(?:--|==|-\.)\s*"[^"]*"\s*\u0001/g, MARK).replace(/(?:--|==)\s+[^\u0001"]+?\s+\u0001/g, MARK)
      .trim().replace(/;$/, '').trim()
    const ids = bare.split(MARK).map(id => id.trim())
    if (ids.every(id => /^\w+$/.test(id))) ids.slice(1).forEach((to, i) => arrows.push([ids[i], to]))
    else unread.push(line.trim())
  }
  return { body, names, classes, arrows, unread }
}

export function checkPage(html) {
  const problems = []
  for (const tab of TABS) if (!new RegExp(`role="tab" href="${tab}"`).test(html)) problems.push(`No tab links to ${tab}.`)
  const charts = {}
  for (const view of VIEWS) {
    const src = diagram(html, view)
    if (!src) { problems.push(`No ${view} diagram (pre.mermaid data-view="${view}").`); continue }
    if (view === 'run') continue
    charts[view] = flowchart(src)
    for (const line of charts[view].unread) problems.push(`The ${view} diagram has an arrow line check.mjs cannot read: "${line}". Write one arrow per line, a -->|"label"| b, with nodes defined on their own lines.`)
    for (const c of CLASSES) if (!new RegExp(`^\\s*classDef ${c} `, 'm').test(charts[view].body)) problems.push(`The ${view} diagram has no classDef ${c}.`)
  }
  const callRows = rows(html, 'calls') ?? (problems.push('No Calls table (table data-table="calls").'), [])
  const box = charts.containers
  if (box) {
    const name = id => box.names.get(id) ?? id
    const arrows = new Set(box.arrows.filter(([from]) => box.classes.get(from) !== 'person').map(([a, b]) => `${name(a)} → ${name(b)}`))
    const calls = new Set(callRows.map(r => r[0].replace(/\s*(->|→)\s*/, ' → ')))
    for (const c of calls) if (!arrows.has(c)) problems.push(`Calls lists ${c} but Containers has no arrow for it.`)
    for (const a of arrows) if (!calls.has(a)) problems.push(`Containers draws ${a} but Calls has no row for it.`)
  }
  const changeRows = rows(html, 'changes') ?? (problems.push('No Changes table (table data-table="changes").'), [])
  for (const [system, change] of changeRows) {
    const want = CHANGE.find(([re]) => re.test(change ?? ''))?.[1]
    if (!want) { problems.push(`Changes row ${system} says "${change ?? ''}"; start it with New, Changed or No change.`); continue }
    const drawn = Object.entries(charts).flatMap(([view, c]) => [...c.names].filter(([, n]) => n === system).map(([id]) => [view, c.classes.get(id)]))
    if (!drawn.length) problems.push(`Changes lists ${system} but no diagram draws it.`)
    // A system outside the journey that does not change may stay purple.
    for (const [view, got] of drawn) if (got !== want && !(want === 'unchanged' && got === 'outside')) problems.push(`${system} is ${want} in Changes but ${got ?? 'unclassed'} in the ${view} diagram.`)
  }
  return problems
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2]
  if (!file) { console.error('Usage: node check.mjs <page.html>'); process.exit(2) }
  const problems = checkPage(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'))
  console.log(problems.length ? problems.join('\n') : `${file}: 5 tabs, 3 diagrams, calls and changes agree.`)
  process.exit(problems.length ? 1 : 0)
}
