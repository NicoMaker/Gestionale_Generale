const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath =
  process.env.DB_PATH || path.join(__dirname, "../../data/gestionale.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath);
db.serialize(() => db.run("PRAGMA foreign_keys = ON"));

const run = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      err
        ? reject(err)
        : resolve({ lastID: this.lastID, changes: this.changes });
    }),
  );
const all = (sql, params = []) =>
  new Promise((res, rej) =>
    db.all(sql, params, (e, r) => (e ? rej(e) : res(r))),
  );
const get = (sql, params = []) =>
  new Promise((res, rej) =>
    db.get(sql, params, (e, r) => (e ? rej(e) : res(r))),
  );
const exec = (sql) =>
  new Promise((res, rej) => db.exec(sql, (e) => (e ? rej(e) : res())));

module.exports = { db, run, all, get, exec, dbPath };
