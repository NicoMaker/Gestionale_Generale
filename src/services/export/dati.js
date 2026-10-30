// Prepara i dati da esportare: colonne leggibili e righe con le chiavi esterne già risolte
import { tables, byName, MODULES } from "../../schema/index.js";
import { listAll } from "../crud.service.js";

const IMPORTI = /^(importo|totale|prezzo|valore)$/;
const nice = (s) => {
  s = s.replace(/_id$/, "").replace(/_/g, " ");
  return s[0].toUpperCase() + s.slice(1);
};

// Colonne esportate: ID, campi della tabella (chiavi esterne = testo collegato) e data di creazione
const colonne = (t) =>
  t.columns.map((c) => ({
    k: c.fk ? c.name + "__label" : c.name,
    l: c.pk ? "ID" : c.name === "created_at" ? "Creato il" : nice(c.name),
    tipo: c.pk
      ? "id"
      : c.type === "date" || c.name === "created_at"
        ? "data"
        : c.type === "bool"
          ? "bool"
          : c.type === "real"
            ? IMPORTI.test(c.name)
              ? "euro"
              : "decimale"
            : c.type === "int" && !c.fk
              ? "numero"
              : "testo",
  }));

// Nome foglio Excel valido (max 31 caratteri, senza caratteri speciali, univoco)
const nomeFoglio = (s, usati) => {
  let n = s.replace(/[\\/?*[\]:]/g, " ").slice(0, 31);
  for (let i = 2; usati.has(n.toLowerCase()); i++) n = n.slice(0, 28) + " " + i;
  usati.add(n.toLowerCase());
  return n;
};

async function foglio(t, q, usati = new Set(), conModulo = false) {
  const righe = await listAll(t, q);
  // Sì/No al posto di 1/0
  const bool = t.columns.filter((c) => c.type === "bool").map((c) => c.name);
  for (const r of righe) for (const b of bool) r[b] = r[b] ? "Sì" : "No";
  const titolo = conModulo ? `${t.moduleLabel} · ${t.label}` : t.label;
  return {
    nome: nomeFoglio(titolo, usati),
    titolo,
    colonne: colonne(t),
    righe,
  };
}

export const perTabella = async (nome, q) => {
  const t = byName.get(nome);
  return t
    ? { nome: `${t.moduleLabel} · ${t.label}`, fogli: [await foglio(t, q)] }
    : null;
};

export const perModulo = async (id) => {
  if (!MODULES[id]) return null;
  const usati = new Set(["indice"]);
  const fogli = [];
  for (const t of tables.filter((x) => x.module === id))
    fogli.push(await foglio(t, "", usati));
  return { nome: MODULES[id], fogli };
};

export const tutto = async () => {
  const usati = new Set(["indice"]);
  const fogli = [];
  for (const t of tables) fogli.push(await foglio(t, "", usati, true));
  return { nome: "Tutti i dati", fogli };
};
