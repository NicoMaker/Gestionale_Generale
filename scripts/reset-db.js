// Cancella il database e lo ricrea con i dati di esempio.
const fs = require("fs");
const path = require("path");
const p = process.env.DB_PATH || path.join(__dirname, "../data/gestionale.db");
for (const f of [p, p + "-wal", p + "-shm"]) fs.rmSync(f, { force: true });
require("../src/db/init")
  .initDb()
  .then(() => {
    console.log("Database ricreato con dati di esempio.");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
