import { $, esc } from "../../core/utils.js";
import { state, hueOf } from "../../core/state.js";
import { go } from "../../core/router.js";
import { icona, iconaModulo, iconaSezione } from "../../core/icone.js";
import { GRUPPI } from "../../core/config.js";

const sidebar = () => $("#sidebar");
export const chiudiMenu = () => {
  sidebar().classList.remove("open");
  $("#scrim").classList.remove("open");
};
export const apriMenu = () => {
  sidebar().classList.add("open");
  $("#scrim").classList.add("open");
};

// Sezioni di un modulo, divise per gruppo (stessa divisione della dashboard del modulo)
function sottoVoci(m, filtro) {
  const r = state.route;
  const voce = (suffix, label) =>
    `<button class="sub ${r.view === "tabella" && r.mod === m.id && r.suffix === suffix ? "active" : ""}" data-m="${m.id}" data-s="${suffix}">
       ${iconaSezione(suffix)}<span>${esc(label)}</span></button>`;
  return GRUPPI.map((g) => {
    const items = g.sezioni
      .map((s) => [s, state.labels[`${m.id}_${s}`] || s])
      .filter(([, l]) => !filtro || l.toLowerCase().includes(filtro));
    return items.length
      ? `<span class="sub-title">${esc(g.label)}</span>${items.map(([s, l]) => voce(s, l)).join("")}`
      : "";
  }).join("");
}

export function renderSidebar() {
  const f = $("#modFilter").value.trim().toLowerCase();
  const r = state.route;
  $("#modList").innerHTML = state.mods
    .map((m) => {
      const matchMod = !f || m.label.toLowerCase().includes(f);
      const subHtml = sottoVoci(m, matchMod ? "" : f);
      if (!matchMod && !subHtml) return "";
      const aperto = f ? true : state.openMods.has(m.id);
      const attivo = r.mod === m.id;
      return `<div class="grp ${aperto ? "open" : ""} ${attivo ? "current" : ""}" style="--h:${hueOf(m.id)}">
        <div class="grp-head ${attivo && r.view === "modulo" ? "active" : ""}">
          <button class="grp-main" data-open="${m.id}"><span class="ico">${iconaModulo(m.id)}</span><span class="grp-label">${esc(m.label)}</span></button>
          <button class="grp-toggle" data-toggle="${m.id}" aria-label="Mostra sezioni di ${esc(m.label)}" aria-expanded="${aperto}">${icona("giu")}</button>
        </div>
        <div class="grp-body">${aperto ? subHtml : ""}</div>
      </div>`;
    })
    .join("");
  $("#navHome").classList.toggle("active", r.view === "home");
  $("#modList")
    .querySelector(".sub.active, .grp-head.active")
    ?.scrollIntoView({ block: "nearest" });
}

export function initSidebar() {
  $("#navHome").innerHTML =
    `${icona("dashboard", "nav-ico")}<span>Panoramica</span>`;
  $("#modFilter").oninput = renderSidebar;
  $("#menuBtn").innerHTML = icona("menu");
  $("#menuBtn").onclick = apriMenu;
  $("#scrim").onclick = chiudiMenu;
  $("#menuClose").innerHTML = icona("chiudi");
  $("#menuClose").onclick = chiudiMenu;
  // gesti touch: swipe a sinistra chiude il menu, swipe a destra dal bordo lo apre
  let x0 = null,
    y0 = 0;
  document.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      x0 = t.clientX;
      y0 = t.clientY;
    },
    { passive: true },
  );
  document.addEventListener(
    "touchend",
    (e) => {
      if (x0 === null) return;
      const t = e.changedTouches[0],
        dx = t.clientX - x0,
        dy = Math.abs(t.clientY - y0);
      const aperto = $("#sidebar").classList.contains("open");
      if (dy < 50 && innerWidth <= 860) {
        if (aperto && dx < -60) chiudiMenu();
        else if (!aperto && x0 < 24 && dx > 70) apriMenu();
      }
      x0 = null;
    },
    { passive: true },
  );
  $("#navHome").onclick = () => {
    go();
    chiudiMenu();
  };
  $("#modList").onclick = (e) => {
    const t = e.target.closest("[data-toggle]");
    if (t) {
      const id = t.dataset.toggle;
      state.openMods.has(id)
        ? state.openMods.delete(id)
        : state.openMods.add(id);
      return renderSidebar();
    }
    const o = e.target.closest("[data-open]");
    if (o) {
      state.openMods.add(o.dataset.open);
      go(o.dataset.open);
      return chiudiMenu();
    }
    const s = e.target.closest("[data-s]");
    if (s) {
      go(s.dataset.m, s.dataset.s);
      chiudiMenu();
    }
  };
}
