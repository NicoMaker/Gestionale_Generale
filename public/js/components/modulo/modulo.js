// Dashboard di una categoria (modulo): tutte le opzioni disponibili, divise per sezione
import { $, esc, fmt } from "../../core/utils.js";
import { state, hueOf } from "../../core/state.js";
import { api } from "../../core/api.js";
import { GRUPPI } from "../../core/config.js";
import { iconaModulo, iconaSezione, icona } from "../../core/icone.js";
import { schemaFigure, schemaMancante, initSchemaFigure } from "../schema-img/schema-img.js";
import { countUp } from "../home/grafici.js";

export async function renderModulo(id) {
  const m = state.mods.find((x) => x.id === id);
  const s = await api(`/api/modules/${id}/summary`);
  if (state.route.mod !== id || state.route.view !== "modulo") return; // pagina già cambiata
  state.summary = s;
  const by = Object.fromEntries(s.tables.map((t) => [t.suffix, t]));
  const kpi = (suffix, label) => `<div class="kpi"><span>${label}</span><strong data-count="${by[suffix]?.records || 0}">0</strong></div>`;
  $("#view").innerHTML = `
    <div class="mod-head" style="--h:${hueOf(id)}">
      <span class="ico">${iconaModulo(id)}</span>
      <div><h1>${esc(m.label)}</h1><p>${s.tables.length} sezioni · ${fmt(s.records)} record totali</p></div>
    </div>
    <div class="kpis">${kpi("anagrafica", "Anagrafiche")}${kpi("documenti", "Documenti")}${kpi("movimenti", "Movimenti")}${kpi("scadenze", "Scadenze")}</div>
    ${GRUPPI.map((g) => `<section class="opz-gruppo" style="--h:${hueOf(id)}">
      <div class="opz-titolo"><h2>${esc(g.label)}</h2><span>${esc(g.desc)}</span></div>
      <div class="opz-grid">${g.sezioni.filter((x) => by[x]).map((x) => {
        const t = by[x];
        return `<a class="opz" href="#/${id}/${x}">
          <span class="ico">${iconaSezione(x)}</span>
          <div class="opz-testo"><b>${esc(t.label)}</b><small>${t.columns} campi${t.links ? ` · ${t.links} collegamenti` : ""}</small></div>
          <span class="opz-n">${fmt(t.records)}</span><span class="opz-go">${icona("freccia")}</span></a>`;
      }).join("")}</div></section>`).join("")}
    <section class="opz-gruppo">
      <div class="opz-titolo"><h2>Schema</h2><span>Relazioni tra le tabelle della categoria</span></div>
      ${s.img ? schemaFigure(`modules/${id}`, m.label) : schemaMancante()}
    </section>`;
  initSchemaFigure($("#view"));
  countUp($("#view"));
}
