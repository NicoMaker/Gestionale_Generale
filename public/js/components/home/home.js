import { $, esc, fmt, greeting } from "../../core/utils.js";
import { state, hueOf } from "../../core/state.js";
import { iconaModulo } from "../../core/icone.js";
import { barChart, donut, countUp } from "./grafici.js";
import { menuEsporta, voceBackup } from "../export-menu/export-menu.js";

export function renderHome(apriRicerca) {
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
  const nTab = state.mods.reduce((a, m) => a + m.tables, 0);
  $("#view").innerHTML = `
    <section class="hero-banner">
      <div><p class="date">${date}</p><h1>${greeting()}, ecco la situazione</h1>
        <p>${state.mods.length} categorie e ${fmt(nTab)} sezioni a portata di clic.</p></div>
      <button class="hero-search" id="heroSearch">Cerca tra ${fmt(nTab)} sezioni <kbd>Ctrl K</kbd></button>
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
    <h2 class="sec">Categorie</h2>
    <div class="cards">${state.mods
      .map((m) => {
        const s = state.stats.find((x) => x.id === m.id) || {};
        return `<a class="card" href="#/${m.id}" style="--h:${hueOf(m.id)}">
        <span class="ico">${iconaModulo(m.id)}</span>
        <div><h3>${esc(m.label)}</h3><small>${m.tables} sezioni</small></div>
        <div class="mini"><div><b>${fmt(s.anagrafica || 0)}</b><span>Anagrafiche</span></div>
        <div><b>${fmt(s.documenti || 0)}</b><span>Documenti</span></div>
        <div><b>${fmt(s.movimenti || 0)}</b><span>Movimenti</span></div></div></a>`;
      })
      .join("")}</div>
    <h2 class="sec">Dati e sicurezza</h2>
    <div class="panel dati-sic">
      <h3>Scarica i tuoi dati</h3>
      ${menuEsporta({ base: "/api/export/all", formati: ["xlsx"], extra: voceBackup, etichetta: "Esporta tutto", primario: true })}
      <small>Excel con tutte le ${fmt(nTab)} tabelle (un foglio ciascuna) oppure copia completa del database. Ogni tabella e ogni categoria ha il proprio menu Esporta in CSV, Excel e PDF.</small>
    </div>`;
  $("#heroSearch").onclick = apriRicerca;
  countUp($("#view"));
}
