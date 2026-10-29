// Funzioni di utilità condivise da tutti i componenti
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

export const fmt = (n) => Number(n).toLocaleString("it-IT");
export const eur = (n) =>
  Number(n).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

// "anagrafica_id" -> "Anagrafica"
export const nice = (s) => {
  s = s.replace(/_id$/, "").replace(/_/g, " ");
  return s[0].toUpperCase() + s.slice(1);
};

export const hashHue = (str) =>
  [...String(str)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7);

export const avatar = (name) =>
  `<span class="av" style="--h:${hashHue(name)}">${esc(String(name).trim()[0]?.toUpperCase() || "?")}</span>`;

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
};
