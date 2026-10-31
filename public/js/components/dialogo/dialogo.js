// Finestre di dialogo al posto di confirm(): <dialog> nativo (focus, Esc e sfondo gestiti dal browser)
import { esc } from "../../core/utils.js";

const MAX = 8;

function apri(html, { predefinito = ".dlg-az .btn:last-child" } = {}) {
  const dlg = document.createElement("dialog");
  dlg.className = "dlg";
  dlg.innerHTML = html;
  dlg.addEventListener("click", (e) => e.target === dlg && dlg.close());
  dlg.addEventListener("close", () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
  dlg.querySelector(predefinito)?.focus();
  return dlg;
}

// Chiede conferma prima di un'azione irreversibile; risolve true o false
export function conferma({ titolo, testo, azione = "Elimina" }) {
  return new Promise((ok) => {
    let esito = false;
    const dlg = apri(`
      <div class="dlg-corpo"><h2>${esc(titolo)}</h2><p>${esc(testo)}</p></div>
      <div class="dlg-az">
        <button type="button" class="btn" data-no>Annulla</button>
        <button type="button" class="btn danger solid" data-si>${esc(azione)}</button>
      </div>`);
    dlg.querySelector("[data-no]").onclick = () => dlg.close();
    dlg.querySelector("[data-si]").onclick = () => ((esito = true), dlg.close());
    dlg.addEventListener("close", () => ok(esito));
  });
}

// Riepilogo di un'eliminazione multipla in cui alcuni record sono rimasti perché collegati
export function esito({ eliminati, bloccati, tabella }) {
  const rimasti = bloccati.length === 1 ? "1 rimasto" : `${bloccati.length} rimasti`;
  const titolo = eliminati
    ? `${eliminati === 1 ? "1 record eliminato" : `${eliminati} record eliminati`}, ${rimasti}`
    : bloccati.length === 1
      ? "1 record non eliminato"
      : `${bloccati.length} record non eliminati`;
  const dlg = apri(
    `<div class="dlg-corpo">
      <h2>${esc(titolo)}</h2>
      <p>In “${esc(tabella)}” restano i record usati da altre tabelle. Per eliminarli, rimuovi prima i dati che li usano.</p>
      <ul class="dlg-lista">${bloccati
        .slice(0, MAX)
        .map(
          (b) =>
            `<li><b>${esc(b.etichetta || `Record ${b.id}`)}</b><small>Usato in ${esc(b.usato_in)}</small></li>`,
        )
        .join("")}${bloccati.length > MAX ? `<li class="altri">e altri ${bloccati.length - MAX}</li>` : ""}</ul>
    </div>
    <div class="dlg-az"><button type="button" class="btn primary">Ho capito</button></div>`,
    { predefinito: ".btn" },
  );
  dlg.querySelector(".btn").onclick = () => dlg.close();
}
