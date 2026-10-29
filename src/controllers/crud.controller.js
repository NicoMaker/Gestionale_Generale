import { existsSync } from "node:fs";
import { join } from "node:path";
import * as crud from "../services/crud.service.js";
import { get, all } from "../config/db.js";
import { MODULES, tables, byName } from "../schema/index.js";

const IMG_DIR = join(import.meta.dirname, "../../img");
const hasImg = (id) => existsSync(join(IMG_DIR, "modules", `${id}.png`));

// Middleware: valida il nome tabella contro il registro (whitelist anti SQL injection)
export const loadTable = (req, res, next) => {
  const t = byName.get(req.params.table);
  if (!t) return res.status(404).json({ error: "Tabella inesistente" });
  req.t = t;
  next();
};

export const modules = (req, res) =>
  res.json(
    Object.entries(MODULES).map(([id, label]) => ({
      id,
      label,
      tables: tables.filter((t) => t.module === id).length,
      img: hasImg(id), // esiste img/modules/<id>.png (schema ER generato)
    })),
  );

export const listTables = (req, res) =>
  res.json(
    tables
      .filter((t) => !req.query.module || t.module === req.query.module)
      .map(({ name, module, label }) => ({ name, module, label })),
  );

export const meta = (req, res) =>
  res.json({
    name: req.t.name,
    label: req.t.label,
    module: req.t.module,
    columns: req.t.columns,
  });

export const list = async (req, res) =>
  res.json(await crud.list(req.t, req.query));
export const getOne = async (req, res) => {
  const row = await crud.getOne(req.t, req.params.id);
  row ? res.json(row) : res.status(404).json({ error: "Record non trovato" });
};
export const create = async (req, res) =>
  res.status(201).json(await crud.create(req.t, req.body));
export const update = async (req, res) =>
  res.json(await crud.update(req.t, req.params.id, req.body));
export const remove = async (req, res) => {
  (await crud.remove(req.t, req.params.id))
    ? res.json({ ok: true })
    : res.status(404).json({ error: "Record non trovato" });
};

export const options = async (req, res) => res.json(await crud.options(req.t));

// Conteggi per modulo (anagrafiche, documenti, movimenti) per la panoramica
export const stats = async (req, res) => {
  const count = async (m, s) =>
    (await get(`SELECT COUNT(*) AS n FROM "${m}_${s}"`)).n;
  const out = await Promise.all(
    Object.keys(MODULES).map(async (m) => ({
      id: m,
      anagrafica: await count(m, "anagrafica"),
      documenti: await count(m, "documenti"),
      movimenti: await count(m, "movimenti"),
    })),
  );
  res.json(out);
};

// Opzioni di un modulo: ogni tabella con il numero di record (dashboard del modulo)
export const moduleSummary = async (req, res) => {
  const id = req.params.id;
  if (!MODULES[id]) return res.status(404).json({ error: "Modulo inesistente" });
  const list = tables.filter((t) => t.module === id);
  const items = await Promise.all(
    list.map(async (t) => ({
      name: t.name,
      suffix: t.suffix,
      label: t.label,
      columns: t.columns.length,
      links: t.columns.filter((c) => c.fk).length,
      records: (await get(`SELECT COUNT(*) AS n FROM "${t.name}"`)).n,
    })),
  );
  res.json({
    id,
    label: MODULES[id],
    img: hasImg(id),
    tables: items,
    records: items.reduce((a, t) => a + t.records, 0),
  });
};

// Dati per i grafici della panoramica
export const dashboard = async (req, res) => {
  const mods = Object.keys(MODULES);
  const mov = mods
    .map((m) => `SELECT data, causale, importo FROM "${m}_movimenti"`)
    .join(" UNION ALL ");
  const doc = mods
    .map(
      (m) =>
        `SELECT s.codice AS stato FROM "${m}_documenti" d JOIN "${m}_stati" s ON s.id = d.stato_id`,
    )
    .join(" UNION ALL ");
  const monthly = await all(
    `SELECT substr(data,1,7) AS mese, causale, ROUND(SUM(importo),2) AS tot FROM (${mov}) GROUP BY mese, causale ORDER BY mese`,
  );
  const stati = await all(
    `SELECT stato, COUNT(*) AS n FROM (${doc}) GROUP BY stato`,
  );
  res.json({ monthly, stati });
};

