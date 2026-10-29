import { $, esc } from "../../core/utils.js";
import { state, modById, hueOf } from "../../core/state.js";
import { api } from "../../core/api.js";
import { go } from "../../core/router.js";
import { iconaModulo, iconaSezione } from "../../core/icone.js";
import { chiudiMenu } from "../sidebar/sidebar.js";

let items = [], sel = 0;
const scrim = () => $("#pScrim"), input = () => $("#pInput"), list = () => $("#pList");
const chiudi = () => scrim().classList.remove("open");

export async function apriPalette() {
  scrim().classList.add("open");
  input().value = "";
  input().focus();
  state.allTables = state.allTables || (await api("/api/tables"));
  render();
}

function render() {
  const words = input().value.toLowerCase().split(/\s+/).filter(Boolean);
  const mods = state.mods.map((m) => ({ type: "m", mod: m.id, title: m.label, sub: "Categoria", hay: m.label.toLowerCase() }));
  const tabs = (state.allTables || []).map((t) => ({
    type: "t", mod: t.module, suffix: t.name.slice(t.module.length + 1), title: t.label,
    sub: modById(t.module)?.label, hay: `${t.label} ${modById(t.module)?.label} ${t.name}`.toLowerCase(),
  }));
  items = [...mods, ...tabs].filter((i) => words.every((w) => i.hay.includes(w))).slice(0, 40);
  sel = 0;
  paint();
}

function paint() {
  list().innerHTML = items.length
    ? items.map((i, n) => `<li class="${n === sel ? "sel" : ""}" data-n="${n}" style="--h:${hueOf(i.mod)}">
        <span class="ico">${i.type === "m" ? iconaModulo(i.mod) : iconaSezione(i.suffix)}</span><b>${esc(i.title)}</b><small>${esc(i.sub)}</small></li>`).join("")
    : '<li class="none">Nessun risultato. Prova con un’altra parola.</li>';
  list().querySelector(".sel")?.scrollIntoView({ block: "nearest" });
}

function scegli(n) {
  const i = items[n];
  if (!i) return;
  chiudi();
  chiudiMenu();
  state.openMods.add(i.mod);
  go(i.mod, i.type === "t" ? i.suffix : undefined);
}

export function initPalette() {
  input().oninput = render;
  list().onclick = (e) => {
    const li = e.target.closest("li[data-n]");
    if (li) scegli(+li.dataset.n);
  };
  scrim().onclick = (e) => e.target === scrim() && chiudi();
  input().onkeydown = (e) => {
    if (e.key === "ArrowDown") { sel = Math.min(items.length - 1, sel + 1); paint(); e.preventDefault(); }
    if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); }
    if (e.key === "Enter") scegli(sel);
    if (e.key === "Escape") chiudi();
  };
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); apriPalette(); }
  });
}
