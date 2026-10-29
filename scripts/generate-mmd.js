// Genera lo schema ER del gestionale:
//   schema/schema.mmd            + schema/modules/<modulo>.mmd   (sorgenti Mermaid)
//   img/schema(.png|-dark.png)   + img/modules/<modulo>(.png|-dark.png)  (immagini per l'interfaccia)
//
// Uso:  node scripts/generate-mmd.js            -> .mmd + PNG (chiaro e scuro)
//       node scripts/generate-mmd.js --no-png   -> solo i file .mmd
//       node scripts/generate-mmd.js --full     -> in più il PNG dello schema completo (500 tabelle: striscia molto larga)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { MODULES, tables, toMermaid } from "../src/schema/index.js";

const root = path.join(import.meta.dirname, "..");
const schemaDir = path.join(root, "schema");
const imgDir = path.join(root, "img");
const args = new Set(process.argv.slice(2));
const withPng = !args.has("--no-png");
const withFull = args.has("--full");

/* ---------- 1. File .mmd ---------- */
fs.mkdirSync(path.join(schemaDir, "modules"), { recursive: true });
fs.writeFileSync(path.join(schemaDir, "schema.mmd"), toMermaid(tables));
for (const mod of Object.keys(MODULES))
  fs.writeFileSync(
    path.join(schemaDir, "modules", `${mod}.mmd`),
    toMermaid(tables.filter((t) => t.module === mod)),
  );
console.log(
  `Generati schema/schema.mmd (${tables.length} tabelle) e ${Object.keys(MODULES).length} file in schema/modules/`,
);
if (!withPng) process.exit(0);

/* ---------- 2. Immagini PNG (mermaid-cli) ---------- */
fs.mkdirSync(path.join(imgDir, "modules"), { recursive: true });

const bin = path.join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "mmdc.cmd" : "mmdc",
);
if (!fs.existsSync(bin)) {
  console.error("mermaid-cli non trovato: esegui prima `npm install`.");
  process.exit(1);
}

// Configurazione di Puppeteer (--no-sandbox serve su Linux/CI/Docker)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gestionale-mmd-"));
const pupCfg = path.join(tmp, "puppeteer.json");
fs.writeFileSync(
  pupCfg,
  JSON.stringify({
    ...(process.env.PUPPETEER_EXECUTABLE_PATH && {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    }),
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  }),
);
// Lo schema completo supera il limite predefinito di Mermaid (50.000 caratteri)
const mmCfg = path.join(tmp, "mermaid.json");
fs.writeFileSync(
  mmCfg,
  JSON.stringify({
    maxTextSize: 2000000,
    maxEdges: 20000,
    er: { useMaxWidth: false }, // dimensione naturale: testo leggibile nel PNG
  }),
);

// stesso colore delle "surface" dell'interfaccia, così l'immagine si fonde con la pagina
const VARIANTS = [
  { suffix: "", theme: "default", bg: "#ffffff" },
  { suffix: "-dark", theme: "dark", bg: "#181b30" },
];

function render(input, outBase, opts = {}) {
  for (const v of VARIANTS) {
    const out = `${outBase}${v.suffix}.png`;
    const r = spawnSync(
      bin,
      [
        "-q",
        "-p",
        pupCfg,
        "-c",
        mmCfg,
        "-i",
        input,
        "-o",
        out,
        "-t",
        v.theme,
        "-b",
        v.bg,
        "-s",
        String(opts.scale || 2),
      ],
      { stdio: "pipe", shell: process.platform === "win32", encoding: "utf8" },
    );
    if (r.status !== 0) {
      console.error(
        `  ✗ ${path.relative(root, out)}\n    ${(r.stderr || r.stdout || "errore sconosciuto").trim().split("\n")[0]}`,
      );
      return false;
    }
  }
  return true;
}

let ok = 0;
const mods = Object.keys(MODULES);
mods.forEach((mod, i) => {
  process.stdout.write(`[${i + 1}/${mods.length}] ${mod}… `);
  const done = render(
    path.join(schemaDir, "modules", `${mod}.mmd`),
    path.join(imgDir, "modules", mod),
  );
  if (done) ok++;
  console.log(done ? "ok" : "");
});

if (withFull) {
  process.stdout.write("schema completo (molto largo)… ");
  const done = render(
    path.join(schemaDir, "schema.mmd"),
    path.join(imgDir, "schema"),
    { scale: 1 },
  );
  console.log(done ? "ok" : "saltato");
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(
  `PNG generati in img/ (${ok}/${mods.length} moduli, chiaro + scuro).`,
);
