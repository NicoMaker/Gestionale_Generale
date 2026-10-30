import { all, get, run } from "../config/db.js";
import { byName, labelCol } from "../schema/index.js";

export const editable = (t) =>
  t.columns.filter((c) => !c.pk && c.name !== "created_at");
const pick = (t, body) => {
  const out = {};
  for (const c of editable(t))
    if (body[c.name] !== undefined)
      out[c.name] = body[c.name] === "" ? null : body[c.name];
  return out;
};

// Filtro di ricerca su tutte le colonne di testo
const search = (t, q) => {
  const textCols = t.columns.filter((c) => c.type === "text");
  if (!q || !textCols.length) return { where: "", params: [] };
  return {
    where: "WHERE " + textCols.map((c) => `"${c.name}" LIKE ?`).join(" OR "),
    params: textCols.map(() => `%${q}%`),
  };
};

// per ogni chiave esterna aggiunge la colonna "<col>__label" con il testo del record collegato
const labelsSql = (t) =>
  t.columns
    .filter((c) => c.fk && byName.get(c.fk.table))
    .map((c) => {
      const ref = byName.get(c.fk.table);
      return `, (SELECT "${labelCol(ref)}" FROM "${ref.name}" WHERE id = "${t.name}"."${c.name}") AS "${c.name}__label"`;
    })
    .join("");

// Tutte le righe (senza paginazione) con le etichette delle chiavi esterne: per le esportazioni
export const listAll = (t, q = "") => {
  const { where, params } = search(t, q);
  return all(`SELECT *${labelsSql(t)} FROM "${t.name}" ${where} ORDER BY id`, params);
};

export async function list(t, { page = 1, limit = 20, q = "" }) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(200, Math.max(1, parseInt(limit) || 20));
  const { where, params } = search(t, q);
  const { n } = await get(
    `SELECT COUNT(*) AS n FROM "${t.name}" ${where}`,
    params,
  );
  const rows = await all(
    `SELECT *${labelsSql(t)} FROM "${t.name}" ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit],
  );
  return {
    rows,
    total: n,
    page,
    limit,
    pages: Math.max(1, Math.ceil(n / limit)),
  };
}

export const getOne = (t, id) =>
  get(`SELECT * FROM "${t.name}" WHERE id = ?`, [id]);

export async function create(t, body) {
  const data = pick(t, body);
  const keys = Object.keys(data);
  const sql = keys.length
    ? `INSERT INTO "${t.name}" (${keys.map((k) => `"${k}"`).join(",")}) VALUES (${keys.map(() => "?").join(",")})`
    : `INSERT INTO "${t.name}" DEFAULT VALUES`;
  const { lastID } = await run(
    sql,
    keys.map((k) => data[k]),
  );
  return getOne(t, lastID);
}

export async function update(t, id, body) {
  const data = pick(t, body);
  const keys = Object.keys(data);
  if (keys.length)
    await run(
      `UPDATE "${t.name}" SET ${keys.map((k) => `"${k}" = ?`).join(",")} WHERE id = ?`,
      [...keys.map((k) => data[k]), id],
    );
  return getOne(t, id);
}

export const remove = async (t, id) =>
  (await run(`DELETE FROM "${t.name}" WHERE id = ?`, [id])).changes;

export const options = (t) =>
  all(
    `SELECT id, "${labelCol(t)}" AS label FROM "${t.name}" ORDER BY id LIMIT 500`,
  );
