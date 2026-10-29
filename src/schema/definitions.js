// Definizione dello schema: 25 moduli x 20 tabelle = 500 tabelle.
const MODULES = {
  vendite: "Vendite",
  acquisti: "Acquisti",
  magazzino: "Magazzino",
  contabilita: "Contabilità",
  fatturazione: "Fatturazione",
  clienti: "Clienti",
  fornitori: "Fornitori",
  risorse_umane: "Risorse Umane",
  paghe: "Paghe",
  produzione: "Produzione",
  qualita: "Qualità",
  logistica: "Logistica",
  trasporti: "Trasporti",
  progetti: "Progetti",
  commesse: "Commesse",
  assistenza: "Assistenza",
  crm: "CRM",
  marketing: "Marketing",
  ecommerce: "E-commerce",
  tesoreria: "Tesoreria",
  cespiti: "Cespiti",
  budget: "Budget",
  sicurezza: "Sicurezza",
  documentale: "Documentale",
  amministrazione: "Amministrazione",
};

// helper colonne: type = int | text | real | date | bool
const s = (name, o = {}) => ({ name, type: "text", ...o });
const n = (name, o = {}) => ({ name, type: "int", ...o });
const r = (name, o = {}) => ({ name, type: "real", ...o });
const d = (name, o = {}) => ({ name, type: "date", ...o });
const b = (name, o = {}) => ({ name, type: "bool", ...o });
const fk = (name, table, o = {}) => ({
  name,
  type: "int",
  fk: { table, column: "id" },
  ...o,
});

// Template: [suffisso, etichetta, (p) => colonne]  — p(suffisso) = nome tabella completo
const TEMPLATE = [
  [
    "tipi",
    "Tipi",
    () => [
      s("codice", { notnull: true, unique: true }),
      s("descrizione", { notnull: true }),
      b("attivo"),
    ],
  ],
  [
    "categorie",
    "Categorie",
    (p) => [
      s("codice", { notnull: true }),
      s("descrizione"),
      fk("parent_id", p("categorie")),
    ],
  ],
  [
    "stati",
    "Stati",
    () => [
      s("codice", { notnull: true, unique: true }),
      s("descrizione"),
      s("colore"),
    ],
  ],
  [
    "anagrafica",
    "Anagrafica",
    (p) => [
      s("codice", { notnull: true, unique: true }),
      s("nome", { notnull: true }),
      fk("tipo_id", p("tipi")),
      fk("categoria_id", p("categorie")),
      fk("stato_id", p("stati")),
      s("note"),
    ],
  ],
  [
    "contatti",
    "Contatti",
    (p) => [
      fk("anagrafica_id", p("anagrafica"), { notnull: true }),
      s("nome"),
      s("email"),
      s("telefono"),
    ],
  ],
  [
    "indirizzi",
    "Indirizzi",
    (p) => [
      fk("anagrafica_id", p("anagrafica"), { notnull: true }),
      s("via"),
      s("citta"),
      s("cap"),
      s("provincia"),
    ],
  ],
  [
    "documenti",
    "Documenti",
    (p) => [
      s("numero", { notnull: true }),
      d("data"),
      fk("anagrafica_id", p("anagrafica")),
      fk("stato_id", p("stati")),
      r("totale"),
    ],
  ],
  [
    "righe_documento",
    "Righe documento",
    (p) => [
      fk("documento_id", p("documenti"), { notnull: true }),
      s("descrizione"),
      r("quantita"),
      r("prezzo"),
    ],
  ],
  [
    "movimenti",
    "Movimenti",
    (p) => [
      fk("anagrafica_id", p("anagrafica")),
      d("data"),
      r("importo"),
      s("causale"),
    ],
  ],
  [
    "allegati",
    "Allegati",
    (p) => [fk("documento_id", p("documenti")), s("nome_file"), s("percorso")],
  ],
  [
    "note",
    "Note",
    (p) => [fk("anagrafica_id", p("anagrafica")), s("testo"), s("autore")],
  ],
  [
    "scadenze",
    "Scadenze",
    (p) => [
      fk("documento_id", p("documenti")),
      d("data_scadenza"),
      r("importo"),
      b("pagata", { default: 0 }),
    ],
  ],
  [
    "tariffe",
    "Tariffe",
    (p) => [
      fk("tipo_id", p("tipi")),
      r("valore"),
      d("valido_dal"),
      d("valido_al"),
    ],
  ],
  [
    "regole",
    "Regole",
    () => [s("codice", { notnull: true }), s("descrizione"), s("espressione")],
  ],
  [
    "configurazioni",
    "Configurazioni",
    () => [s("chiave", { notnull: true, unique: true }), s("valore")],
  ],
  [
    "log",
    "Log",
    (p) => [fk("anagrafica_id", p("anagrafica")), s("azione"), d("data")],
  ],
  [
    "assegnazioni",
    "Assegnazioni",
    (p) => [fk("anagrafica_id", p("anagrafica")), s("utente"), s("ruolo")],
  ],
  ["tag", "Tag", () => [s("nome", { notnull: true, unique: true })]],
  [
    "anagrafica_tag",
    "Anagrafica ↔ Tag",
    (p) => [
      fk("anagrafica_id", p("anagrafica"), { notnull: true }),
      fk("tag_id", p("tag"), { notnull: true }),
    ],
  ],
  [
    "report",
    "Report",
    () => [s("nome", { notnull: true }), s("query"), d("creato_il")],
  ],
];

const SQL_TYPE = {
  int: "INTEGER",
  text: "TEXT",
  real: "REAL",
  date: "TEXT",
  bool: "INTEGER",
};

function buildTables() {
  const tables = [];
  for (const [mod, modLabel] of Object.entries(MODULES)) {
    const p = (suffix) => `${mod}_${suffix}`;
    for (const [suffix, label, colsFn] of TEMPLATE) {
      const columns = [
        { name: "id", type: "int", pk: true },
        ...colsFn(p),
        { name: "created_at", type: "date", default: "CURRENT_TIMESTAMP" },
      ];
      tables.push({
        name: p(suffix),
        module: mod,
        moduleLabel: modLabel,
        suffix,
        label,
        columns,
      });
    }
  }
  return tables;
}

module.exports = { MODULES, SQL_TYPE, buildTables };
