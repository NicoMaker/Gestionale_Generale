import { pathToFileURL } from "node:url";
import { get, exec, dbPath } from "../config/db.js";
import { tables, createSql } from "../schema/index.js";
import { seedAll } from "./seed.js";

async function tx(fn) {
  await exec("BEGIN");
  try {
    await fn();
    await exec("COMMIT");
  } catch (e) {
    await exec("ROLLBACK");
    throw e;
  }
}

export async function initDb() {
  await tx(async () => {
    for (const t of tables) await exec(createSql(t));
  });
  const { n } = await get("SELECT COUNT(*) AS n FROM vendite_tipi");
  if (n === 0) await tx(seedAll);
}

// eseguito direttamente (`npm run db:init`)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await initDb();
    console.log(`DB pronto: ${dbPath} (${tables.length} tabelle)`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
