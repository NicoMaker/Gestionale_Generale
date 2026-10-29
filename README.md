# Gestionale

Node.js + Express + SQLite3 · 500 tabelle (25 moduli × 20) · frontend HTML/JS vanilla.

## Avvio

    npm install
    npm start          # http://localhost:3000 (crea DB e dati demo al primo avvio)
    npm run schema:mmd # rigenera docs/schema.mmd e docs/modules/*.mmd

## Struttura

- server.js — entry point
- src/config — connessione SQLite
- src/schema — definizione 500 tabelle, SQL e generatore Mermaid
- src/db — init e seed
- src/routes, controllers, services — API CRUD generica (/api/tables/:table)
- public — frontend (index.html, css, js)
- docs — schema ER Mermaid (.mmd)

## Dati di esempio

Al primo avvio tutte le 500 tabelle vengono popolate (circa 6.600 righe): anagrafiche coerenti con ogni modulo,
contatti, indirizzi, documenti con righe e scadenze, movimenti su 10 mesi, tariffe, log, report e altro.
Chiavi esterne tutte valide. Per ripartire da zero: `npm run db:reset`.
Dati in `src/db/seed-data.js`, logica in `src/db/seed.js`.
