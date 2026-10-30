// Popola TUTTE le 500 tabelle con dati realistici e coerenti (chiavi esterne rispettate).
import { run } from "../config/db.js";
import { MODULES } from "../schema/index.js";
import DATA from "./seed-data.js";

const NOMI = [
  "Luca",
  "Giulia",
  "Marco",
  "Chiara",
  "Andrea",
  "Sara",
  "Davide",
  "Elena",
  "Matteo",
  "Francesca",
  "Paolo",
  "Martina",
  "Simone",
  "Valentina",
  "Stefano",
  "Alessia",
  "Federico",
  "Laura",
  "Giorgio",
  "Silvia",
  "Roberto",
  "Anna",
  "Alessandro",
  "Cristina",
  "Daniele",
  "Monica",
  "Fabio",
  "Elisa",
  "Riccardo",
  "Irene",
  "Michele",
  "Giorgia",
];
const COGNOMI = [
  "Rossi",
  "Ferrari",
  "Russo",
  "Bianchi",
  "Romano",
  "Colombo",
  "Ricci",
  "Marino",
  "Greco",
  "Bruno",
  "Gallo",
  "Conti",
  "De Luca",
  "Costa",
  "Giordano",
  "Mancini",
  "Rizzo",
  "Lombardi",
  "Moretti",
  "Barbieri",
  "Fontana",
  "Santoro",
  "Mariani",
  "Rinaldi",
  "Caruso",
  "Ferrara",
  "Galli",
  "Martini",
];
const CITTA = [
  ["Milano", "20121", "MI"],
  ["Roma", "00184", "RM"],
  ["Torino", "10121", "TO"],
  ["Bologna", "40121", "BO"],
  ["Napoli", "80121", "NA"],
  ["Verona", "37121", "VR"],
  ["Firenze", "50121", "FI"],
  ["Bergamo", "24121", "BG"],
  ["Padova", "35121", "PD"],
  ["Bari", "70121", "BA"],
  ["Genova", "16121", "GE"],
  ["Venezia", "30121", "VE"],
  ["Palermo", "90121", "PA"],
  ["Brescia", "25121", "BS"],
  ["Parma", "43121", "PR"],
  ["Trieste", "34121", "TS"],
  ["Como", "22100", "CO"],
  ["Modena", "41121", "MO"],
];
const VIE = [
  "Via Roma",
  "Via Garibaldi",
  "Corso Italia",
  "Via Mazzini",
  "Via Dante",
  "Viale Europa",
  "Via Verdi",
  "Piazza della Repubblica",
  "Via dei Mille",
  "Via Cavour",
];
const NOTE = [
  "Cliente puntuale nei pagamenti",
  "Richiede sempre conferma scritta",
  "Da ricontattare entro fine mese",
  "Sconto concordato del 5%",
  "Preferisce comunicazioni via email",
  "Verificare i dati fiscali",
  "Referente cambiato di recente",
  "Contratto in rinnovo",
  "Pagamento a 60 giorni",
  "Consegna al piano",
  "Ordine minimo concordato",
  "Segnalato da un partner",
];
const TAGS = [
  "Prioritario",
  "Da verificare",
  "Strategico",
  "Nuovo",
  "In scadenza",
  "Approvato",
  "VIP",
  "Archiviato",
  "Internazionale",
  "Rivenditore",
];
const AZIONI = [
  "Creazione",
  "Modifica",
  "Stampa",
  "Esportazione",
  "Approvazione",
  "Consultazione",
];
const RUOLI = ["Responsabile", "Operatore", "Revisore", "Consultazione"];

const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const p2 = (n) => String(n).padStart(2, "0");
const date = (m, d) => `2026-${p2(m)}-${p2(d)}`;
// (slug: usato per email e nomi file)
const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 14);

// Quantità di dati per ogni modulo (20 tabelle x 25 moduli)
const VOLUME = {
  anagrafiche: 45, // soggetti per modulo (i primi 8 hanno nome reale, gli altri sono generati)
  documenti: 120,
  movimenti: 200,
  log: 150,
  assegnazioni: 40,
  allegati: 40,
};
// Moduli le cui anagrafiche sono persone fisiche; negli altri sono aziende
const PERSONE = new Set([
  "clienti",
  "risorse_umane",
  "paghe",
  "crm",
  "sicurezza",
  "marketing",
]);
const ATTIVITA = [
  "Impianti",
  "Logistica",
  "Design",
  "Alimentari",
  "Tessuti",
  "Meccanica",
  "Costruzioni",
  "Informatica",
  "Servizi",
  "Trasporti",
  "Consulting",
  "Energia",
  "Packaging",
  "Elettronica",
];
const FORME = ["Srl", "SpA", "& C. Snc", "Sas", "Group"];

async function seedModule(mod, idx) {
  const cfg = DATA[mod],
    label = MODULES[mod];
  const r = rng(1000 + idx);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const money = (a, b) => Math.round((a + r() * (b - a)) * 100) / 100;
  const person = () => `${pick(NOMI)} ${pick(COGNOMI)}`;
  const ins = async (table, obj) => {
    const k = Object.keys(obj);
    const { lastID } = await run(
      `INSERT INTO "${mod}_${table}" (${k.map((x) => `"${x}"`).join(",")}) VALUES (${k.map(() => "?").join(",")})`,
      k.map((x) => obj[x]),
    );
    return lastID;
  };

  const tipi = [];
  for (const [i, d] of cfg.tipi.entries())
    tipi.push(
      await ins("tipi", { codice: `T${i + 1}`, descrizione: d, attivo: 1 }),
    );

  const cat = [];
  for (const [i, d] of cfg.cat.entries())
    cat.push(await ins("categorie", { codice: `C${i + 1}`, descrizione: d }));
  for (const [i, sub] of ["Standard", "Speciali"].entries())
    cat.push(
      await ins("categorie", {
        codice: `C${i + 1}.${i + 1}`,
        descrizione: `${cfg.cat[i]} · ${sub}`,
        parent_id: cat[i],
      }),
    );

  const stati = [];
  for (const [c, d, col] of [
    ["APERTO", "Aperto", "#12a05c"],
    ["CHIUSO", "Chiuso", "#727a94"],
    ["ANNULLATO", "Annullato", "#d8384a"],
  ])
    stati.push(await ins("stati", { codice: c, descrizione: d, colore: col }));
  const stato = () => {
    const x = r();
    return x < 0.6 ? stati[0] : x < 0.88 ? stati[1] : stati[2];
  };

  // Anagrafica
  const anag = [];
  const nomiAnag = [...cfg.anag];
  while (nomiAnag.length < VOLUME.anagrafiche) {
    const n = nomiAnag.length;
    nomiAnag.push(
      PERSONE.has(mod)
        ? person()
        : `${pick(COGNOMI)} ${pick(ATTIVITA)} ${pick(FORME)}`,
    );
    if (nomiAnag.indexOf(nomiAnag[n]) !== n) nomiAnag[n] += ` ${n}`;
  }
  cfg.anag = nomiAnag;
  for (const [i, nome] of nomiAnag.entries())
    anag.push(
      await ins("anagrafica", {
        codice: `${mod.toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
        nome,
        tipo_id: tipi[i % tipi.length],
        categoria_id: cat[i % cfg.cat.length],
        stato_id: stato(),
        note: pick(NOTE),
      }),
    );

  // Contatti, indirizzi, tag
  const tags = [];
  for (const t of TAGS) tags.push(await ins("tag", { nome: t }));
  for (const [i, a] of anag.entries()) {
    for (let k = 0, nc = int(1, 3); k < nc; k++) {
      const [n, c] = [pick(NOMI), pick(COGNOMI)];
      await ins("contatti", {
        anagrafica_id: a,
        nome: `${n} ${c}`,
        email: `${slug(n)}.${slug(c)}@${slug(cfg.anag[i])}.it`,
        telefono: `+39 3${int(20, 99)} ${int(1000000, 9999999)}`,
      });
    }
    const [citta, cap, prov] = pick(CITTA);
    await ins("indirizzi", {
      anagrafica_id: a,
      via: `${pick(VIE)} ${int(1, 120)}`,
      citta,
      cap,
      provincia: prov,
    });
    for (const t of [...tags].sort(() => r() - 0.5).slice(0, int(1, 3)))
      await ins("anagrafica_tag", { anagrafica_id: a, tag_id: t });
    for (let k = 0, nn = int(1, 3); k < nn; k++)
      await ins("note", {
        anagrafica_id: a,
        testo: pick(NOTE),
        autore: person(),
      });
  }

  // Documenti + righe + scadenze + allegati
  const docs = [];
  for (let i = 1; i <= VOLUME.documenti; i++) {
    const m = int(1, 10),
      dd = int(1, 28),
      st = stato();
    const id = await ins("documenti", {
      numero: `2026/${String(i).padStart(4, "0")}`,
      data: date(m, dd),
      anagrafica_id: pick(anag),
      stato_id: st,
      totale: 0,
    });
    let tot = 0;
    for (let k = 0, nr = int(2, 5); k < nr; k++) {
      const q = int(1, 20),
        pr = money(10, 400);
      tot += q * pr;
      await ins("righe_documento", {
        documento_id: id,
        descrizione: pick(cfg.art),
        quantita: q,
        prezzo: pr,
      });
    }
    tot = Math.round(tot * 100) / 100;
    await run(`UPDATE "${mod}_documenti" SET totale = ? WHERE id = ?`, [
      tot,
      id,
    ]);
    if (st !== stati[2])
      await ins("scadenze", {
        documento_id: id,
        data_scadenza: date(Math.min(12, m + 1), dd),
        importo: tot,
        pagata: st === stati[1] || r() < 0.3 ? 1 : 0,
      });
    docs.push(id);
  }
  for (let i = 0; i < VOLUME.allegati; i++) {
    const d = pick(docs);
    await ins("allegati", {
      documento_id: d,
      nome_file: `${slug(label)}_${i + 1}.pdf`,
      percorso: `/archivio/${mod}/2026/${slug(label)}_${i + 1}.pdf`,
    });
  }

  // Movimenti (10 mesi, per i grafici)
  for (let i = 0; i < VOLUME.movimenti; i++)
    await ins("movimenti", {
      anagrafica_id: pick(anag),
      data: date(int(1, 10), int(1, 28)),
      importo: money(100, 9000),
      causale: r() < 0.55 ? "Incasso" : "Pagamento",
    });

  // Tariffe, regole, configurazioni, log, assegnazioni, report
  for (const t of tipi) {
    await ins("tariffe", {
      tipo_id: t,
      valore: money(5, 120),
      valido_dal: "2025-01-01",
      valido_al: "2025-12-31",
    });
    await ins("tariffe", {
      tipo_id: t,
      valore: money(5, 130),
      valido_dal: "2026-01-01",
      valido_al: "2026-12-31",
    });
  }
  for (const [c, d, e] of [
    ["R001", "Sconto oltre 1.000 €", "totale > 1000 ? 5% : 0"],
    ["R002", "Blocco cliente con scadenze scadute", "scadute > 2"],
    ["R003", "Approvazione oltre 5.000 €", "totale > 5000"],
    ["R004", "Numerazione annuale documenti", "anno/progressivo"],
  ])
    await ins("regole", { codice: c, descrizione: d, espressione: e });
  for (const [k, v] of [
    ["valuta", "EUR"],
    ["iva_default", "22"],
    ["giorni_scadenza", "30"],
    ["prefisso_documenti", mod.slice(0, 3).toUpperCase()],
    ["formato_data", "GG/MM/AAAA"],
    ["notifiche_email", "attive"],
  ])
    await ins("configurazioni", { chiave: k, valore: v });
  for (let i = 0; i < VOLUME.log; i++)
    await ins("log", {
      anagrafica_id: pick(anag),
      azione: pick(AZIONI),
      data: date(int(1, 10), int(1, 28)),
    });
  for (let i = 0; i < VOLUME.assegnazioni; i++)
    await ins("assegnazioni", {
      anagrafica_id: pick(anag),
      utente: person(),
      ruolo: pick(RUOLI),
    });
  for (const [n, q] of [
    [
      `Riepilogo ${label} mensile`,
      `SELECT * FROM ${mod}_documenti ORDER BY data DESC`,
    ],
    [
      `${label}: documenti aperti`,
      `SELECT * FROM ${mod}_documenti WHERE stato_id = ${stati[0]}`,
    ],
    [
      `${label}: movimenti per causale`,
      `SELECT causale, SUM(importo) FROM ${mod}_movimenti GROUP BY causale`,
    ],
    [
      `${label}: scadenze non pagate`,
      `SELECT * FROM ${mod}_scadenze WHERE pagata = 0`,
    ],
  ])
    await ins("report", {
      nome: n,
      query: q,
      creato_il: date(int(1, 10), int(1, 28)),
    });
}

export async function seedAll() {
  for (const [i, mod] of Object.keys(MODULES).entries())
    await seedModule(mod, i);
}
