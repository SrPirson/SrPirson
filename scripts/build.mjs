// Builds every theme/language variant of the profile SVGs in assets/.
// Usage: node scripts/build.mjs [lighthouse-report.json]
// Hand-written sources: assets/card-en.svg and assets/card-es.svg (dark theme).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";

const dir = new URL("../assets/", import.meta.url);
const read = (f) => readFileSync(new URL(f, dir), "utf8");
const write = (f, s) => writeFileSync(new URL(f, dir), s);
const LANGS = ["en", "es"];
const THEMES = {
  dark: { bg: "#0d1117", panel: "#161b22", line: "#30363d", text: "#e6edf3", dim: "#8b949e" },
  light: { bg: "#ffffff", panel: "#f6f8fa", line: "#d0d7de", text: "#1f2328", dim: "#57606a" },
};
// single quotes: these also go inside style="" attributes
const FONT = `font-family: 'Segoe UI', Inter, 'DejaVu Sans', Arial, sans-serif;`;
const MONO = `font-family: Consolas, 'JetBrains Mono', 'DejaVu Sans Mono', monospace;`;

// ---------- 1. Card: light variant of the hand-written dark card ----------
const CARD_LIGHT = {
  "#0d1117": "#ffffff", "#161b22": "#f6f8fa", "#30363d": "#d0d7de", "#e6edf3": "#1f2328",
  "#484f58": "#8c959f", "#8b949e": "#57606a", "#ff7b72": "#cf222e", "#a5d6ff": "#0a3069",
  "#7ee787": "#116329", "#d2a8ff": "#8250df", "#c9d1d9": "#1f2328",
};
for (const l of LANGS) {
  write(`card-${l}-light.svg`, read(`card-${l}.svg`).replace(/#[0-9a-f]{6}\b/gi, (c) => CARD_LIGHT[c.toLowerCase()] ?? c));
}

// ---------- 2. Career timeline drawn as the DevTools Network panel ----------
const NET = {
  en: { tabs: ["Elements", "Console", "Sources", "Network", "Performance"], cols: ["Name", "Status", "Type", "Waterfall"],
    types: { edu: "education", proj: "project", hack: "hackathon", next: "career" }, pending: "(pending)", today: "today",
    foot: (n) => `${n} requests  ·  Finish: still loading…` },
  es: { tabs: ["Elements", "Console", "Sources", "Network", "Performance"], cols: ["Nombre", "Estado", "Tipo", "Cascada"],
    types: { edu: "formación", proj: "proyecto", hack: "hackathon", next: "carrera" }, pending: "(pendiente)", today: "hoy",
    foot: (n) => `${n} peticiones  ·  Fin: aún cargando…` },
};
// [name en, name es, type, start YYYY-MM, end YYYY-MM | null = today]
const ROWS = [
  ["daw-degree", "grado-daw", "edu", "2023-09", "2025-06"],
  ["unfollowers-ig.ts", "unfollowers-ig.ts", "proj", "2025-03", "2026-08"],
  ["tfg-socialicar.php", "tfg-socialicar.php", "proj", "2025-05", "2025-06"],
  ["java-bootcamp", "bootcamp-java", "edu", "2025-09", "2025-11"],
  ["portfolio.tsx", "portfolio.tsx", "proj", "2025-10", null],
  ["nexecare-hackathon", "hackathon-nexecare", "hack", "2025-11", "2025-11"],
  ["terradev-cleanworld", "terradev-cleanworld", "proj", "2025-12", "2026-04"],
  ["box-box.pwa", "box-box.pwa", "proj", "2026-10", null],
  ["cabina.tsx", "cabina.tsx", "proj", "2026-10", null],
  ["next-role.tsx", "siguiente-puesto.tsx", "next", null, null],
];
const BAR = { edu: "#8b5cf6", proj: "#3b82f6", hack: "#f59e0b" };
const now = new Date();
const months = (ym) => { const [y, m] = ym.split("-").map(Number); return y * 12 + m - 1; };
const NOW = now.getFullYear() * 12 + now.getMonth();
const M0 = months("2023-09"), M1 = NOW + 7;
const WX = 420, WW = 396; // waterfall column
const xOf = (m) => WX + ((m - M0) / (M1 - M0)) * WW;
assert.equal(xOf(M0), WX);
assert.equal(xOf(M1), WX + WW);

function network(lang, theme) {
  const t = NET[lang], c = THEMES[theme], RH = 26, Y0 = 62, H = Y0 + ROWS.length * RH + 32;
  const ticks = [];
  for (let y = 2024; y * 12 < M1; y++) {
    const x = xOf(y * 12).toFixed(1);
    ticks.push(`<line x1="${x}" y1="36" x2="${x}" y2="${H - 30}" stroke="${c.line}"/><text x="${+x + 4}" y="54" class="dim">${y}</text>`);
  }
  const rows = ROWS.map(([en, es, type, start, end], i) => {
    const y = Y0 + i * RH, pend = type === "next";
    const a = start ? months(start) : NOW, b = pend ? M1 : (end ? months(end) : NOW) + 1;
    const x = xOf(a), w = Math.max(xOf(b) - x, 5);
    const bar = pend
      ? `<rect class="bar pend" x="${x.toFixed(1)}" y="${y + 8}" width="${w.toFixed(1)}" height="10" rx="2" fill="url(#stripes)" style="animation-delay:${i * 0.15}s,${i * 0.15 + 0.6}s"/>`
      : `<rect class="bar" x="${x.toFixed(1)}" y="${y + 8}" width="${w.toFixed(1)}" height="10" rx="2" fill="${BAR[type]}" style="animation-delay:${i * 0.15}s"/>`;
    return `<rect x="0" y="${y}" width="840" height="${RH}" fill="${i % 2 ? c.panel : c.bg}"/>
    <text x="16" y="${y + 17}" class="mono">${lang === "en" ? en : es}</text>
    <text x="214" y="${y + 17}" class="${pend ? "dim" : ""}">${pend ? t.pending : "200"}</text>
    <text x="304" y="${y + 17}" class="dim">${t.types[type]}</text>${bar}`;
  }).join("\n    ");
  const tx = xOf(NOW + now.getDate() / 31).toFixed(1);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="${H}" viewBox="0 0 840 ${H}" role="img" aria-label="${lang === "en" ? "Career timeline drawn as a browser DevTools Network panel" : "Trayectoria dibujada como el panel Network de DevTools"}">
  <defs>
    <clipPath id="r"><rect width="840" height="${H}" rx="10"/></clipPath>
    <pattern id="stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="${c.dim}" fill-opacity=".25"/><rect width="4" height="8" fill="${c.dim}" fill-opacity=".6"/>
    </pattern>
  </defs>
  <style>
    text { ${FONT} font-size: 13px; fill: ${c.text}; }
    .mono { ${MONO} }
    .dim { fill: ${c.dim}; }
    .bar { transform-box: fill-box; transform-origin: left; transform: scaleX(0); animation: grow .6s ease-out forwards; }
    .pend { animation: grow .6s ease-out forwards, pulse 1.6s ease-in-out infinite; }
    @keyframes grow { to { transform: scaleX(1); } }
    @keyframes pulse { 50% { opacity: .45; } }
    @media (prefers-reduced-motion: reduce) { .bar, .pend { animation: none; transform: none; } }
  </style>
  <g clip-path="url(#r)">
    <rect width="840" height="${H}" fill="${c.bg}"/>
    <rect width="840" height="36" fill="${c.panel}"/>
    ${t.tabs.map((n, i) => `<text x="${16 + i * 96}" y="23" class="${n === "Network" ? "" : "dim"}">${n}</text>`).join("")}
    <rect x="${16 + 3 * 96 - 6}" y="33" width="70" height="3" fill="#3b82f6"/>
    <rect y="36" width="840" height="26" fill="${c.bg}"/>
    <text x="16" y="54" class="dim">${t.cols[0]}</text><text x="214" y="54" class="dim">${t.cols[1]}</text><text x="304" y="54" class="dim">${t.cols[2]}</text>
    ${rows}
    ${ticks.join("\n    ")}
    <line x1="${tx}" y1="36" x2="${tx}" y2="${H - 30}" stroke="#ef4444" stroke-width="1.5"/>
    <text x="${+tx - 4}" y="${H - 36}" text-anchor="end" style="fill:#ef4444; font-size:11px">${t.today}</text>
    <line x1="0" y1="62" x2="840" y2="62" stroke="${c.line}"/>
    <line x1="0" y1="${H - 30}" x2="840" y2="${H - 30}" stroke="${c.line}"/>
    <rect y="${H - 30}" width="840" height="30" fill="${c.panel}"/>
    <text x="16" y="${H - 11}" class="dim">${t.foot(ROWS.length)}</text>
  </g>
  <rect x=".5" y=".5" width="839" height="${H - 1}" rx="10" fill="none" stroke="${c.line}"/>
</svg>
`;
}
for (const l of LANGS) for (const th of Object.keys(THEMES)) write(`network-${l}-${th}.svg`, network(l, th));

// ---------- 3. Lighthouse scores of pirson.dev ----------
const report = process.argv[2];
if (report) {
  const { categories: cats, audits } = JSON.parse(readFileSync(report, "utf8"));
  for (const [k, cat] of Object.entries(cats)) for (const { id } of cat.auditRefs) {
    const a = audits[id];
    if (a.score !== null && a.score < 1 && a.scoreDisplayMode !== "informative") console.log(`[${k}] ${id}: ${a.title}`);
  }
  const score = (k) => Math.round((cats[k]?.score ?? 0) * 100);
  write("lighthouse.json", JSON.stringify({
    date: now.toISOString().slice(0, 10),
    scores: { performance: score("performance"), accessibility: score("accessibility"), "best-practices": score("best-practices"), seo: score("seo") },
  }, null, 2) + "\n");
}
const LH = {
  en: { labels: ["Performance", "Accessibility", "Best Practices", "SEO"], updated: "Updated" },
  es: { labels: ["Rendimiento", "Accesibilidad", "Prácticas recomendadas", "SEO"], updated: "Actualizado" },
};
const scoreColor = (s) => (s >= 90 ? "#0cce6b" : s >= 50 ? "#ffa400" : "#ff4e42"); // Lighthouse's own bands
assert.equal(scoreColor(90), "#0cce6b"); assert.equal(scoreColor(89), "#ffa400"); assert.equal(scoreColor(49), "#ff4e42");

function lighthouse({ date, scores }, lang, theme) {
  const t = LH[lang], c = THEMES[theme];
  const gauges = Object.values(scores).map((s, i) => {
    const col = scoreColor(s);
    return `<g transform="translate(${135 + i * 190},96)">
      <circle r="36" fill="${col}" fill-opacity=".12"/>
      <circle r="36" fill="none" stroke="${col}" stroke-opacity=".2" stroke-width="7"/>
      <circle class="arc" r="36" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" transform="rotate(-90)" pathLength="100" stroke-dasharray="${s} 100" style="animation-delay:${i * 0.15}s"/>
      <text y="10" text-anchor="middle" style="font-size:${s === 100 ? 24 : 28}px; font-weight:600; fill:${col}">${s}</text>
      <text y="64" text-anchor="middle">${t.labels[i]}</text>
    </g>`;
  }).join("\n    ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="190" viewBox="0 0 840 190" role="img" aria-label="Lighthouse pirson.dev: ${Object.entries(scores).map(([k, v]) => `${k} ${v}`).join(", ")}">
  <style>
    text { ${FONT} font-size: 14px; fill: ${c.text}; }
    .dim { fill: ${c.dim}; font-size: 12px; }
    .arc { animation: fill 1.2s ease-out both; }
    @keyframes fill { from { stroke-dasharray: 0 100; } }
    @media (prefers-reduced-motion: reduce) { .arc { animation: none; } }
  </style>
  <rect x=".5" y=".5" width="839" height="189" rx="10" fill="${c.bg}" stroke="${c.line}"/>
  <text x="20" y="30" style="font-weight:600">Lighthouse · <tspan style="${MONO}">pirson.dev</tspan></text>
  <text x="820" y="30" text-anchor="end" class="dim">desktop · ${t.updated} ${date}</text>
    ${gauges}
</svg>
`;
}
if (existsSync(new URL("lighthouse.json", dir))) {
  const data = JSON.parse(read("lighthouse.json"));
  for (const l of LANGS) for (const th of Object.keys(THEMES)) write(`lighthouse-${l}-${th}.svg`, lighthouse(data, l, th));
}
console.log("built assets");
