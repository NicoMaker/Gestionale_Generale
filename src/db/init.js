const { get, exec, dbPath } = require("../config/db");
const { tables, createSql } = require("../schema");
const { seedAll } = require("./seed");

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

async function initDb() {
  await tx(async () => {
    for (const t of tables) await exec(createSql(t));
  });
  const first = await get("SELECT COUNT(*) AS n FROM vendite_tipi");
  if (first.n === 0) await tx(seedAll);
}

module.exports = { initDb };

if (require.main === module) {
  initDb()
    .then(() => console.log(`DB pronto: ${dbPath} (${tables.length} tabelle)`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
