// Tema chiaro/scuro. L'icona mostrata corrisponde SEMPRE al tema attivo:
// sole = tema chiaro, luna = tema scuro (le due icone si alternano via CSS su [data-theme]).
import { $ } from "../../core/utils.js";
import { icona } from "../../core/icone.js";

const root = document.documentElement;

export const temaCorrente = () => root.dataset.theme;

function applica(t, salva = true) {
  root.dataset.theme = t;
  if (salva) localStorage.setItem("theme", t);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", t === "dark" ? "#0e1020" : "#f3f4f9");
  const b = $("#themeBtn");
  if (b) {
    const prossimo = t === "dark" ? "chiaro" : "scuro";
    const testo = `Tema ${t === "dark" ? "scuro" : "chiaro"} attivo: passa al tema ${prossimo}`;
    b.title = testo;
    b.setAttribute("aria-label", testo);
  }
  window.dispatchEvent(new CustomEvent("tema", { detail: t }));
}

export function initTema() {
  $("#themeBtn").innerHTML =
    icona("sole", "ico-sole") + icona("luna", "ico-luna");
  applica(temaCorrente() || "light", false);
  $("#themeBtn").onclick = () =>
    applica(temaCorrente() === "dark" ? "light" : "dark");
  // segue il sistema finché l'utente non ha scelto a mano
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) applica(e.matches ? "dark" : "light", false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "t" && !e.ctrlKey && !e.metaKey && !/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))
      $("#themeBtn").click();
  });
}
