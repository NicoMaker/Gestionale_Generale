// Esportazioni e copia di sicurezza del database
//   /api/export/tables/:table/:formato   csv | xlsx | pdf   (opzionale ?q=testo per le sole righe filtrate)
//   /api/export/modules/:id/:formato     xlsx | pdf
//   /api/export/all/xlsx                 tutte le 500 tabelle in un unico file Excel
//   /api/backup                          copia coerente del file .db
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rm } from "node:fs/promises";
import { run } from "../config/db.js";
import * as dati from "../services/export/dati.js";
import csv from "../services/export/csv.js";
import xlsx from "../services/export/xlsx.js";
import pdf from "../services/export/pdf.js";

const FORMATI = { csv, xlsx, pdf };
const oggi = () => new Date().toISOString().slice(0, 10);
const errore = (status, msg) => Object.assign(new Error(msg), { status });

// Crea il file nel formato richiesto e lo invia come download
async function invia(res, pacchetto, formato, base, ammessi) {
  const f = FORMATI[formato];
  if (!f || !ammessi.includes(formato))
    throw errore(400, "Formato non supportato");
  if (!pacchetto) throw errore(404, "Elemento non trovato");
  res.type(f.mime);
  res.attachment(`${base}-${oggi()}.${f.estensione}`);
  res.send(await f.crea(pacchetto));
}

export const tabella = async (req, res) =>
  invia(
    res,
    await dati.perTabella(req.params.table, req.query.q),
    req.params.formato,
    req.params.table,
    ["csv", "xlsx", "pdf"],
  );
export const modulo = async (req, res) =>
  invia(
    res,
    await dati.perModulo(req.params.id),
    req.params.formato,
    req.params.id,
    ["xlsx", "pdf"],
  );
export const tutto = async (req, res) =>
  invia(res, await dati.tutto(), "xlsx", "gestionale-completo", ["xlsx"]);

// Backup: VACUUM INTO produce una copia consistente anche mentre il database è in uso
export const backup = async (req, res) => {
  const tmp = join(tmpdir(), `gestionale-${Date.now()}.db`);
  await run(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
  res.download(tmp, `gestionale-backup-${oggi()}.db`, () =>
    rm(tmp, { force: true }),
  );
};
