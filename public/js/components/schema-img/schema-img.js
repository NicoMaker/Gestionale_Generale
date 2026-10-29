// Schema ER come immagine PNG (generata da `npm run schema:mmd` in img/).
// Esistono due PNG per ogni modulo: chiaro e scuro; il CSS mostra quello del tema attivo.
import { esc } from "../../core/utils.js";
import { icona } from "../../core/icone.js";

const src = (nome, dark) => `/img/${nome}${dark ? "-dark" : ""}.png`;

export function schemaFigure(nome, titolo) {
  return `<figure class="schema-fig" data-schema="${esc(nome)}" data-titolo="${esc(titolo)}">
    <div class="schema-bar">
      <h3>${icona("schema")}Schema ER · ${esc(titolo)}</h3>
      <p class="schema-hint">Tocca l’immagine per ingrandirla</p>
      <div class="schema-actions">
        <button class="btn sm" data-apri>${icona("espandi")}Ingrandisci</button>
        <a class="btn sm solo-chiaro" href="${src(nome)}" download="schema-${esc(nome.replace("/", "-"))}.png">${icona("scarica")}PNG</a>
        <a class="btn sm solo-scuro" href="${src(nome, true)}" download="schema-${esc(nome.replace("/", "-"))}-dark.png">${icona("scarica")}PNG</a>
      </div>
    </div>
    <button class="schema-view" data-apri aria-label="Ingrandisci lo schema">
      <img class="solo-chiaro" src="${src(nome)}" alt="Schema ER di ${esc(titolo)}" loading="lazy">
      <img class="solo-scuro" src="${src(nome, true)}" alt="Schema ER di ${esc(titolo)} (tema scuro)" loading="lazy">
    </button>
  </figure>`;
}

export const schemaMancante = () =>
  `<div class="panel empty"><b>Schema non ancora generato</b>Esegui <code>npm run schema:mmd</code> per creare i PNG nella cartella <code>img/</code>.</div>`;

/* ---------- Visualizzatore a schermo intero ---------- */
let lb;
const chiudi = () => {
  lb?.classList.remove("open");
  document.body.classList.remove("no-scroll");
};
const stretto = () => matchMedia("(max-width: 700px)").matches;
// 100% = dimensione reale (i PNG sono a 2x, quindi metà della larghezza in pixel dell'immagine)
const zoom = (img, v) => {
  img.dataset.z = v;
  if (v === "fit") return void (img.style.width = "");
  if (!img.naturalWidth) return img.addEventListener("load", () => zoom(img, v), { once: true });
  img.style.width = `${(img.naturalWidth / 2) * (v / 100)}px`;
};
function apri(nome, titolo) {
  if (!lb) {
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `<div class="lb-bar"><b></b><span class="lb-tools">
        <button class="icon-btn" data-z="-" aria-label="Riduci">${icona("zoomMeno")}</button>
        <button class="btn sm" data-z="fit">Adatta</button>
        <button class="icon-btn" data-z="+" aria-label="Ingrandisci">${icona("zoomPiu")}</button>
        <button class="icon-btn" data-x aria-label="Chiudi">${icona("chiudi")}</button></span></div>
      <div class="lb-body"><img class="solo-chiaro" alt=""><img class="solo-scuro" alt=""></div>`;
    document.body.append(lb);
    lb.onclick = (e) => {
      if (e.target.closest("[data-x]") || e.target === lb.querySelector(".lb-body")) return chiudi();
      const z = e.target.closest("[data-z]")?.dataset.z;
      lb.querySelectorAll("img").forEach((img) => {
        const cur = !img.dataset.z || img.dataset.z === "fit" ? 100 : +img.dataset.z;
        if (z === "fit") zoom(img, "fit");
        if (z === "+") zoom(img, Math.min(400, cur + 25));
        if (z === "-") zoom(img, Math.max(25, cur - 25));
      });
    };
    document.addEventListener("keydown", (e) => e.key === "Escape" && chiudi());
  }
  lb.querySelector("b").textContent = `Schema ER · ${titolo}`;
  const [c, s] = lb.querySelectorAll("img");
  c.src = src(nome);
  s.src = src(nome, true);
  // su telefono "adatta" renderebbe il testo illeggibile: si parte da 50% e si naviga con pinch/trascinamento
  lb.querySelectorAll("img").forEach((i) => zoom(i, stretto() ? 45 : "fit"));
  lb.querySelector(".lb-body").scrollTo(0, 0);
  lb.classList.add("open");
  document.body.classList.add("no-scroll");
}

export function initSchemaFigure(root) {
  root.querySelectorAll(".schema-fig").forEach((f) =>
    f.addEventListener("click", (e) => {
      if (e.target.closest("[data-apri]")) apri(f.dataset.schema, f.dataset.titolo);
    }),
  );
}
