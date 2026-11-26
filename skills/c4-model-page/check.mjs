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

const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
const text = s => decode(s.replace(/<[^>]*>/g, '')).trim()
const diagram = (html, view) => html.match(new RegExp(`<pre class="mermaid" data-view="${view}">([\\s\\S]*?)</pre>`))?.[1]
const rows = (html, name) => [...(html.match(new RegExp(`<table data-table="${name}">[\\s\\S]*?<tbody>([\\s\\S]*?)</tbody>`))?.[1] ?? '')
  .matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(r => [...r[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map(c => text(c[1])))

// A flowchart's nodes (id to its bold name), classes (id to class) and arrows ([from id, to id]).
function flowchart(src) {
  const body = decode(src)
  const names = new Map([...body.matchAll(/^\s*(\w+)\s*(?:\(\[|\[\(|\[)"<b>(.*?)<\/b>/gm)].map(m => [m[1], m[2].trim()]))
  const classes = new Map()
  for (const m of body.matchAll(/^\s*class\s+([\w,]+)\s+(\w+)\s*$/gm)) for (const id of m[1].split(',')) classes.set(id, m[2])
  const arrows = [...body.matchAll(/^\s*(\w+)\s*(?:-->|==>|-\.->)\s*(?:\|[^|]*\|\s*)?(\w+)\s*$/gm)].map(m => [m[1], m[2]])
  return { body, names, classes, arrows }
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
    for (const c of CLASSES) if (!new RegExp(`^\\s*classDef ${c} `, 'm').test(charts[view].body)) problems.push(`The ${view} diagram has no classDef ${c}.`)
  }
  const box = charts.containers
  if (box) {
    const name = id => box.names.get(id) ?? id
    const arrows = new Set(box.arrows.filter(([from]) => box.classes.get(from) !== 'person').map(([a, b]) => `${name(a)} → ${name(b)}`))
    const calls = new Set(rows(html, 'calls').map(r => r[0].replace(/\s*(->|→)\s*/, ' → ')))
    for (const c of calls) if (!arrows.has(c)) problems.push(`Calls lists ${c} but Containers has no arrow for it.`)
    for (const a of arrows) if (!calls.has(a)) problems.push(`Containers draws ${a} but Calls has no row for it.`)
  }
  for (const [system, change] of rows(html, 'changes')) {
    const want = CHANGE.find(([re]) => re.test(change ?? ''))?.[1]
    if (!want) { problems.push(`Changes row ${system} says "${change}"; start it with New, Changed or No change.`); continue }
    const drawn = Object.entries(charts).flatMap(([view, c]) => [...c.names].filter(([, n]) => n === system).map(([id]) => [view, c.classes.get(id)]))
    if (!drawn.length) problems.push(`Changes lists ${system} but no diagram draws it.`)
    for (const [view, got] of drawn) if (got !== want) problems.push(`${system} is ${want} in Changes but ${got ?? 'unclassed'} in the ${view} diagram.`)
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
