// Excel (.xlsx): un foglio per tabella, intestazioni colorate, filtri, riga bloccata e formati
import ExcelJS from "exceljs";

const ACCENTO = "FF5B4BF0";
const FORMATI = {
  euro: '#,##0.00 "€"',
  decimale: "#,##0.00",
  data: "dd/mm/yyyy",
  numero: "#,##0",
  id: "0",
};
const data = (s) => {
  const d = /^\d{4}-\d{2}-\d{2}/.test(s)
    ? new Date(String(s).slice(0, 10) + "T00:00:00Z")
    : null;
  return d && !isNaN(d) ? d : s;
};
const larghezza = (c, righe) => {
  const max = righe
    .slice(0, 200)
    .reduce((m, r) => Math.max(m, String(r[c.k] ?? "").length), c.l.length);
  return Math.min(48, Math.max(c.tipo === "id" ? 6 : 11, max + 3));
};

function aggiungiFoglio(wb, f) {
  const ws = wb.addWorksheet(f.nome, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = f.colonne.map((c) => ({
    header: c.l,
    key: c.k,
    width: larghezza(c, f.righe),
    style: FORMATI[c.tipo] ? { numFmt: FORMATI[c.tipo] } : {},
  }));
  for (const r of f.righe)
    ws.addRow(
      f.colonne.map((c) =>
        c.tipo === "data" && r[c.k] ? data(r[c.k]) : (r[c.k] ?? null),
      ),
    );
  ws.getRow(1).height = 22;
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: ACCENTO },
    };
    cell.alignment = { vertical: "middle" };
  });
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: f.colonne.length },
  };
}

export default {
  estensione: "xlsx",
  mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  async crea({ nome, fogli }) {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Gestionale";
    wb.created = new Date();
    if (fogli.length > 1) {
      // Foglio «Indice» con collegamenti a ogni tabella e numero di righe
      const ix = wb.addWorksheet("Indice");
      ix.columns = [{ width: 44 }, { width: 12 }];
      ix.addRow([nome]).font = { bold: true, size: 16 };
      ix.addRow([
        `Esportato il ${new Date().toLocaleDateString("it-IT")}`,
      ]).font = { color: { argb: "FF727A94" } };
      ix.addRow([]);
      ix.addRow(["Tabella", "Righe"]).eachCell((c) => {
        c.font = { bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: ACCENTO },
        };
      });
      for (const f of fogli) {
        const riga = ix.addRow([
          { text: f.titolo, hyperlink: `#'${f.nome}'!A1` },
          f.righe.length,
        ]);
        riga.getCell(1).font = { color: { argb: ACCENTO }, underline: true };
      }
    }
    for (const f of fogli) aggiungiFoglio(wb, f);
    return Buffer.from(await wb.xlsx.writeBuffer());
  },
};
