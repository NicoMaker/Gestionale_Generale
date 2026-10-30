// PDF (A4 orizzontale): una sezione per tabella, intestazione ripetuta a ogni pagina, numeri di pagina
import PDFDocument from "pdfkit";

const M = 36;
const COL = { ink: "#161a2b", mu: "#727a94", ac: "#5b4bf0", riga: "#f3f4fb" };
const euro = (n) => Number(n).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
const dataIt = (s) => (s ? String(s).slice(0, 10).split("-").reverse().join("/") : "");
const testo = (c, v) =>
  v == null || v === "" ? "" : c.tipo === "euro" ? euro(v) : c.tipo === "decimale" ? Number(v).toLocaleString("it-IT", { minimumFractionDigits: 2 }) : c.tipo === "data" ? dataIt(v) : String(v);
const destra = (c) => c.tipo === "euro" || c.tipo === "decimale" || c.tipo === "numero";

// Larghezze proporzionali al contenuto, con minimo e massimo
function larghezze(f, tot) {
  const peso = f.colonne.map((c) => {
    const m = f.righe.slice(0, 80).reduce((a, r) => Math.max(a, testo(c, r[c.k]).length), c.l.length);
    return c.tipo === "id" ? 3 : Math.min(30, Math.max(7, m));
  });
  const somma = peso.reduce((a, b) => a + b, 0);
  return peso.map((p) => (p / somma) * tot);
}

export default {
  estensione: "pdf",
  mime: "application/pdf",
  crea({ nome, fogli }) {
    return new Promise((ok, ko) => {
      const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: M, bufferPages: true, info: { Title: nome, Author: "Gestionale" } });
      const blocchi = [];
      doc.on("data", (b) => blocchi.push(b));
      doc.on("end", () => ok(Buffer.concat(blocchi)));
      doc.on("error", ko);
      const W = doc.page.width - M * 2;
      const fondo = doc.page.height - M - 18;
      const oggi = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });

      if (fogli.length > 1) {
        doc.fillColor(COL.ac).font("Helvetica-Bold").fontSize(26).text(nome, M, 90);
        doc.fillColor(COL.mu).font("Helvetica").fontSize(11).text(`Esportato il ${oggi} · ${fogli.length} tabelle · ${fogli.reduce((a, f) => a + f.righe.length, 0).toLocaleString("it-IT")} righe`);
        doc.moveDown(1.2).fillColor(COL.ink).fontSize(10);
        const y0 = doc.y;
        fogli.forEach((f, i) => doc.text(`${f.titolo}  (${f.righe.length})`, M, y0 + i * 14, { width: W, lineBreak: false, ellipsis: true }));
        doc.addPage();
      }

      fogli.forEach((f, n) => {
        if (n) doc.addPage();
        const ws = larghezze(f, W);
        const testa = () => {
          doc.fillColor(COL.ink).font("Helvetica-Bold").fontSize(15).text(f.titolo, M, M);
          doc.fillColor(COL.mu).font("Helvetica").fontSize(9).text(`${nome} · ${f.righe.length} righe · ${oggi}`, M, M + 20);
          const y = M + 40;
          let x = M;
          doc.rect(M, y, W, 20).fill(COL.ac);
          doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8);
          f.colonne.forEach((c, i) => {
            doc.text(c.l, x + 4, y + 6, { width: ws[i] - 8, lineBreak: false, ellipsis: true, align: destra(c) ? "right" : "left" });
            x += ws[i];
          });
          return y + 20;
        };
        let y = testa();
        doc.font("Helvetica").fontSize(8);
        if (!f.righe.length) doc.fillColor(COL.mu).text("Nessun dato in questa tabella.", M + 4, y + 8);
        f.righe.forEach((r, k) => {
          if (y + 17 > fondo) {
            doc.addPage();
            y = testa();
            doc.font("Helvetica").fontSize(8);
          }
          if (k % 2) doc.rect(M, y, W, 17).fill(COL.riga);
          let x = M;
          doc.fillColor(COL.ink);
          f.colonne.forEach((c, i) => {
            doc.text(testo(c, r[c.k]), x + 4, y + 5, { width: ws[i] - 8, lineBreak: false, ellipsis: true, align: destra(c) ? "right" : "left" });
            x += ws[i];
          });
          y += 17;
        });
      });

      const { start, count } = doc.bufferedPageRange();
      for (let i = start; i < start + count; i++) {
        doc.switchToPage(i);
        doc.fillColor(COL.mu).font("Helvetica").fontSize(8).text(`Pagina ${i + 1} di ${count}`, M, doc.page.height - M + 4, { width: W, align: "right", lineBreak: false });
      }
      doc.end();
    });
  },
};
