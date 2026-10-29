import { esc, fmt, eur } from "../../core/utils.js";

export function barChart(monthly) {
  const months = [...new Set(monthly.map((x) => x.mese))].sort();
  if (!months.length)
    return '<div class="empty">Nessun movimento da mostrare</div>';
  const val = (m, c) =>
    monthly.find((x) => x.mese === m && x.causale === c)?.tot || 0;
  const max = Math.max(...monthly.map((x) => x.tot)) * 1.12;
  const W = 600,
    H = 230,
    L = 46,
    B = 26,
    T = 10,
    gw = (W - L - 8) / months.length,
    bw = Math.min(22, gw / 3);
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map(
      (f) =>
        `<line x1="${L}" x2="${W}" y1="${y(max * f)}" y2="${y(max * f)}" class="gl"/><text x="${L - 8}" y="${y(max * f) + 4}" text-anchor="end" class="gt">${Math.round((max * f) / 1000)}k</text>`,
    )
    .join("");
  const bars = months
    .map((m, i) => {
      const cx = L + gw * i + gw / 2,
        label = new Date(m + "-01").toLocaleDateString("it-IT", {
          month: "short",
        });
      const a = val(m, "Incasso"),
        p = val(m, "Pagamento");
      return `<rect class="c-inc bar" x="${cx - bw - 2}" y="${y(a)}" width="${bw}" height="${H - B - y(a)}" rx="6" style="--d:${i * 60}ms"><title>${label}: incassi ${eur(a)}</title></rect>
      <rect class="c-pag bar" x="${cx + 2}" y="${y(p)}" width="${bw}" height="${H - B - y(p)}" rx="6" style="--d:${i * 60 + 30}ms"><title>${label}: pagamenti ${eur(p)}</title></rect>
      <text x="${cx}" y="${H - 7}" text-anchor="middle" class="gt">${label}</text>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="svgc" role="img" aria-label="Incassi e pagamenti per mese">${grid}${bars}</svg>
    <div class="legend"><span><i class="dot c-inc"></i>Incassi</span><span><i class="dot c-pag"></i>Pagamenti</span></div>`;
}

export function donut(stati) {
  const tot = stati.reduce((a, s) => a + s.n, 0) || 1,
    r = 54,
    C = 2 * Math.PI * r;
  const col = {
    APERTO: "var(--ok)",
    CHIUSO: "var(--muted)",
    ANNULLATO: "var(--bad)",
  };
  let off = 0;
  const arcs = stati
    .map((s) => {
      const len = (s.n / tot) * C,
        el = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${col[s.stato] || "var(--accent)"}" stroke-width="16" stroke-dasharray="${Math.max(0, len - 3)} ${C}" stroke-dashoffset="${-off}" stroke-linecap="round"/>`;
      off += len;
      return el;
    })
    .join("");
  return `<div class="donut"><svg viewBox="0 0 140 140" role="img" aria-label="Documenti per stato"><g transform="rotate(-90 70 70)">${arcs}</g>
    <text x="70" y="68" text-anchor="middle" class="dn">${fmt(tot)}</text><text x="70" y="86" text-anchor="middle" class="gt">documenti</text></svg>
    <ul class="legend col">${stati.map((s) => `<li><i class="dot" style="background:${col[s.stato] || "var(--accent)"}"></i>${esc(s.stato[0] + s.stato.slice(1).toLowerCase())}<b>${fmt(s.n)}</b></li>`).join("")}</ul></div>`;
}

export function countUp(root) {
  root.querySelectorAll("[data-count]").forEach((el) => {
    const to = +el.dataset.count,
      cur = el.dataset.cur,
      f = (v) => (cur ? eur(v) : fmt(Math.round(v)));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches)
      return (el.textContent = f(to));
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 800);
      el.textContent = f(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
