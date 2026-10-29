// Cancella il database e lo ricrea con i dati di esempio.
import { rmSync } from "node:fs";
import { join } from "node:path";

const p =
  process.env.DB_PATH ?? join(import.meta.dirname, "../data/gestionale.db");
for (const f of [p, `${p}-wal`, `${p}-shm`]) rmSync(f, { force: true });

try {
  const { initDb } = await import("../src/db/init.js");
  await initDb();
  console.log("Database ricreato con dati di esempio.");
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
