import { $, esc } from "../../core/utils.js";
import { state, modById } from "../../core/state.js";
import { icona } from "../../core/icone.js";

export function renderCrumbs() {
  const r = state.route;
  const sep = `<span class="sep">${icona("freccia")}</span>`;
  let html = `<b>Panoramica</b>`;
  if (r.view !== "home") {
    const m = modById(r.mod);
    html = `<a href="#/">Panoramica</a>${sep}`;
    html +=
      r.view === "modulo"
        ? `<b>${esc(m?.label || r.mod)}</b>`
        : `<a href="#/${r.mod}">${esc(m?.label || r.mod)}</a>${sep}<b>${esc(state.labels[`${r.mod}_${r.suffix}`] || r.suffix)}</b>`;
  }
  $("#crumbs").innerHTML = html;
}

export function initTopbar(apriRicerca) {
  $("#palBtn").innerHTML = `${icona("cerca")}<span class="lbl">Cerca ovunque</span><kbd>Ctrl K</kbd>`;
  $("#palBtn").onclick = apriRicerca;
}
