// Pagina di una sezione (tabella): ricerca, griglia, paginazione, nuovo/modifica/elimina
import { $, esc, fmt, nice, avatar } from "../../core/utils.js";
import { state, modById, hueOf } from "../../core/state.js";
import { api } from "../../core/api.js";
import { icona, iconaSezione } from "../../core/icone.js";
import { GRUPPI } from "../../core/config.js";
import { toast } from "../toast/toast.js";
import { apriForm } from "../form-record/form-record.js";

const t = { page: 1, q: "", name: "", meta: null };

function cella(c, r) {
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

async function carica() {
  const d = await api(
    `/api/tables/${t.name}?page=${t.page}&limit=15&q=${encodeURIComponent(t.q)}`,
  );
  const cols = t.meta.columns;
  $("#grid").innerHTML =
    `<thead><tr>${cols.map((c) => `<th>${c.pk ? "ID" : esc(nice(c.name === "created_at" ? "creato_il" : c.name))}</th>`).join("")}<th></th></tr></thead><tbody>` +
    d.rows
      .map(
        (
          r,
        ) => `<tr>${cols.map((c) => cella(c, r).replace("<td", `<td data-label="${esc(c.pk ? "ID" : nice(c.name === "created_at" ? "creato_il" : c.name))}"`)).join("")}<td class="act">
      <button class="btn sm" data-edit="${r.id}">${icona("modifica")}Modifica</button><button class="btn sm danger" data-del="${r.id}">${icona("elimina")}Elimina</button></td></tr>`,
      )
      .join("") +
    "</tbody>";
  $("#vuoto").innerHTML = d.rows.length
    ? ""
    : `<div class="empty"><b>Nessun record</b>${t.q ? "Prova con un’altra ricerca." : "Crea il primo record con “Nuovo record”."}</div>`;
  $("#total").textContent = `${fmt(d.total)} record`;
  $("#pageInfo").textContent = `Pagina ${d.page} di ${d.pages}`;
  $("#prev").disabled = d.page <= 1;
  $("#next").disabled = d.page >= d.pages;
}

export async function renderTabella(mod, suffix) {
  t.name = `${mod}_${suffix}`;
  t.page = 1;
  t.q = "";
  t.meta = await api(`/api/tables/${t.name}/meta`);
  if (state.route.suffix !== suffix) return;
  const m = modById(mod);
  const gruppo = GRUPPI.find((g) => g.sezioni.includes(suffix));
  $("#view").innerHTML = `
    <a class="back" href="#/${mod}">${icona("indietro")}${esc(m.label)}</a>
    <div class="mod-head sez-head" style="--h:${hueOf(mod)}">
      <span class="ico">${iconaSezione(suffix)}</span>
      <div><h1>${esc(t.meta.label)}</h1><p>${esc(m.label)} · ${esc(gruppo.label)}</p></div>
    </div>
    <div class="chips">${gruppo.sezioni.map((s) => `<a class="chip ${s === suffix ? "active" : ""}" href="#/${mod}/${s}">${iconaSezione(s)}${esc(state.labels[`${mod}_${s}`])}</a>`).join("")}</div>
    <div class="panel">
      <div class="toolbar">
        <div class="search">${icona("cerca")}<input id="search" placeholder="Cerca in ${esc(t.meta.label.toLowerCase())}"></div>
        <span class="total" id="total"></span>
        <button class="btn primary" id="addBtn">${icona("piu")}Nuovo record</button>
      </div>
      <div class="grid-wrap"><table id="grid"></table></div>
      <div id="vuoto"></div>
      <div class="pager"><span id="pageInfo"></span><div><button class="btn sm" id="prev">Precedente</button><button class="btn sm" id="next">Successiva</button></div></div>
    </div>`;
  let timer;
  $("#search").oninput = (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      t.q = e.target.value;
      t.page = 1;
      carica();
    }, 250);
  };
  $("#addBtn").onclick = () => apriForm(t.name, t.meta, null, carica);
  $("#prev").onclick = () => {
    t.page--;
    carica();
  };
  $("#next").onclick = () => {
    t.page++;
    carica();
  };
  $("#grid").onclick = async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.edit) apriForm(t.name, t.meta, b.dataset.edit, carica);
    if (b.dataset.del && confirm("Eliminare questo record?")) {
      try {
        await api(`/api/tables/${t.name}/${b.dataset.del}`, "DELETE");
        toast("Record eliminato");
        carica();
      } catch (err) {
        toast(err.message, true);
      }
    }
  };
  carica();
}
