import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import sqlite3 from "sqlite3";

export const dbPath =
  process.env.DB_PATH ?? join(import.meta.dirname, "../../data/gestionale.db");
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new (sqlite3.verbose().Database)(dbPath);
db.serialize(() => db.run("PRAGMA foreign_keys = ON"));

export const run = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      err
        ? reject(err)
        : resolve({ lastID: this.lastID, changes: this.changes });
    }),
  );
export const all = (sql, params = []) =>
  new Promise((res, rej) =>
    db.all(sql, params, (e, r) => (e ? rej(e) : res(r))),
  );
export const get = (sql, params = []) =>
  new Promise((res, rej) =>
    db.get(sql, params, (e, r) => (e ? rej(e) : res(r))),
  );
export const exec = (sql) =>
  new Promise((res, rej) => db.exec(sql, (e) => (e ? rej(e) : res())));
