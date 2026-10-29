// The knowledge base: what agents learn, kept as an Open Knowledge Format (OKF 0.2) bundle in
// knowledge/: plain Markdown pages with YAML frontmatter, so any human, agent or wiki tool can read it.
// Each page names the source files it describes and the commit it was last verified at, so a page goes
// stale when its sources change. Pages in the older format (name, sources as paths, verified: <sha>)
// are still read and checked.
import fs from 'node:fs'
import path from 'node:path'
import { git } from './lib.mjs'

export const TYPES = ['system', 'component', 'decision', 'trap', 'runbook', 'howto', 'glossary', 'playbook']
export const GRADES = ['Established', 'Moderate', 'Preliminary']
export const OKF_VERSION = '0.2'
const REQUIRED = ['type', 'title', 'description', 'sources', 'verified_commit', 'confidence']
const LEGACY_REQUIRED = ['name', 'description', 'type', 'sources', 'verified', 'confidence']
const RESERVED = ['index.md', 'log.md']

// A small reader for the YAML that frontmatter uses: "key: value", quoted strings, "# comments",
// flow lists [a, b] and mappings { a: b }, and block lists and mappings nested by indentation.
const indent = l => l.match(/^ */)[0].length

function splitFlow(s) {
  const out = []
  let depth = 0, quote = '', cur = ''
  for (const ch of s) {
    if (quote) quote = ch === quote ? '' : quote
    else if (ch === '"' || ch === "'") quote = ch
    else if ('[{'.includes(ch)) depth++
    else if (']}'.includes(ch)) depth--
    else if (ch === ',' && !depth) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  return [...out, cur].map(v => v.trim()).filter(Boolean)
}

function scalar(raw) {
  let v = raw.trim()
  if (!/^["']/.test(v)) v = v.replace(/\s+#.*$/, '')
  const q = v.match(/^"(.*)"$|^'(.*)'$/)
  if (q) return q[1] ?? q[2]
  if (/^\[.*\]$/.test(v)) return splitFlow(v.slice(1, -1)).map(scalar)
  if (/^\{.*\}$/.test(v)) return pairs(splitFlow(v.slice(1, -1)))
  return v
}

function pairs(items) {
  const map = {}
  for (const item of items) {
    const kv = item.match(/^([\w-]+):\s*(.*)$/)
    if (kv) map[kv[1]] = scalar(kv[2])
  }
  return map
}

// Lines at the block's own indent start an entry; deeper lines (and, under a key, "- " lines at the
// same indent) belong to the entry above them.
function groups(lines, base, inMap) {
  const out = []
  for (const l of lines) {
    if (out.length && (indent(l) > base || (inMap && /^\s*-(\s|$)/.test(l)))) out.at(-1).body.push(l)
    else out.push({ head: l, body: [] })
  }
  return out
}

function block(lines) {
  if (!lines.length) return ''
  const base = indent(lines[0])
  if (/^\s*-(\s|$)/.test(lines[0])) {
    return groups(lines, base, false).map(({ head, body }) => {
      const first = head.trim().replace(/^-\s*/, '')
      return !body.length && !/^[\w-]+:(\s|$)/.test(first) ? scalar(first) : block([' '.repeat(base + 2) + first, ...body])
    })
  }
  const map = {}
  for (const { head, body } of groups(lines, base, true)) {
    const kv = head.trim().match(/^([\w-]+):\s*(.*)$/)
    if (kv) map[kv[1]] = kv[2].trim() && !/^#/.test(kv[2].trim()) ? scalar(kv[2]) : block(body)
  }
  return map
}

export function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return null
  return block(m[1].split(/\r?\n/).filter(l => l.trim() && !/^\s*#/.test(l)))
}

// Every Markdown file in knowledge/, as paths relative to it.
function markdown(dir) {
  const root = path.join(dir, 'knowledge')
  if (!fs.existsSync(root)) return []
  const out = []
  const walk = rel => {
    for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const p = path.join(rel, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.md')) out.push(p.split(path.sep).join('/'))
    }
  }
  walk('')
  return out
}

// What a page's frontmatter means, in either format.
const isLegacy = meta => 'name' in meta && !('title' in meta)
const sourcesOf = meta => (Array.isArray(meta?.sources) ? meta.sources : [])
  .map(s => (typeof s === 'string' ? s : s?.resource)).filter(s => typeof s === 'string' && s)
const commitOf = meta => (isLegacy(meta) ? meta.verified : meta.verified_commit)
const nameOf = p => p.meta?.name ?? path.basename(p.file, '.md')
const titleOf = p => p.meta?.title || nameOf(p)

export function pages(dir) {
  return markdown(dir)
    .filter(rel => !RESERVED.includes(path.basename(rel).toLowerCase()) && path.basename(rel) !== 'README.md')
    .map(rel => {
      const text = fs.readFileSync(path.join(dir, 'knowledge', rel), 'utf8')
      const meta = frontmatter(text)
      return { file: `knowledge/${rel}`, meta, text, sources: sourcesOf(meta) }
    })
}

// Problems that make a page unusable, and pages whose sources moved on since they were verified.
export function check(dir) {
  const all = pages(dir)
  const names = new Set(all.filter(p => p.meta).map(nameOf))
  const invalid = []
  const stale = []
  for (const p of all) {
    if (!p.meta) {
      invalid.push(`${p.file}: no frontmatter`)
      continue
    }
    const required = isLegacy(p.meta) ? LEGACY_REQUIRED : REQUIRED
    const missing = required.filter(k => (k === 'sources' ? !p.sources.length : !p.meta[k] || typeof p.meta[k] !== 'string'))
    if (missing.length) invalid.push(`${p.file}: missing ${missing.join(', ')}`)
    if (p.meta.type && !TYPES.includes(p.meta.type)) invalid.push(`${p.file}: type "${p.meta.type}" is not one of ${TYPES.join(', ')}`)
    if (p.meta.confidence && !GRADES.includes(p.meta.confidence)) invalid.push(`${p.file}: confidence "${p.meta.confidence}" is not one of ${GRADES.join(', ')}`)
    for (const link of p.text.matchAll(/\[\[([^\]]+)\]\]/g)) {
      if (!names.has(link[1])) invalid.push(`${p.file}: links to [[${link[1]}]], which has no page`)
    }
    const commit = commitOf(p.meta)
    const local = p.sources.filter(s => !/^[a-z][\w+.-]*:\/\//i.test(s))
    const gone = local.filter(s => !fs.existsSync(path.join(dir, s)))
    if (typeof p.meta.stale_after === 'string' && Date.parse(p.meta.stale_after) <= Date.now()) {
      stale.push({ file: p.file, why: `stale_after ${p.meta.stale_after} has passed` })
    } else if (gone.length) stale.push({ file: p.file, why: `sources gone: ${gone.join(', ')}` })
    else if (typeof commit === 'string' && commit && local.length) {
      // cat-file, not "rev-parse sha^{commit}": cmd.exe on Windows eats the caret.
      if (!/^[0-9a-f]{4,40}$/i.test(commit) || git(`cat-file -t ${commit}`, dir) !== 'commit') {
        stale.push({ file: p.file, why: `verified commit ${commit} is unknown` })
        continue
      }
      const changed = git(`diff --name-only ${commit} -- ${local.map(s => `"${s}"`).join(' ')}`, dir)
      if (changed) stale.push({ file: p.file, why: `changed since ${commit.slice(0, 7)}: ${changed.split('\n').join(', ')}` })
    }
  }
  return { invalid, stale, count: all.length }
}

// OKF conformance: every file but index.md and log.md has frontmatter with a non-empty type.
export function conformance(dir) {
  const files = markdown(dir).filter(rel => !RESERVED.includes(path.basename(rel).toLowerCase()))
  const problems = []
  for (const rel of files) {
    const meta = frontmatter(fs.readFileSync(path.join(dir, 'knowledge', rel), 'utf8'))
    if (!meta) problems.push(`knowledge/${rel}: no frontmatter`)
    else if (typeof meta.type !== 'string' || !meta.type.trim()) problems.push(`knowledge/${rel}: no type`)
  }
  return { files: files.length, problems }
}

// Pages whose sources overlap the given files: what an agent should read before touching them.
export function relevant(dir, files) {
  return pages(dir).filter(p => p.sources.some(s => files.some(f => f === s || f.startsWith(s.replace(/\/?$/, '/')))))
}

// One index entry: "* [Title](file.md) - description (confidence, verified sha, STALE)".
const ENTRY = /^[*-] \[(.*?)\]\(([^)]+)\)(?: - |: )(.*) \(([^()]*)\)$/
function entries(text) {
  const out = new Map()
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(ENTRY)
    if (!m) continue
    const notes = m[4].split(', ').filter(n => n !== 'STALE')
    out.set(m[2], { title: m[1], description: m[3], confidence: notes[0], commit: notes.find(n => n.startsWith('verified '))?.slice(9) })
  }
  return out
}

// Prepend today's entries to log.md, newest first, under one heading per day.
function appendLog(folder, items) {
  const file = path.join(folder, 'log.md')
  const today = new Date().toISOString().slice(0, 10)
  const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n') : ['# Knowledge log', '']
  const at = lines.findIndex(l => l.startsWith('## '))
  if (at < 0) lines.push(`## ${today}`, ...items, '')
  else if (lines[at] === `## ${today}`) lines.splice(at + 1, 0, ...items)
  else lines.splice(at, 0, `## ${today}`, ...items, '')
  fs.writeFileSync(file, lines.join('\n').replace(/\n*$/, '\n'))
}

// Rebuild knowledge/index.md (OKF shape), replacing the older INDEX.md, and log what changed.
export function writeIndex(dir) {
  const { stale } = check(dir)
  const staleFiles = new Set(stale.map(s => s.file))
  const all = pages(dir).filter(p => p.meta)
  const lines = ['---', `okf_version: "${OKF_VERSION}"`, '---', '', '# Knowledge index', '', 'Generated by `sdlc knowledge index`. Read the pages for the area you are about to change before you change it.', '']
  for (const type of TYPES) {
    const of = all.filter(p => p.meta.type === type)
    if (!of.length) continue
    lines.push(`## ${type}`, '')
    for (const p of of) {
      const commit = commitOf(p.meta)
      const notes = [p.meta.confidence, ...(typeof commit === 'string' && commit ? [`verified ${commit.slice(0, 7)}`] : []), ...(staleFiles.has(p.file) ? ['STALE'] : [])]
      lines.push(`* [${titleOf(p)}](${p.file.replace(/^knowledge\//, '')}) - ${p.meta.description} (${notes.join(', ')})`)
    }
    lines.push('')
  }
  const folder = path.join(dir, 'knowledge')
  fs.mkdirSync(folder, { recursive: true })
  const names = fs.readdirSync(folder)
  const previous = names.find(n => n === 'index.md') ?? names.find(n => n === 'INDEX.md')
  const before = previous ? entries(fs.readFileSync(path.join(folder, previous), 'utf8')) : new Map()
  if (names.includes('INDEX.md')) fs.rmSync(path.join(folder, 'INDEX.md'))
  const text = lines.join('\n')
  fs.writeFileSync(path.join(folder, 'index.md'), text)

  const after = entries(text)
  const log = []
  for (const [file, e] of after) {
    const old = before.get(file)
    if (!old) log.push(`* **Creation**: [${e.title}](${file}) - ${e.description}`)
    else if (['title', 'description', 'confidence'].some(k => old[k] !== e[k]) || (old.commit && old.commit !== e.commit)) {
      log.push(`* **Update**: [${e.title}](${file}) - ${e.description} (${e.confidence}${e.commit ? `, verified ${e.commit}` : ''})`)
    }
  }
  for (const [file, e] of before) if (!after.has(file)) log.push(`* **Removal**: ${file} (${e.title})`)
  if (log.length) appendLog(folder, log)
  return { lines: lines.length, logged: log.length }
}
