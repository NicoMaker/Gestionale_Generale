const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const fmt = (n) => Number(n).toLocaleString("it-IT");
const nice = (s) => {
  s = s.replace(/_id$/, "").replace(/_/g, " ");
  return s[0].toUpperCase() + s.slice(1);
};

const ICONS = {
  vendite: "🛒",
  acquisti: "📦",
  magazzino: "🏭",
  contabilita: "🧾",
  fatturazione: "💶",
  clienti: "🤝",
  fornitori: "🚚",
  risorse_umane: "👥",
  paghe: "💼",
  produzione: "⚙️",
  qualita: "✅",
  logistica: "🗺️",
  trasporti: "🚛",
  progetti: "📐",
  commesse: "📋",
  assistenza: "🛠️",
  crm: "💬",
  marketing: "📣",
  ecommerce: "🛍️",
  tesoreria: "🏦",
  cespiti: "🏢",
  budget: "📊",
  sicurezza: "🔒",
  documentale: "🗂️",
  amministrazione: "🏛️",
};

async function api(url, method = "GET", body) {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}
function toast(msg, err) {
  const el = document.createElement("div");
  el.className = "toast" + (err ? " err" : "");
  el.textContent = msg;
  $("#toasts").append(el);
  setTimeout(() => el.remove(), 2800);
}

const state = {
  mods: [],
  stats: [],
  module: null,
  tables: [],
  table: null,
  meta: null,
  page: 1,
  q: "",
  tab: "data",
  editId: null,
};
const modById = (id) => state.mods.find((m) => m.id === id);
const hueOf = (id) =>
  (state.mods.findIndex((m) => m.id === id) * 47 + 232) % 360;

/* ---------- Tema ---------- */
const saved = localStorage.getItem("theme");
document.documentElement.dataset.theme =
  saved ||
  (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
const initMermaid = () =>
  mermaid.initialize({
    startOnLoad: false,
    theme:
      document.documentElement.dataset.theme === "dark" ? "dark" : "default",
    maxTextSize: 200000,
  });
initMermaid();
$("#themeBtn").onclick = () => {
  const t =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = t;
  localStorage.setItem("theme", t);
  initMermaid();
  if (state.tab === "schema") showSchema();
};

/* ---------- Sidebar ---------- */
const sidebar = $("#sidebar"),
  scrim = $("#scrim");
const closeMenu = () => {
  sidebar.classList.remove("open");
  scrim.classList.remove("open");
};
$("#menuBtn").onclick = () => {
  sidebar.classList.add("open");
  scrim.classList.add("open");
};
scrim.onclick = closeMenu;

function renderMods() {
  const f = $("#modFilter").value.toLowerCase();
  $("#modList").innerHTML = state.mods
    .filter((m) => m.label.toLowerCase().includes(f))
    .map(
      (m) =>
        `<button class="mod ${m.id === state.module ? "active" : ""}" data-m="${m.id}" style="--h:${hueOf(m.id)}">
       <span class="ico">${ICONS[m.id] || "📁"}</span>${esc(m.label)}</button>`,
    )
    .join("");
  $("#navHome").classList.toggle("active", !state.module);
}
$("#modFilter").oninput = renderMods;
$("#modList").onclick = (e) => {
  const b = e.target.closest("[data-m]");
  if (b) {
    openModule(b.dataset.m);
    closeMenu();
  }
};
$("#navHome").onclick = () => {
  showHome();
  closeMenu();
};

/* ---------- Panoramica ---------- */
const eur = (n) =>
  Number(n).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
};
const hashHue = (str) =>
  [...String(str)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7);
const avatar = (name) =>
  `<span class="av" style="--h:${hashHue(name)}">${esc(String(name).trim()[0]?.toUpperCase() || "?")}</span>`;

function barChart(monthly) {
  const months = [...new Set(monthly.map((x) => x.mese))].sort();
  if (!months.length)
    return '<div class="empty">Nessun movimento da mostrare</div>';
  const val = (m, c) =>
    monthly.find((x) => x.mese === m && x.causale === c)?.tot || 0;
  const max = Math.max(...monthly.map((x) => x.tot)) * 1.12;
  const W = 600,
    H = 230,
    L = 46,
    B = 26,
    T = 10,
    gw = (W - L - 8) / months.length,
    bw = Math.min(22, gw / 3);
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map(
      (f) =>
        `<line x1="${L}" x2="${W}" y1="${y(max * f)}" y2="${y(max * f)}" class="gl"/><text x="${L - 8}" y="${y(max * f) + 4}" text-anchor="end" class="gt">${Math.round((max * f) / 1000)}k</text>`,
    )
    .join("");
  const bars = months
    .map((m, i) => {
      const cx = L + gw * i + gw / 2,
        label = new Date(m + "-01").toLocaleDateString("it-IT", {
          month: "short",
        });
      const a = val(m, "Incasso"),
        p = val(m, "Pagamento");
      return `<rect class="c-inc bar" x="${cx - bw - 2}" y="${y(a)}" width="${bw}" height="${H - B - y(a)}" rx="6" style="--d:${i * 60}ms"><title>${label}: incassi ${eur(a)}</title></rect>
      <rect class="c-pag bar" x="${cx + 2}" y="${y(p)}" width="${bw}" height="${H - B - y(p)}" rx="6" style="--d:${i * 60 + 30}ms"><title>${label}: pagamenti ${eur(p)}</title></rect>
      <text x="${cx}" y="${H - 7}" text-anchor="middle" class="gt">${label}</text>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="svgc" role="img" aria-label="Incassi e pagamenti per mese">${grid}${bars}</svg>
    <div class="legend"><span><i class="dot c-inc"></i>Incassi</span><span><i class="dot c-pag"></i>Pagamenti</span></div>`;
}

function donut(stati) {
  const tot = stati.reduce((a, s) => a + s.n, 0) || 1,
    r = 54,
    C = 2 * Math.PI * r;
  const col = {
    APERTO: "var(--ok)",
    CHIUSO: "var(--muted)",
    ANNULLATO: "var(--bad)",
  };
  let off = 0;
  const arcs = stati
    .map((s) => {
      const len = (s.n / tot) * C,
        el = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${col[s.stato] || "var(--accent)"}" stroke-width="16" stroke-dasharray="${Math.max(0, len - 3)} ${C}" stroke-dashoffset="${-off}" stroke-linecap="round"/>`;
      off += len;
      return el;
    })
    .join("");
  return `<div class="donut"><svg viewBox="0 0 140 140" role="img" aria-label="Documenti per stato"><g transform="rotate(-90 70 70)">${arcs}</g>
    <text x="70" y="68" text-anchor="middle" class="dn">${fmt(tot)}</text><text x="70" y="86" text-anchor="middle" class="gt">documenti</text></svg>
    <ul class="legend col">${stati.map((s) => `<li><i class="dot" style="background:${col[s.stato] || "var(--accent)"}"></i>${esc(s.stato[0] + s.stato.slice(1).toLowerCase())}<b>${fmt(s.n)}</b></li>`).join("")}</ul></div>`;
}

function countUp() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const to = +el.dataset.count,
      cur = el.dataset.cur,
      f = (v) => (cur ? eur(v) : fmt(Math.round(v)));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches)
      return (el.textContent = f(to));
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 800);
      el.textContent = f(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function showHome() {
  state.module = null;
  state.table = null;
  renderMods();
  $("#crumbs").innerHTML = "<b>Panoramica</b>";
  const sum = (k) => state.stats.reduce((a, s) => a + s[k], 0);
  const tot = (c) =>
    state.dash.monthly
      .filter((x) => x.causale === c)
      .reduce((a, x) => a + x.tot, 0);
  const date = new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  $("#view").innerHTML = `
    <section class="hero-banner">
      <div><p class="date">${date}</p><h1>${greeting()}, ecco la situazione</h1>
        <p>${state.mods.length} moduli e ${fmt(state.mods.reduce((a, m) => a + m.tables, 0))} tabelle a portata di clic.</p></div>
      <button class="hero-search" id="heroSearch">Cerca tra 500 tabelle <kbd>Ctrl K</kbd></button>
    </section>
    <div class="kpis">
      <div class="kpi"><span>Anagrafiche</span><strong data-count="${sum("anagrafica")}">0</strong></div>
      <div class="kpi"><span>Documenti</span><strong data-count="${sum("documenti")}">0</strong></div>
      <div class="kpi"><span>Movimenti</span><strong data-count="${sum("movimenti")}">0</strong></div>
      <div class="kpi accent"><span>Saldo incassi − pagamenti</span><strong data-count="${tot("Incasso") - tot("Pagamento")}" data-cur="1">0</strong></div>
    </div>
    <div class="charts">
      <div class="panel chart"><h3>Incassi e pagamenti per mese</h3>${barChart(state.dash.monthly)}</div>
      <div class="panel chart"><h3>Documenti per stato</h3>${donut(state.dash.stati)}</div>
    </div>
    <h2 class="sec">Tutti i moduli</h2>
    <div class="cards">${state.mods
      .map((m) => {
        const s = state.stats.find((x) => x.id === m.id) || {};
        return `<button class="card" data-m="${m.id}" style="--h:${hueOf(m.id)}">
        <span class="ico">${ICONS[m.id] || "📁"}</span>
        <div><h3>${esc(m.label)}</h3><small>${m.tables} tabelle</small></div>
        <div class="mini"><div><b>${fmt(s.anagrafica || 0)}</b><span>Anagrafiche</span></div>
        <div><b>${fmt(s.documenti || 0)}</b><span>Documenti</span></div>
        <div><b>${fmt(s.movimenti || 0)}</b><span>Movimenti</span></div></div></button>`;
      })
      .join("")}</div>`;
  $("#heroSearch").onclick = openPalette;
  countUp();
}
$("#view").addEventListener("click", (e) => {
  const c = e.target.closest(".card[data-m]");
  if (c) openModule(c.dataset.m);
});

/* ---------- Modulo ---------- */
async function openModule(id, table) {
  state.module = id;
  state.tables = await api(`/api/tables?module=${id}`);
  renderMods();
  const m = modById(id);
  $("#crumbs").innerHTML = `Moduli / <b>${esc(m.label)}</b>`;
  $("#view").innerHTML = `
    <div class="mod-head" style="--h:${hueOf(id)}">
      <span class="ico">${ICONS[id] || "📁"}</span>
      <div><h1>${esc(m.label)}</h1><p>${state.tables.length} tabelle collegate</p></div>
      <div class="seg" id="seg"><button data-tab="data" class="active">Dati</button><button data-tab="schema">Schema ER</button></div>
    </div>
    <div class="tabs" id="tabs">${state.tables.map((t) => `<button class="tab" data-t="${t.name}">${esc(t.label)}</button>`).join("")}</div>
    <div id="body"></div>`;
  $("#seg").onclick = (e) =>
    e.target.dataset.tab && setTab(e.target.dataset.tab);
  $("#tabs").onclick = (e) =>
    e.target.dataset.t && selectTable(e.target.dataset.t);
  state.tab = "data";
  selectTable(table || `${id}_anagrafica`);
}

async function selectTable(name) {
  state.table = name;
  state.page = 1;
  state.q = "";
  state.meta = await api(`/api/tables/${name}/meta`);
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.t === name));
  document
    .querySelector(".tab.active")
    ?.scrollIntoView({ inline: "center", block: "nearest" });
  setTab("data");
}

function setTab(tab) {
  state.tab = tab;
  document
    .querySelectorAll("#seg button")
    .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  tab === "data" ? renderData() : showSchema();
}

async function renderData() {
  $("#body").innerHTML = `<div class="panel">
    <div class="toolbar">
      <div class="search"><input id="search" placeholder="Cerca in ${esc(state.meta.label.toLowerCase())}" value="${esc(state.q)}"></div>
      <span class="total" id="total"></span>
      <button class="btn primary" id="addBtn">Nuovo record</button>
    </div>
    <div class="grid-wrap"><table id="grid"></table></div>
    <div class="pager"><span id="pageInfo"></span><div><button class="btn sm" id="prev">Precedente</button><button class="btn sm" id="next">Successiva</button></div></div>
  </div>`;
  let t;
  $("#search").oninput = (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.q = e.target.value;
      state.page = 1;
      loadData();
    }, 250);
  };
  $("#addBtn").onclick = () => openForm(null);
  $("#prev").onclick = () => {
    state.page--;
    loadData();
  };
  $("#next").onclick = () => {
    state.page++;
    loadData();
  };
  $("#grid").onclick = async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.edit) openForm(b.dataset.edit);
    if (b.dataset.del && confirm("Eliminare questo record?")) {
      try {
        await api(`/api/tables/${state.table}/${b.dataset.del}`, "DELETE");
        toast("Record eliminato");
        loadData();
      } catch (err) {
        toast(err.message, true);
      }
    }
  };
  loadData();
}

function cell(c, r) {
  const v = r[c.name];
  if (c.pk) return `<td class="id">#${v}</td>`;
  if (v === null || v === undefined || v === "")
    return '<td class="muted">–</td>';
  if (c.name === "nome")
    return `<td><span class="who">${avatar(v)}<b>${esc(v)}</b></span></td>`;
  if (c.name === "codice") return `<td><b>${esc(v)}</b></td>`;
  if (c.fk)
    return `<td><span class="fk">${esc(r[c.name + "__label"] ?? "#" + v)}</span></td>`;
  if (c.type === "bool")
    return `<td><span class="badge ${v ? "ok" : ""}">${v ? "Sì" : "No"}</span></td>`;
  if (c.type === "real")
    return `<td class="num">${Number(v).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>`;
  if (c.name === "created_at")
    return `<td class="muted">${esc(String(v).slice(0, 10).split("-").reverse().join("/"))}</td>`;
  if (c.name === "colore")
    return `<td><span class="fk" style="background:${esc(v)}22;color:${esc(v)}">${esc(v)}</span></td>`;
  if (/^(aperto|chiuso|annullato)$/i.test(v))
    return `<td><span class="badge ${/aperto/i.test(v) ? "ok" : /annullato/i.test(v) ? "bad" : ""}">${esc(v)}</span></td>`;
  return `<td>${esc(v)}</td>`;
}

async function loadData() {
  const d = await api(
    `/api/tables/${state.table}?page=${state.page}&limit=15&q=${encodeURIComponent(state.q)}`,
  );
  const cols = state.meta.columns;
  $("#grid").innerHTML =
    `<thead><tr>${cols.map((c) => `<th>${c.pk ? "ID" : esc(nice(c.name === "created_at" ? "creato_il" : c.name))}</th>`).join("")}<th></th></tr></thead><tbody>` +
    d.rows
      .map(
        (r) => `<tr>${cols.map((c) => cell(c, r)).join("")}<td class="act">
      <button class="btn sm" data-edit="${r.id}">Modifica</button><button class="btn sm danger" data-del="${r.id}">Elimina</button></td></tr>`,
      )
      .join("") +
    "</tbody>";
  if (!d.rows.length)
    $("#grid").insertAdjacentHTML(
      "afterend",
      `<div class="empty"><b>Nessun record</b>${state.q ? "Prova con un’altra ricerca." : "Crea il primo record con “Nuovo record”."}</div>`,
    );
  $("#total").textContent = `${fmt(d.total)} record`;
  $("#pageInfo").textContent = `Pagina ${d.page} di ${d.pages}`;
  $("#prev").disabled = d.page <= 1;
  $("#next").disabled = d.page >= d.pages;
}

async function showSchema() {
  $("#body").innerHTML =
    '<div class="panel"><div class="mermaid-out" id="mm">Disegno lo schema…</div></div>';
  const txt = await (
    await fetch(`/api/schema/mmd?module=${state.module}`)
  ).text();
  try {
    const { svg } = await mermaid.render("er" + Date.now(), txt);
    $("#mm").innerHTML = svg;
  } catch (e) {
    $("#mm").textContent = "Impossibile disegnare lo schema: " + e.message;
  }
}

/* ---------- Drawer form ---------- */
const drawer = $("#drawer"),
  dScrim = $("#drawerScrim");
const closeDrawer = () => {
  drawer.classList.remove("open");
  dScrim.classList.remove("open");
};
$("#drawerClose").onclick = $("#drawerCancel").onclick = closeDrawer;
dScrim.onclick = closeDrawer;
document.addEventListener(
  "keydown",
  (e) => e.key === "Escape" && closeDrawer(),
);

async function openForm(id) {
  state.editId = id;
  const row = id ? await api(`/api/tables/${state.table}/${id}`) : {};
  $("#drawerTitle").textContent = id
    ? `Modifica ${state.meta.label.toLowerCase()} #${id}`
    : `Nuovo record · ${state.meta.label}`;
  const cols = state.meta.columns.filter(
    (c) => !c.pk && c.name !== "created_at",
  );
  const opts = {};
  await Promise.all(
    cols
      .filter((c) => c.fk)
      .map(async (c) => {
        opts[c.name] = await api(`/api/tables/${c.fk.table}/options`).catch(
          () => [],
        );
      }),
  );
  $("#fields").innerHTML = cols
    .map((c) => {
      const req = c.notnull ? " required" : "";
      const label = `<label for="f_${c.name}">${esc(nice(c.name))}${c.notnull ? " <i>*</i>" : ""}</label>`;
      let input;
      if (c.fk)
        input = `<select id="f_${c.name}" name="${c.name}"${req}><option value="">–</option>${opts[c.name].map((o) => `<option value="${o.id}" ${String(row[c.name]) === String(o.id) ? "selected" : ""}>${esc(o.label)} (#${o.id})</option>`).join("")}</select>`;
      else if (c.type === "bool")
        return `<div class="field"><label class="check"><input type="checkbox" name="${c.name}" ${(id ? row[c.name] : 1) ? "checked" : ""}> ${esc(nice(c.name))}</label></div>`;
      else
        input = `<input id="f_${c.name}" name="${c.name}" type="${c.type === "date" ? "date" : c.type === "real" ? "number" : c.type === "int" ? "number" : "text"}"${c.type === "real" ? ' step="any"' : ""} value="${esc(row[c.name])}"${req}>`;
      return `<div class="field">${label}${input}</div>`;
    })
    .join("");
  drawer.classList.add("open");
  dScrim.classList.add("open");
  drawer.querySelector("input,select")?.focus();
}

$("#form").onsubmit = async (e) => {
  e.preventDefault();
  const body = {};
  for (const el of e.target.elements)
    if (el.name)
      body[el.name] = el.type === "checkbox" ? (el.checked ? 1 : 0) : el.value;
  try {
    state.editId
      ? await api(`/api/tables/${state.table}/${state.editId}`, "PUT", body)
      : await api(`/api/tables/${state.table}`, "POST", body);
    toast("Record salvato");
    closeDrawer();
    loadData();
  } catch (err) {
    toast(err.message, true);
  }
};

/* ---------- Ricerca rapida (Ctrl+K) ---------- */
const pScrim = $("#pScrim"),
  pInput = $("#pInput"),
  pList = $("#pList");
let pItems = [],
  pSel = 0,
  allTables = null;
async function openPalette() {
  pScrim.classList.add("open");
  pInput.value = "";
  pInput.focus();
  allTables = allTables || (await api("/api/tables"));
  renderPalette();
}
const closePalette = () => pScrim.classList.remove("open");
function renderPalette() {
  const words = pInput.value.toLowerCase().split(/\s+/).filter(Boolean);
  const mods = state.mods.map((m) => ({
    type: "m",
    mod: m.id,
    title: m.label,
    sub: "Modulo",
    hay: m.label.toLowerCase(),
  }));
  const tabs = (allTables || []).map((t) => ({
    type: "t",
    mod: t.module,
    table: t.name,
    title: t.label,
    sub: modById(t.module)?.label,
    hay: `${t.label} ${modById(t.module)?.label} ${t.name}`.toLowerCase(),
  }));
  pItems = [...mods, ...tabs]
    .filter((i) => words.every((w) => i.hay.includes(w)))
    .slice(0, 40);
  pSel = 0;
  paintPalette();
}
function paintPalette() {
  pList.innerHTML = pItems.length
    ? pItems
        .map(
          (
            i,
            n,
          ) => `<li class="${n === pSel ? "sel" : ""}" data-n="${n}" style="--h:${hueOf(i.mod)}">
    <span class="ico">${i.type === "m" ? ICONS[i.mod] || "📁" : "▦"}</span><b>${esc(i.title)}</b><small>${esc(i.sub)}</small></li>`,
        )
        .join("")
    : '<li class="none">Nessun risultato. Prova con un’altra parola.</li>';
  pList.querySelector(".sel")?.scrollIntoView({ block: "nearest" });
}
function pick(n) {
  const i = pItems[n];
  if (!i) return;
  closePalette();
  closeMenu();
  openModule(i.mod, i.table);
}
pInput.oninput = renderPalette;
pList.onclick = (e) => {
  const li = e.target.closest("li[data-n]");
  if (li) pick(+li.dataset.n);
};
pScrim.onclick = (e) => e.target === pScrim && closePalette();
pInput.onkeydown = (e) => {
  if (e.key === "ArrowDown") {
    pSel = Math.min(pItems.length - 1, pSel + 1);
    paintPalette();
    e.preventDefault();
  }
  if (e.key === "ArrowUp") {
    pSel = Math.max(0, pSel - 1);
    paintPalette();
    e.preventDefault();
  }
  if (e.key === "Enter") pick(pSel);
  if (e.key === "Escape") closePalette();
};
$("#palBtn").onclick = openPalette;
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openPalette();
  }
});

/* ---------- Avvio ---------- */
(async function init() {
  [state.mods, state.stats, state.dash] = await Promise.all([
    api("/api/modules"),
    api("/api/stats"),
    api("/api/dashboard"),
  ]);
  showHome();
})();
