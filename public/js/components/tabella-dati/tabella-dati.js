// Pagina di una sezione (tabella): ricerca, griglia, paginazione, nuovo/modifica/elimina
import { $, $$, esc, fmt, nice, avatar } from "../../core/utils.js";
import { state, modById, hueOf } from "../../core/state.js";
import { api } from "../../core/api.js";
import { icona, iconaSezione } from "../../core/icone.js";
import { GRUPPI } from "../../core/config.js";
import { toast } from "../toast/toast.js";
import { conferma, esito } from "../dialogo/dialogo.js";
import { apriForm } from "../form-record/form-record.js";
import { menuEsporta } from "../export-menu/export-menu.js";

const t = {
  page: 1,
  q: "",
  name: "",
  meta: null,
  sel: new Set(),
  rows: [],
  total: 0,
};

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

// Riallinea caselle e righe della pagina con la selezione
function sincronizza() {
  $$("#grid tbody tr").forEach((tr) => {
    const x = tr.querySelector("[data-sel]");
    if (!x) return;
    x.checked = t.sel.has(Number(x.dataset.sel));
    tr.classList.toggle("selezionata", x.checked);
  });
  aggiornaSelezione();
}
function deseleziona() {
  t.sel.clear();
  sincronizza();
}
// Esc toglie la selezione (se non c'è una finestra aperta)
document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    t.sel.size &&
    $("#selBar") &&
    !document.querySelector("dialog[open]")
  )
    deseleziona();
});

// Stato di checkbox «tutti» e pulsanti di eliminazione in base alla selezione
function aggiornaSelezione() {
  const n = t.sel.size;
  const inPagina = t.rows.filter((r) => t.sel.has(r.id)).length;
  const chk = $("#chkAll");
  if (chk) {
    chk.checked = !!t.rows.length && inPagina === t.rows.length;
    chk.indeterminate = inPagina > 0 && inPagina < t.rows.length;
  }
  $("#selBar").hidden = !n;
  $("#selN").textContent = fmt(n);
  $("#selT").textContent = n === 1 ? "selezionato" : "selezionati";
  $("#delAll").hidden = !t.total;
  $("#delAll").lastChild.textContent = t.q
    ? "Elimina trovati"
    : "Elimina tutti";
}

// Eliminazione multipla: i record collegati ad altre tabelle vengono saltati dal server
async function eliminaMolti(body, n) {
  const cosa = n === 1 ? "1 record" : `${fmt(n)} record`;
  const quali = body.tutti ? (t.q ? "tutti i " : "tutti i ") : "";
  const ok = await conferma({
    titolo:
      body.tutti && !t.q ? "Eliminare tutti i record?" : "Eliminare i record?",
    testo: `${n === 1 ? "1 record verrà rimosso" : `${quali}${fmt(n)} record verranno rimossi`} da “${t.meta.label}”. Quelli collegati ad altre tabelle non vengono eliminati. L’operazione non si può annullare.`,
    azione: n === 1 ? "Elimina" : `Elimina ${fmt(n)}`,
  });
  if (!ok) return;
  try {
    const { eliminati, bloccati } = await api(
      `/api/tables/${t.name}/elimina`,
      "POST",
      body,
    );
    t.sel.clear();
    await carica();
    if (bloccati.length) esito({ eliminati, bloccati, tabella: t.meta.label });
    else if (eliminati)
      toast(
        eliminati === 1
          ? "1 record eliminato"
          : `${fmt(eliminati)} record eliminati`,
      );
    else toast("Nessun record da eliminare", true);
  } catch (err) {
    toast(err.message, true);
  }
}

async function carica() {
  const d = await api(
    `/api/tables/${t.name}?page=${t.page}&limit=15&q=${encodeURIComponent(t.q)}`,
  );
  if (!d.rows.length && t.page > 1) {
    t.page = d.pages; // l'ultima pagina è stata svuotata: si torna all'ultima rimasta
    return carica();
  }
  t.rows = d.rows;
  t.total = d.total;
  const cols = t.meta.columns;
  $("#grid").innerHTML =
    `<thead><tr><th class="sel"><input type="checkbox" id="chkAll" aria-label="Seleziona tutti i record della pagina"></th>${cols.map((c) => `<th>${c.pk ? "ID" : esc(nice(c.name === "created_at" ? "creato_il" : c.name))}</th>`).join("")}<th></th></tr></thead><tbody>` +
    d.rows
      .map(
        (
          r,
        ) => `<tr class="${t.sel.has(r.id) ? "selezionata" : ""}"><td class="sel"><input type="checkbox" data-sel="${r.id}" aria-label="Seleziona record" ${t.sel.has(r.id) ? "checked" : ""}></td>${cols.map((c) => cella(c, r).replace("<td", `<td data-label="${esc(c.pk ? "ID" : nice(c.name === "created_at" ? "creato_il" : c.name))}"`)).join("")}<td class="act">
      <button class="btn sm" data-edit="${r.id}">${icona("modifica")}Modifica</button><button class="btn sm danger" data-del="${r.id}">${icona("elimina")}Elimina</button></td></tr>`,
      )
      .join("") +
    "</tbody>";
  $("#vuoto").innerHTML = d.rows.length
    ? ""
    : `<div class="empty"><b>Nessun record</b>${t.q ? "Prova con un’altra ricerca." : "Crea il primo record con “Nuovo record”."}</div>`;
  $("#total").textContent = `${fmt(d.total)} record`;
  aggiornaSelezione();
  $("#pageInfo").textContent = `Pagina ${d.page} di ${d.pages}`;
  $("#prev").disabled = d.page <= 1;
  $("#next").disabled = d.page >= d.pages;
}

export async function renderTabella(mod, suffix) {
  t.name = `${mod}_${suffix}`;
  t.page = 1;
  t.q = "";
  t.sel = new Set();
  t.rows = [];
  t.total = 0;
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
        <button class="btn danger" id="delAll">${icona("elimina")}Elimina tutti</button>
        ${menuEsporta({ base: `/api/export/tables/${t.name}`, filtro: "#search" })}
        <button class="btn primary" id="addBtn">${icona("piu")}Nuovo record</button>
      </div>
      <div class="grid-wrap"><table id="grid"></table></div>
      <div id="vuoto"></div>
      <div class="pager"><span id="pageInfo"></span><div><button class="btn sm" id="prev">Precedente</button><button class="btn sm" id="next">Successiva</button></div></div>
    </div>
    <div class="selbar" id="selBar" role="region" aria-label="Record selezionati" hidden>
      <span class="selbar-ic">${icona("spunta")}</span>
      <span class="selbar-t"><b id="selN">0</b> <span id="selT">selezionati</span></span>
      <button class="btn" id="selNo">Deseleziona</button>
      <button class="btn danger solid" id="selDel">${icona("elimina")}Elimina</button>
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
  $("#selDel").onclick = () => eliminaMolti({ ids: [...t.sel] }, t.sel.size);
  $("#selNo").onclick = () => deseleziona();
  $("#delAll").onclick = () => eliminaMolti({ tutti: true, q: t.q }, t.total);
  $("#grid").onchange = (e) => {
    const c = e.target;
    if (c.id === "chkAll")
      t.rows.forEach((r) => (c.checked ? t.sel.add(r.id) : t.sel.delete(r.id)));
    else if (c.dataset.sel) {
      const id = Number(c.dataset.sel);
      c.checked ? t.sel.add(id) : t.sel.delete(id);
    } else return;
    sincronizza();
  };
  $("#grid").onclick = async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.edit) apriForm(t.name, t.meta, b.dataset.edit, carica);
    if (
      b.dataset.del &&
      (await conferma({
        titolo: "Eliminare il record?",
        testo: `Il record verrà rimosso da “${t.meta.label}”. L’operazione non si può annullare.`,
      }))
    ) {
      try {
        await api(`/api/tables/${t.name}/${b.dataset.del}`, "DELETE");
        t.sel.delete(Number(b.dataset.del));
        toast("Record eliminato");
        carica();
      } catch (err) {
        toast(err.message, true);
      }
    }
  };
  carica();
}
