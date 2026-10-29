const fs = require("fs");
const path = require("path");
const { MODULES, tables, toMermaid } = require("../src/schema");

const docs = path.join(__dirname, "../docs");
fs.mkdirSync(path.join(docs, "modules"), { recursive: true });
fs.writeFileSync(path.join(docs, "schema.mmd"), toMermaid(tables));
for (const mod of Object.keys(MODULES))
  fs.writeFileSync(
    path.join(docs, "modules", `${mod}.mmd`),
    toMermaid(tables.filter((t) => t.module === mod)),
  );
console.log(
  `Generati docs/schema.mmd (${tables.length} tabelle) e ${Object.keys(MODULES).length} file in docs/modules/`,
);
