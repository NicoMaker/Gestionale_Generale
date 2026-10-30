// Menu «Esporta» (CSV, Excel, PDF) e download del backup del database.
// Uso: menuEsporta({ base, formati, filtro }) restituisce l'HTML; initEsporta() gestisce i clic (una volta sola).
import { icona } from "../../core/icone.js";
import { esc } from "../../core/utils.js";

const VOCI = {
  xlsx: ["Excel", "Foglio .xlsx", "excel"],
  pdf: ["PDF", "Documento stampabile", "pdf"],
  csv: ["CSV", "Testo separato da «;»", "csv"],
};

// base: percorso senza formato (es. /api/export/tables/vendite_documenti)
// filtro: selettore dell'input di ricerca; il testo cercato viene passato al server (?q=)
export function menuEsporta({
  base,
  formati = ["xlsx", "pdf", "csv"],
  filtro = "",
  extra = "",
  etichetta = "Esporta",
  primario = false,
}) {
  const voci = formati
    .map((f) => {
      const [t, n, i] = VOCI[f];
      return `<button type="button" role="menuitem" class="xm-voce" data-download="${esc(base)}/${f}" ${filtro ? `data-q-from="${esc(filtro)}"` : ""}>${icona(i)}<span><b>${t}</b><small>${n}</small></span></button>`;
    })
    .join("");
  return `<div class="xm">
    <button type="button" class="btn ${primario ? "primary" : ""}" data-xm aria-haspopup="menu" aria-expanded="false">${icona("scarica")}${esc(etichetta)}${icona("giu", "xm-freccia")}</button>
    <div class="xm-lista" role="menu" hidden>${voci}${extra}</div>
  </div>`;
}

// Voce extra: copia di sicurezza del database
export const voceBackup = `<button type="button" role="menuitem" class="xm-voce" data-download="/api/backup" data-plain>${icona("scudo")}<span><b>Copia del database</b><small>File .db di sicurezza</small></span></button>`;

const chiudiTutti = () =>
  document.querySelectorAll(".xm-lista:not([hidden])").forEach((l) => {
    l.hidden = true;
    l.previousElementSibling?.setAttribute("aria-expanded", "false");
  });

export function scarica(url) {
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: "",
  });
  document.body.append(a);
  a.click();
  a.remove();
}

export function initEsporta() {
  document.addEventListener("click", (e) => {
    const apri = e.target.closest("[data-xm]");
    const voce = e.target.closest("[data-download]");
    const lista = apri?.nextElementSibling;
    const eraAperta = lista && !lista.hidden;
    chiudiTutti();
    if (apri && !eraAperta) {
      lista.hidden = false;
      apri.setAttribute("aria-expanded", "true");
    }
    if (voce) {
      let url = voce.dataset.download;
      const q =
        voce.dataset.qFrom &&
        document.querySelector(voce.dataset.qFrom)?.value.trim();
      if (q) url += "?q=" + encodeURIComponent(q);
      scarica(url);
    }
  });
  document.addEventListener(
    "keydown",
    (e) => e.key === "Escape" && chiudiTutti(),
  );
}
