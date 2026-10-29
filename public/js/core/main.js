import { $ } from "./utils.js";
import { api } from "./api.js";
import { state } from "./state.js";
import { onRoute } from "./router.js";
import { initTema } from "../components/tema/tema.js";
import { initSidebar, renderSidebar } from "../components/sidebar/sidebar.js";
import { initTopbar, renderCrumbs } from "../components/topbar/topbar.js";
import { renderHome } from "../components/home/home.js";
import { renderModulo } from "../components/modulo/modulo.js";
import { renderTabella } from "../components/tabella-dati/tabella-dati.js";
import { initForm } from "../components/form-record/form-record.js";
import { initPalette, apriPalette } from "../components/palette/palette.js";
import { toast } from "../components/toast/toast.js";

async function mostra(route) {
  state.route = route;
  if (route.view !== "home" && !state.mods.some((m) => m.id === route.mod)) {
    location.hash = "#/";
    return;
  }
  if (route.mod) state.openMods.add(route.mod);
  renderSidebar();
  renderCrumbs();
  window.scrollTo({ top: 0 });
  try {
    if (route.view === "home") renderHome(apriPalette);
    else if (route.view === "modulo") await renderModulo(route.mod);
    else await renderTabella(route.mod, route.suffix);
  } catch (e) {
    toast(e.message, true);
  }
}

(async function init() {
  initTema();
  initSidebar();
  initTopbar(apriPalette);
  initForm();
  initPalette();
  const [mods, stats, dash, tabs] = await Promise.all([
    api("/api/modules"),
    api("/api/stats"),
    api("/api/dashboard"),
    api("/api/tables"),
  ]);
  Object.assign(state, { mods, stats, dash });
  state.labels = Object.fromEntries(tabs.map((t) => [t.name, t.label]));
  onRoute(mostra)();
})();
