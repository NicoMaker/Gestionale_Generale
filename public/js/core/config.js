// Raggruppamento delle 20 sezioni di ogni modulo (usato da sidebar e dashboard del modulo)
export const GRUPPI = [
  {
    id: "anagrafiche",
    label: "Anagrafiche",
    desc: "Soggetti, contatti e assegnazioni",
    sezioni: ["anagrafica", "contatti", "indirizzi", "assegnazioni", "note"],
  },
  {
    id: "documenti",
    label: "Documenti",
    desc: "Documenti, righe, allegati e scadenze",
    sezioni: ["documenti", "righe_documento", "allegati", "scadenze"],
  },
  {
    id: "movimenti",
    label: "Movimenti e tariffe",
    desc: "Importi, movimenti e listini",
    sezioni: ["movimenti", "tariffe"],
  },
  {
    id: "classificazioni",
    label: "Classificazioni",
    desc: "Tipi, categorie, stati e tag",
    sezioni: ["tipi", "categorie", "stati", "tag", "anagrafica_tag"],
  },
  {
    id: "sistema",
    label: "Sistema",
    desc: "Regole, configurazioni, log e report",
    sezioni: ["regole", "configurazioni", "log", "report"],
  },
];
