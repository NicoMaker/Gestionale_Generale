import { MODULES, SQL_TYPE, buildTables } from "./definitions.js";

export { MODULES };

export const tables = buildTables();
export const byName = new Map(tables.map((t) => [t.name, t]));

// Chiavi esterne al contrario: per ogni tabella, quali tabelle/colonne la referenziano
export const usedBy = new Map(tables.map((t) => [t.name, []]));
for (const t of tables)
  for (const c of t.columns)
    if (c.fk && usedBy.has(c.fk.table))
      usedBy
        .get(c.fk.table)
        .push({ table: t.name, label: t.label, column: c.name });

export function createSql(t) {
  const cols = t.columns.map((c) => {
    if (c.pk) return `"${c.name}" INTEGER PRIMARY KEY AUTOINCREMENT`;
    let sql = `"${c.name}" ${SQL_TYPE[c.type]}`;
    if (c.notnull) sql += " NOT NULL";
    if (c.unique) sql += " UNIQUE";
    if (c.type === "bool" && c.default === undefined) sql += " DEFAULT 1";
    else if (c.default !== undefined) sql += ` DEFAULT ${c.default}`;
    if (c.fk) sql += ` REFERENCES "${c.fk.table}"("${c.fk.column}")`;
    return sql;
  });
  return `CREATE TABLE IF NOT EXISTS "${t.name}" (\n  ${cols.join(",\n  ")}\n);`;
}

// Genera erDiagram Mermaid per un insieme di tabelle
export function toMermaid(list) {
  const names = new Set(list.map((t) => t.name));
  const mt = {
    int: "int",
    text: "string",
    real: "float",
    date: "date",
    bool: "boolean",
  };
  const out = ["erDiagram"];
  for (const t of list) {
    out.push(`  ${t.name} {`);
    for (const c of t.columns) {
      const tag = c.pk ? " PK" : c.fk ? " FK" : c.unique ? " UK" : "";
      out.push(`    ${mt[c.type]} ${c.name}${tag}`);
    }
    out.push("  }");
  }
  for (const t of list)
    for (const c of t.columns)
      if (c.fk && names.has(c.fk.table))
        out.push(
          `  ${c.fk.table} ${c.notnull ? "||" : "|o"}--o{ ${t.name} : "${c.name}"`,
        );
  return out.join("\n") + "\n";
}

// Colonna "leggibile" di una tabella (usata per mostrare le chiavi esterne)
const LABELS = [
  "nome",
  "descrizione",
  "codice",
  "numero",
  "chiave",
  "testo",
  "azione",
  "nome_file",
];
export const labelCol = (t) =>
  LABELS.find((l) => t.columns.some((c) => c.name === l)) || "id";
