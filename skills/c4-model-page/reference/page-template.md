# C4 model page template

The page below is a complete, working example for the plugin's own sample feature, saved-items (the same example as the `design.md` and `architecture-overview.md` templates). Copy the HTML block whole, then replace only the content:

- the `<title>`, the header (label, H1, lede, source line);
- the body of each `pre.mermaid`, keeping its `data-view` and the five `classDef` lines;
- the rows of the two tables (`data-table="calls"` and `data-table="changes"`) and the Decided and Open cards.

Keep the CSS, the tab markup, the controls bars and the script as they are. They carry the look, the hash routing, the lazy Mermaid render and the pan/zoom frame, and `check.mjs` reads the tab, `data-view` and `data-table` markup.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Saved items · C4 model</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Schibsted+Grotesk:wght@400;600;700&display=swap">
<style>
:root {
  --bg: #f3f6f9; --surface: #fff; --fg: #14202e; --muted: #526274; --rule: #d3dbe4;
  --accent: #0b6b63; --accent-soft: #d8ede9;
  --decided: #0b6b63; --decided-bg: #d8ede9;
  --verified: #1d4f8c; --verified-bg: #dbe8f7;
  --open: #8a5a00; --open-bg: #f8ead0;
  --mono: "IBM Plex Mono", ui-monospace, monospace;
  --sans: "Schibsted Grotesk", system-ui, sans-serif;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0f1720; --surface: #17212c; --fg: #e6edf3; --muted: #9fb0c2; --rule: #2b3846;
    --accent: #4fb3a7; --accent-soft: #16302d;
    --decided: #7fd1c6; --decided-bg: #16302d;
    --verified: #9cc3f0; --verified-bg: #172a40;
    --open: #f0c574; --open-bg: #3a2c12;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #0f1720; --surface: #17212c; --fg: #e6edf3; --muted: #9fb0c2; --rule: #2b3846;
  --accent: #4fb3a7; --accent-soft: #16302d;
  --decided: #7fd1c6; --decided-bg: #16302d;
  --verified: #9cc3f0; --verified-bg: #172a40;
  --open: #f0c574; --open-bg: #3a2c12;
  color-scheme: dark;
}
* { box-sizing: border-box; }
html, body { margin: 0; }
body { background: var(--bg); color: var(--fg); font: 16px/1.55 var(--sans); }
main { max-width: 1280px; margin: 0 auto; padding: 28px 16px 56px; display: grid; gap: 28px; }
main > * { min-width: 0; }
.eyebrow, th, .pill, button, code, .hint, .pct, nav a { font-family: var(--mono); }
.eyebrow { font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); margin: 0; }
h1 { font-size: clamp(1.6rem, 4vw, 2.4rem); line-height: 1.15; margin: 4px 0 12px; }
h2 { font-size: 1.15rem; margin: 0 0 12px; }
p { margin: 0 0 10px; max-width: 72ch; }
.lede { font-size: 1.08rem; }
.muted { color: var(--muted); font-size: .92rem; }
code { font-size: .86em; background: var(--accent-soft); padding: 1px 5px; border-radius: 4px; overflow-wrap: anywhere; }
a { color: var(--accent); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
nav[role="tablist"] { display: flex; flex-wrap: wrap; gap: 6px; border-bottom: 1px solid var(--rule); padding-bottom: 8px; }
nav a { text-decoration: none; color: var(--muted); padding: 6px 12px; border: 1px solid var(--rule); border-radius: 6px; font-size: .85rem; background: var(--surface); }
nav a[aria-selected="true"] { color: #fff; background: var(--accent); border-color: var(--accent); }
section[role="tabpanel"] { display: grid; gap: 16px; }
[hidden] { display: none !important; }
.diagram { background: var(--surface); border: 1px solid var(--rule); border-radius: 6px; padding: 10px; display: grid; gap: 8px; }
.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.controls button { font-size: .8rem; padding: 4px 10px; border: 1px solid var(--rule); border-radius: 4px; background: var(--bg); color: var(--fg); cursor: pointer; }
.pct { font-size: .8rem; min-width: 3.5em; text-align: center; }
.hint { font-size: .72rem; color: var(--muted); flex-basis: 100%; }
.frame { position: relative; height: min(72vh, 780px); min-height: 340px; overflow: hidden; cursor: grab; touch-action: none; border: 1px solid var(--rule); border-radius: 4px; background: var(--bg); }
.frame:active { cursor: grabbing; }
.frame pre.mermaid { position: absolute; top: 0; left: 0; margin: 0; transform-origin: 0 0; background: none; }
.diagram:fullscreen { background: var(--bg); padding: 16px; }
.diagram:fullscreen .frame { height: calc(100vh - 110px); }
.key { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: .82rem; color: var(--muted); margin: 0; }
.key span::before { content: ""; display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; border: 1px solid; }
.key .k-person::before { background: #1f3a5f; border-color: #1f3a5f; }
.key .k-new::before { background: #0b6b63; border-color: #0b6b63; }
.key .k-changing::before { background: #f3dcb8; border-color: #9a6b00; }
.key .k-unchanged::before { background: #dfe6ee; border-color: #8795a8; }
.key .k-outside::before { background: #e6dcf2; border: 1px dashed #6a1b9a; }
.tablewrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--rule); border-radius: 6px; }
.tablewrap table { min-width: 640px; width: 100%; border-collapse: collapse; }
th { font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); text-align: left; }
th, td { padding: 10px 14px; border-bottom: 1px solid var(--rule); vertical-align: top; }
tr:last-child td { border-bottom: 0; }
td:first-child { font-weight: 600; white-space: nowrap; }
.pill { display: inline-block; font-size: .7rem; padding: 1px 8px; border-radius: 4px; white-space: nowrap; }
.pill.decided { color: var(--decided); background: var(--decided-bg); }
.pill.verified { color: var(--verified); background: var(--verified-bg); }
.pill.open { color: var(--open); background: var(--open-bg); }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 16px; }
.card { background: var(--surface); border: 1px solid var(--rule); border-radius: 6px; padding: 14px 16px; }
.card ul { margin: 0; padding-left: 18px; }
.card li { margin-bottom: 8px; }
</style>
</head>
<body>
<main>
<header>
  <p class="eyebrow">Saved items · C4 model</p>
  <h1>Save an item for later</h1>
  <p class="lede">A signed-in shopper saves an item they are not ready to buy. The cart service keeps it on their saved list, up to 200 items, and marks it sold out when stock runs out. The shopper finds it again next week without searching.</p>
  <p class="muted">Sources: <code>specs/saved-items/design.md</code>, <code>specs/saved-items/architecture-overview.md</code>, <code>specs/saved-items/openapi.yaml</code>, <code>docs/architecture/workspace.dsl</code>.</p>
  <p class="muted">Colour shows change, not layer: dark blue is a person, teal is new, amber is changing, grey is unchanged, purple dashed is outside this journey.</p>
</header>

<nav role="tablist" aria-label="C4 views">
  <a role="tab" href="#1" id="t-1" aria-controls="p-1">1 Context</a>
  <a role="tab" href="#2" id="t-2" aria-controls="p-2">2 Containers</a>
  <a role="tab" href="#calls" id="t-calls" aria-controls="p-calls">Calls</a>
  <a role="tab" href="#run" id="t-run" aria-controls="p-run">Run</a>
  <a role="tab" href="#changes" id="t-changes" aria-controls="p-changes">Changes</a>
</nav>

<section role="tabpanel" id="p-1" aria-labelledby="t-1">
  <h2>1 Context: who uses it and which systems it touches</h2>
  <div class="diagram">
    <div class="controls"><button data-act="out" aria-label="Zoom out">-</button><span class="pct">100%</span><button data-act="in" aria-label="Zoom in">+</button><button data-act="fit">Fit</button><button data-act="one">100%</button><button data-act="full">Full screen</button><span class="hint">Drag to pan. Wheel (once the diagram has focus) or pinch to zoom. Double-click to fit. Keys: + and - zoom, arrows pan, 0 fits.</span></div>
    <div class="frame" tabindex="0" aria-label="Context diagram"><pre class="mermaid" data-view="context">
flowchart TB
  shopper(["&lt;b&gt;Shopper&lt;/b&gt;&lt;br/&gt;person&lt;br/&gt;Saves items to buy later"])
  web["&lt;b&gt;web&lt;/b&gt;&lt;br/&gt;TypeScript, repo web&lt;br/&gt;Shop pages, adds the Save button"]
  subgraph records ["Systems of record"]
    cart["&lt;b&gt;cart-service&lt;/b&gt;&lt;br/&gt;Node 20, repo cart-service&lt;br/&gt;Keeps each shopper's saved list"]
  end
  stock["&lt;b&gt;stock-service&lt;/b&gt;&lt;br/&gt;repo stock-service&lt;br/&gt;Says when an item sells out"]
  mobile["&lt;b&gt;mobile&lt;/b&gt;&lt;br/&gt;repo mobile&lt;br/&gt;Shop app, reads the cart API"]
  shopper -->|"saves an item, opens the saved list"| web
  web ==>|"saves and reads saved items"| cart
  stock -.->|"stock.changed events"| cart
  mobile -.->|"reads the cart, unchanged"| cart
  classDef person fill:#1f3a5f,stroke:#1f3a5f,color:#fff
  classDef new fill:#0b6b63,stroke:#0b6b63,color:#fff
  classDef changing fill:#f3dcb8,stroke:#9a6b00,color:#14202e
  classDef unchanged fill:#dfe6ee,stroke:#8795a8,color:#14202e
  classDef outside fill:#e6dcf2,stroke:#6a1b9a,color:#14202e,stroke-dasharray:5 3
  class shopper person
  class web,cart changing
  class stock unchanged
  class mobile outside
</pre></div>
    <p class="key"><span class="k-person">Person</span><span class="k-new">New</span><span class="k-changing">Changing</span><span class="k-unchanged">Unchanged</span><span class="k-outside">Outside this journey</span></p>
  </div>
</section>

<section role="tabpanel" id="p-2" aria-labelledby="t-2" hidden>
  <h2>2 Containers: what runs where inside the changed systems</h2>
  <div class="diagram">
    <div class="controls"><button data-act="out" aria-label="Zoom out">-</button><span class="pct">100%</span><button data-act="in" aria-label="Zoom in">+</button><button data-act="fit">Fit</button><button data-act="one">100%</button><button data-act="full">Full screen</button><span class="hint">Drag to pan. Wheel (once the diagram has focus) or pinch to zoom. Double-click to fit. Keys: + and - zoom, arrows pan, 0 fits.</span></div>
    <div class="frame" tabindex="0" aria-label="Containers diagram"><pre class="mermaid" data-view="containers">
flowchart TB
  shopper(["&lt;b&gt;Shopper&lt;/b&gt;&lt;br/&gt;person"])
  subgraph browser ["Browser"]
    web["&lt;b&gt;web&lt;/b&gt;&lt;br/&gt;TypeScript&lt;br/&gt;Save button and saved list page"]
  end
  subgraph cartsvc ["cart-service"]
    api["&lt;b&gt;cart-api&lt;/b&gt;&lt;br/&gt;Node 20&lt;br/&gt;Serves /saved-items, refuses a 201st item"]
    listener["&lt;b&gt;stock-listener&lt;/b&gt;&lt;br/&gt;Node 20&lt;br/&gt;Marks saved items sold out"]
    db[("&lt;b&gt;cart-db&lt;/b&gt;&lt;br/&gt;Postgres 15&lt;br/&gt;Adds saved_items")]
  end
  stock["&lt;b&gt;stock-service&lt;/b&gt;&lt;br/&gt;queue publisher&lt;br/&gt;Publishes stock.changed"]
  mobile["&lt;b&gt;mobile&lt;/b&gt;&lt;br/&gt;Swift&lt;br/&gt;Reads the cart API"]
  shopper -->|"uses"| web
  web ==>|"POST /saved-items"| api
  web -.->|"GET /saved-items"| api
  api ==>|"writes saved_items"| db
  stock -.->|"stock.changed"| listener
  listener ==>|"marks sold out"| db
  mobile -.->|"GET /cart"| api
  classDef person fill:#1f3a5f,stroke:#1f3a5f,color:#fff
  classDef new fill:#0b6b63,stroke:#0b6b63,color:#fff
  classDef changing fill:#f3dcb8,stroke:#9a6b00,color:#14202e
  classDef unchanged fill:#dfe6ee,stroke:#8795a8,color:#14202e
  classDef outside fill:#e6dcf2,stroke:#6a1b9a,color:#14202e,stroke-dasharray:5 3
  class shopper person
  class listener new
  class web,api,db changing
  class stock unchanged
  class mobile outside
</pre></div>
    <p class="key"><span class="k-person">Person</span><span class="k-new">New</span><span class="k-changing">Changing</span><span class="k-unchanged">Unchanged</span><span class="k-outside">Outside this journey</span></p>
  </div>
  <div class="tablewrap"><table data-table="containers">
    <thead><tr><th>Container</th><th>Responsibility</th><th>Basis</th></tr></thead>
    <tbody>
      <tr><td>web</td><td>Shows the Save button and the saved list page; sends the save.</td><td><span class="pill decided">Decided</span> design.md</td></tr>
      <tr><td>cart-api</td><td>Saves and lists a shopper's items; refuses a 201st with "Your saved list is full (200 items)".</td><td><span class="pill decided">Decided</span> openapi.yaml</td></tr>
      <tr><td>stock-listener</td><td>Marks a saved item sold out when stock.changed says so, once per event.</td><td><span class="pill decided">Decided</span> design.md</td></tr>
      <tr><td>cart-db</td><td>Holds saved_items, keyed by shopper.</td><td><span class="pill verified">Verified</span> db-design.md</td></tr>
    </tbody>
  </table></div>
</section>

<section role="tabpanel" id="p-calls" aria-labelledby="t-calls" hidden>
  <h2>Calls: every call between containers and its contract</h2>
  <div class="tablewrap"><table data-table="calls">
    <thead><tr><th>From → To</th><th>Call</th><th>Contract</th><th>Basis</th></tr></thead>
    <tbody>
      <tr><td>web → cart-api</td><td>Saves an item: <code>POST /saved-items</code></td><td>New: <code>specs/saved-items/openapi.yaml</code></td><td><span class="pill decided">Decided</span></td></tr>
      <tr><td>web → cart-api</td><td>Reads the saved list: <code>GET /saved-items</code></td><td>New: <code>specs/saved-items/openapi.yaml</code></td><td><span class="pill decided">Decided</span></td></tr>
      <tr><td>cart-api → cart-db</td><td>Writes and reads <code>saved_items</code></td><td>New: <code>specs/saved-items/db-design.md</code></td><td><span class="pill verified">Verified</span></td></tr>
      <tr><td>stock-service → stock-listener</td><td>Sends <code>stock.changed</code></td><td>No change: stock events v2</td><td><span class="pill verified">Verified</span></td></tr>
      <tr><td>stock-listener → cart-db</td><td>Marks saved items sold out</td><td>New: <code>specs/saved-items/db-design.md</code></td><td><span class="pill decided">Decided</span></td></tr>
      <tr><td>mobile → cart-api</td><td>Reads the cart: <code>GET /cart</code></td><td>No change: cart API v1.4.0</td><td><span class="pill open">Open</span> app team to confirm mobile ignores the new routes</td></tr>
    </tbody>
  </table></div>
</section>

<section role="tabpanel" id="p-run" aria-labelledby="t-run" hidden>
  <h2>Run: the order things happen in</h2>
  <div class="diagram">
    <div class="controls"><button data-act="out" aria-label="Zoom out">-</button><span class="pct">100%</span><button data-act="in" aria-label="Zoom in">+</button><button data-act="fit">Fit</button><button data-act="one">100%</button><button data-act="full">Full screen</button><span class="hint">Drag to pan. Wheel (once the diagram has focus) or pinch to zoom. Double-click to fit. Keys: + and - zoom, arrows pan, 0 fits.</span></div>
    <div class="frame" tabindex="0" aria-label="Run sequence diagram"><pre class="mermaid" data-view="run">
sequenceDiagram
  autonumber
  actor S as Shopper
  participant W as web
  participant A as cart-api
  participant D as cart-db
  participant K as stock-service
  participant L as stock-listener
  Note over S,D: Save an item
  S->>W: Saves "Blue mug"
  W->>A: POST /saved-items
  A->>D: Count the shopper's saved items
  alt fewer than 200
    A->>D: Insert the item
    A-->>W: 201 Saved
  else already 200
    A-->>W: 409 "Your saved list is full (200 items)"
  end
  W-->>S: Shows the result
  Note over K,D: Later: the item sells out
  K->>L: stock.changed (sold out)
  loop until acknowledged, redelivered at most 5 times
    L->>D: Mark saved items sold out, once per event
    L-->>K: Ack
  end
</pre></div>
  </div>
</section>

<section role="tabpanel" id="p-changes" aria-labelledby="t-changes" hidden>
  <h2>Changes: what each system changes, and what is still open</h2>
  <div class="tablewrap"><table data-table="changes">
    <thead><tr><th>System</th><th>Change</th><th>Contract file</th><th>Task IDs</th></tr></thead>
    <tbody>
      <tr><td>web</td><td>Changed: Save button and saved list page</td><td>calls <code>specs/saved-items/openapi.yaml</code></td><td>T3</td></tr>
      <tr><td>cart-api</td><td>Changed: adds POST and GET /saved-items</td><td><code>specs/saved-items/openapi.yaml</code> v1.5.0</td><td>T1</td></tr>
      <tr><td>stock-listener</td><td>New: marks saved items sold out</td><td>none</td><td>T2</td></tr>
      <tr><td>cart-db</td><td>Changed: adds saved_items</td><td><code>specs/saved-items/db-design.md</code></td><td>T1</td></tr>
      <tr><td>stock-service</td><td>No change</td><td>none</td><td>none</td></tr>
    </tbody>
  </table></div>
  <div class="cards">
    <div class="card">
      <h2>Decided</h2>
      <ul>
        <li><span class="pill decided">Decided</span> Saved lists live in cart-db, not a new service (ADR-0012).</li>
        <li><span class="pill decided">Decided</span> A shopper keeps at most 200 saved items (PRD R4).</li>
        <li><span class="pill verified">Verified</span> stock.changed already carries the item id (facts F2).</li>
      </ul>
    </div>
    <div class="card">
      <h2>Open</h2>
      <ul>
        <li><span class="pill open">Open</span> How long saved items last: 90 days proposed. Priya, product lead, decides.</li>
        <li><span class="pill open">Open</span> Whether mobile shows saved items: the app team decides before its next release.</li>
      </ul>
    </div>
  </div>
</section>
</main>

<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'

const root = document.documentElement
const dark = root.dataset.theme === 'dark' || (root.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default', securityLevel: 'strict', flowchart: { useMaxWidth: false }, sequence: { useMaxWidth: false } })

// Pan and zoom one diagram frame: one translate() scale() transform on the pre.
function frame(box) {
  const pre = box.querySelector('pre.mermaid'), svg = pre.querySelector('svg'), bar = box.parentElement.querySelector('.controls')
  if (!svg) return
  const { width: w, height: h } = svg.viewBox.baseVal
  svg.setAttribute('width', w); svg.setAttribute('height', h); svg.style.maxWidth = 'none'
  let s = 1, x = 0, y = 0
  const pct = bar.querySelector('.pct')
  const draw = () => { pre.style.transform = `translate(${x}px, ${y}px) scale(${s})`; pct.textContent = Math.round(s * 100) + '%' }
  const limit = v => Math.min(6, Math.max(0.2, v))
  const zoom = (f, px = box.clientWidth / 2, py = box.clientHeight / 2) => { const n = limit(s * f); x = px - (px - x) * n / s; y = py - (py - y) * n / s; s = n; draw() }
  const fit = () => { s = limit(Math.min((box.clientWidth - 24) / w, (box.clientHeight - 24) / h)); x = (box.clientWidth - w * s) / 2; y = (box.clientHeight - h * s) / 2; draw() }
  const one = () => { s = 1; x = (box.clientWidth - w) / 2; y = (box.clientHeight - h) / 2; draw() }
  const pan = (dx, dy) => { x += dx; y += dy; draw() }
  // Fit whenever the frame changes size, until the reader moves the diagram themselves.
  let moved = false
  new ResizeObserver(() => moved || fit()).observe(box)
  const pts = new Map(); let span = null
  box.addEventListener('pointerdown', e => { box.setPointerCapture(e.pointerId); pts.set(e.pointerId, e); span = null; moved = true })
  box.addEventListener('pointermove', e => {
    const prev = pts.get(e.pointerId)
    if (!prev) return
    pts.set(e.pointerId, e)
    if (pts.size === 1) return pan(e.clientX - prev.clientX, e.clientY - prev.clientY)
    const [a, b] = [...pts.values()], r = box.getBoundingClientRect()
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    if (span) zoom(d / span, (a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top)
    span = d
  })
  const lift = e => { pts.delete(e.pointerId); span = null }
  box.addEventListener('pointerup', lift); box.addEventListener('pointercancel', lift)
  box.addEventListener('wheel', e => {
    if (document.activeElement !== box) return
    e.preventDefault()
    moved = true
    const r = box.getBoundingClientRect()
    zoom(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top)
  }, { passive: false })
  box.addEventListener('dblclick', fit)
  const keys = { '+': () => zoom(1.25), '=': () => zoom(1.25), '-': () => zoom(0.8), '0': fit,
    ArrowLeft: () => pan(40, 0), ArrowRight: () => pan(-40, 0), ArrowUp: () => pan(0, 40), ArrowDown: () => pan(0, -40) }
  box.addEventListener('keydown', e => { if (keys[e.key]) { e.preventDefault(); moved = true; keys[e.key]() } })
  const acts = { in: () => zoom(1.25), out: () => zoom(0.8), fit, one,
    full: () => document.fullscreenElement ? document.exitFullscreen() : box.parentElement.requestFullscreen() }
  bar.addEventListener('click', e => { moved = true; acts[e.target.closest('button')?.dataset.act]?.() })
  document.addEventListener('fullscreenchange', () => requestAnimationFrame(fit))
  fit()
}

// Hash routing: #1 #2 #calls #run #changes. A diagram is drawn the first time its tab shows,
// because Mermaid cannot measure a hidden block.
const tabs = [...document.querySelectorAll('[role="tab"]')]
async function show() {
  const want = tabs.find(t => t.hash === location.hash) ?? tabs[0]
  for (const t of tabs) {
    const on = t === want
    t.setAttribute('aria-selected', on)
    t.tabIndex = on ? 0 : -1
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on
  }
  const panel = document.getElementById(want.getAttribute('aria-controls'))
  for (const pre of panel.querySelectorAll('pre.mermaid:not([data-processed])')) {
    await mermaid.run({ nodes: [pre] })
    frame(pre.parentElement)
  }
}
document.querySelector('[role="tablist"]').addEventListener('keydown', e => {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
  if (!step) return
  const next = tabs[(tabs.indexOf(document.activeElement) + step + tabs.length) % tabs.length]
  next.focus(); location.hash = next.hash
})
addEventListener('hashchange', show)
show()
</script>
</body>
</html>
```
