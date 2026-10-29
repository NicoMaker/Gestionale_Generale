# Gestionale

Node.js (≥ 20.11) + Express 5 + SQLite3 · 500 tabelle (25 categorie × 20 sezioni) · tutto in **ES modules** con soli file `.js` (niente `.cjs`/`.mjs`) · frontend HTML/CSS/JS vanilla a componenti.

## Avvio

```
npm install
npm start             # http://localhost:3000 (crea DB e dati demo al primo avvio)
npm run dev           # riavvio automatico con `node --watch` (nodemon non serve più)
npm run schema:mmd    # rigenera schema/*.mmd e le immagini PNG in img/
```

## Navigazione

- **Sidebar**: ogni *categoria* (modulo) è un gruppo espandibile; sotto ci sono le sue 20 *sezioni*, divise in 5 gruppi
  (Anagrafiche · Documenti · Movimenti e tariffe · Classificazioni · Sistema).
- **Clic su una categoria** → dashboard del modulo con tutte le opzioni disponibili (con numero di record) e lo schema ER come immagine.
- **Clic su una sezione** → tabella dati (ricerca, paginazione, nuovo/modifica/elimina).
- Indirizzi con hash (`#/crm`, `#/crm/anagrafica`): pulsanti Indietro/Avanti e link condivisibili funzionano.
- **Mobile**: menu a scorrimento (swipe dal bordo sinistro per aprirlo, a sinistra per chiuderlo), tabelle che diventano card con etichette, form a tutto schermo con azioni fisse in basso, schema ER con pinch-zoom e trascinamento (`css/componenti/responsive.css`).
- **Ctrl K** ricerca rapida · **T** cambia tema (sole = chiaro, luna = scuro).

## Schema ER (PNG)

`npm run schema:mmd` esegue `scripts/generate-mmd.js`:

| Output | Contenuto |
| --- | --- |
| `schema/schema.mmd`, `schema/modules/<modulo>.mmd` | sorgenti Mermaid |
| `img/modules/<modulo>.png` e `<modulo>-dark.png` | immagini per tema chiaro e scuro (usate dall'interfaccia) |

Opzioni: `--no-png` (solo .mmd, anche `npm run schema:solo-mmd`) · `--full` (aggiunge `img/schema*.png` con tutte le 500 tabelle:
è una striscia molto larga, utile solo da zoomare; `npm run schema:completo`).
Richiede `npm install` (usa `@mermaid-js/mermaid-cli`). Su server senza Chrome impostare `PUPPETEER_EXECUTABLE_PATH`.

## Struttura

```
server.js                     entry point (serve public/ e img/)
src/{config,schema,db,routes,controllers,services}   backend e API CRUD generica
scripts/                      generate-mmd.js (mmd + png), reset-db.js
schema/                       file Mermaid (.mmd)
img/                          schemi ER in PNG
public/
  index.html
  css/base/                   variabili (temi), layout
  css/componenti/             un file CSS per componente
  js/core/                    api, state, router, icone (SVG), config, utils, main
  js/components/              sidebar, topbar, home, modulo, tabella-dati,
                              form-record, schema-img, palette, tema, toast
```

Per ripartire da zero con i dati: `npm run db:reset`.
