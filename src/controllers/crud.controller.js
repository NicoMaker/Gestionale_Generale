const crud = require("../services/crud.service");
const { get, all } = require("../config/db");
const { MODULES, tables, byName, toMermaid } = require("../schema");

const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Middleware: valida il nome tabella contro il registro (whitelist anti SQL injection)
const loadTable = (req, res, next) => {
  const t = byName.get(req.params.table);
  if (!t) return res.status(404).json({ error: "Tabella inesistente" });
  req.t = t;
  next();
};

const modules = (req, res) =>
  res.json(
    Object.entries(MODULES).map(([id, label]) => ({
      id,
      label,
      tables: tables.filter((t) => t.module === id).length,
    })),
  );

const listTables = (req, res) =>
  res.json(
    tables
      .filter((t) => !req.query.module || t.module === req.query.module)
      .map(({ name, module, label }) => ({ name, module, label })),
  );

const meta = (req, res) =>
  res.json({
    name: req.t.name,
    label: req.t.label,
    module: req.t.module,
    columns: req.t.columns,
  });

const schemaMmd = (req, res) => {
  const list = tables.filter(
    (t) => !req.query.module || t.module === req.query.module,
  );
  res.type("text/plain").send(toMermaid(list));
};

const list = wrap(async (req, res) =>
  res.json(await crud.list(req.t, req.query)),
);
const getOne = wrap(async (req, res) => {
  const row = await crud.getOne(req.t, req.params.id);
  row ? res.json(row) : res.status(404).json({ error: "Record non trovato" });
});
const create = wrap(async (req, res) =>
  res.status(201).json(await crud.create(req.t, req.body)),
);
const update = wrap(async (req, res) =>
  res.json(await crud.update(req.t, req.params.id, req.body)),
);
const remove = wrap(async (req, res) => {
  (await crud.remove(req.t, req.params.id))
    ? res.json({ ok: true })
    : res.status(404).json({ error: "Record non trovato" });
});

const options = wrap(async (req, res) => res.json(await crud.options(req.t)));

// Conteggi per modulo (anagrafiche, documenti, movimenti) per la panoramica
const stats = wrap(async (req, res) => {
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
});

// Dati per i grafici della panoramica
const dashboard = wrap(async (req, res) => {
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
});

module.exports = {
  dashboard,
  options,
  stats,
  loadTable,
  modules,
  listTables,
  meta,
  schemaMmd,
  list,
  getOne,
  create,
  update,
  remove,
};
