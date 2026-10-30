// CSV: separatore «;» e BOM UTF-8, si apre correttamente in Excel in italiano
const cella = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export default {
  estensione: "csv",
  mime: "text/csv; charset=utf-8",
  async crea({ fogli }) {
    const f = fogli[0];
    const righe = [f.colonne.map((c) => c.l), ...f.righe.map((r) => f.colonne.map((c) => r[c.k]))];
    return Buffer.from("\ufeff" + righe.map((r) => r.map(cella).join(";")).join("\r\n"), "utf8");
  },
};
