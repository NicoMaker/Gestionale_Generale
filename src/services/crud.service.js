import { all, get, run } from "../config/db.js";
import { byName, labelCol, usedBy } from "../schema/index.js";

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
  return all(
    `SELECT *${labelsSql(t)} FROM "${t.name}" ${where} ORDER BY id`,
    params,
  );
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

const CHUNK = 500;
const conflict = (message) =>
  Object.assign(new Error(message), { status: 409 });

// Dove sono usati i record di `t`: Map id -> [{ tabella, n }].
// Con `ids` si controllano solo quelli indicati, altrimenti tutta la tabella.
async function usage(t, ids = null) {
  const out = new Map();
  for (const u of usedBy.get(t.name)) {
    const col = `"${u.column}"`;
    const parti = ids
      ? Array.from({ length: Math.ceil(ids.length / CHUNK) }, (_, i) =>
          ids.slice(i * CHUNK, (i + 1) * CHUNK),
        )
      : [null];
    for (const parte of parti) {
      const rows = await all(
        `SELECT ${col} AS id, COUNT(*) AS n FROM "${u.table}" WHERE ${parte ? `${col} IN (${parte.map(() => "?")})` : `${col} IS NOT NULL`} GROUP BY ${col}`,
        parte ?? [],
      );
      for (const r of rows) {
        const l = out.get(r.id) ?? [];
        l.push({ tabella: u.label, n: r.n });
        out.set(r.id, l);
      }
    }
  }
  return out;
}
const descrivi = (l) =>
  l
    .slice(0, 4)
    .map((x) => `${x.tabella} (${x.n})`)
    .join(", ") + (l.length > 4 ? ` e altre ${l.length - 4} tabelle` : "");

// Elimina un record solo se nessun'altra tabella lo usa
export async function remove(t, id) {
  const l = (await usage(t, [Number(id)])).get(Number(id));
  if (l) throw conflict(`Non eliminabile: collegato a ${descrivi(l)}`);
  return (await run(`DELETE FROM "${t.name}" WHERE id = ?`, [id])).changes;
}

// Eliminazione multipla: { ids: [...] } oppure { tutti: true, q } (tutti i record, o quelli trovati dalla ricerca).
// I record collegati ad altre tabelle vengono saltati e restituiti in `bloccati`.
export async function removeMany(t, { ids, tutti, q = "" } = {}) {
  let lista;
  if (tutti) {
    const { where, params } = search(t, q);
    lista = (await all(`SELECT id FROM "${t.name}" ${where}`, params)).map(
      (r) => r.id,
    );
  } else if (Array.isArray(ids))
    lista = [...new Set(ids.map(Number))].filter(Number.isInteger);
  else
    throw Object.assign(new Error("Nessun record indicato"), { status: 400 });

  const usati = await usage(t, tutti ? null : lista);
  const liberi = lista.filter((id) => !usati.has(id));
  const idBloccati = lista.filter((id) => usati.has(id));
  // il nome leggibile dei primi record bloccati, per il riepilogo a video
  const nomi = new Map();
  const primi = idBloccati.slice(0, 100);
  if (primi.length)
    for (const x of await all(
      `SELECT id, "${labelCol(t)}" AS e FROM "${t.name}" WHERE id IN (${primi.map(() => "?")})`,
      primi,
    ))
      nomi.set(x.id, x.e);
  const bloccati = idBloccati.map((id) => ({
    id,
    etichetta: nomi.get(id) ?? null,
    usato_in: descrivi(usati.get(id)),
  }));

  let eliminati = 0;
  for (let i = 0; i < liberi.length; i += CHUNK) {
    const parte = liberi.slice(i, i + CHUNK);
    eliminati += (
      await run(
        `DELETE FROM "${t.name}" WHERE id IN (${parte.map(() => "?")})`,
        parte,
      )
    ).changes;
  }
  return { eliminati, bloccati };
}

export const options = (t) =>
  all(
    `SELECT id, "${labelCol(t)}" AS label FROM "${t.name}" ORDER BY id LIMIT 500`,
  );
