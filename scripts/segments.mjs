// Split a shell command into the segments a shell runs one after another or through a pipe, so the
// Bash guard judges each on what it targets instead of the whole line's text
// (docs/decisions/2026-10-23-bash-guard-targets.md).
//
// Splits on ; && || | & and newlines, never inside quotes, $( ), backticks or a heredoc body, and
// never on the & of a redirect (2>&1, >&2, &>). Each segment keeps its heredocs: the delimiter,
// whether it was quoted (a quoted one is not expanded) and the body.
// Returns null when unsure (an unclosed quote, $( , backtick or heredoc): the caller then judges the
// whole line, as the guard always did.
export function segments(cmd) {
  const out = []
  let cur = { text: '', heredocs: [] }
  let pending = []
  let quote = null
  let depth = 0
  let tick = false
  const end = () => {
    cur.text = cur.text.trim()
    if (cur.text || cur.heredocs.length) out.push(cur)
    cur = { text: '', heredocs: [] }
  }
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i]
    const next = cmd[i + 1]
    if (quote === "'") {
      cur.text += ch
      if (ch === "'") quote = null
      continue
    }
    if (ch === '\\') {
      cur.text += ch + (next ?? '')
      i++
      continue
    }
    if (quote === '"') {
      cur.text += ch
      if (ch === '"') quote = null
      continue
    }
    if (tick) {
      cur.text += ch
      if (ch === '`') tick = false
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      cur.text += ch
      continue
    }
    if (ch === '`') {
      tick = true
      cur.text += ch
      continue
    }
    if (ch === '$' && next === '(') {
      depth++
      cur.text += '$('
      i++
      continue
    }
    if (depth) {
      if (ch === '(') depth++
      if (ch === ')') depth--
      cur.text += ch
      continue
    }
    // A heredoc: <<DELIM, <<-DELIM, <<'DELIM' or <<"DELIM" (not a <<< here-string).
    if (ch === '<' && next === '<' && cmd[i + 2] !== '<') {
      const m = cmd.slice(i).match(/^<<(-?)\s*(?:'(\w+)'|"(\w+)"|(\w+))/)
      if (!m) return null
      const doc = { delim: m[2] ?? m[3] ?? m[4], quoted: !m[4], strip: m[1] === '-', body: null }
      pending.push(doc)
      cur.heredocs.push(doc)
      cur.text += m[0]
      i += m[0].length - 1
      continue
    }
    if (ch === '\n') {
      // Heredoc bodies start on the next line and run to their delimiter.
      let at = i + 1
      for (const doc of pending) {
        const lines = []
        for (;;) {
          if (at > cmd.length) return null
          const stop = cmd.indexOf('\n', at)
          const line = cmd.slice(at, stop === -1 ? cmd.length : stop).replace(/\r$/, '')
          at = stop === -1 ? cmd.length + 1 : stop + 1
          if ((doc.strip ? line.replace(/^\t+/, '') : line) === doc.delim) break
          lines.push(line)
        }
        doc.body = lines.join('\n')
      }
      pending = []
      i = at - 1
      end()
      continue
    }
    const two = cmd.slice(i, i + 2)
    if (two === '&&' || two === '||') {
      end()
      i++
      continue
    }
    const redirect = ch === '&' && (/[<>]$/.test(cur.text) || next === '>')
    if (ch === ';' || ch === '|' || (ch === '&' && !redirect)) {
      end()
      continue
    }
    cur.text += ch
  }
  if (quote || depth || tick || pending.length) return null
  end()
  return out
}
