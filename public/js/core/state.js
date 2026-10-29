// Stato globale condiviso tra i componenti
export const state = {
  mods: [], // [{ id, label, tables, img }]
  stats: [], // conteggi per modulo
  dash: { monthly: [], stati: [] },
  allTables: null, // cache per la ricerca rapida
  summary: null, // riepilogo del modulo aperto
  route: { view: "home" }, // { view: 'home' | 'modulo' | 'tabella', mod, suffix }
  openMods: new Set(), // moduli espansi nella sidebar
};

export const modById = (id) => state.mods.find((m) => m.id === id);
export const hueOf = (id) =>
  (state.mods.findIndex((m) => m.id === id) * 47 + 232) % 360;
