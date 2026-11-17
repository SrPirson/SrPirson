// Builds every theme/language variant of the profile SVGs in assets/.
// Usage: node scripts/build.mjs [lighthouse-report.json]
// Hand-written sources: assets/card-en.svg and assets/card-es.svg (dark theme).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

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
    types: { job: "job", intern: "internship", train: "training", edu: "education", proj: "project", hack: "hackathon", next: "career" }, pending: "(pending)", today: "today",
    foot: (n) => `${n} requests  ·  Finish: still loading…` },
  es: { tabs: ["Elements", "Console", "Sources", "Network", "Performance"], cols: ["Nombre", "Estado", "Tipo", "Cascada"],
    types: { job: "empleo", intern: "prácticas", train: "formación", edu: "estudios", proj: "proyecto", hack: "hackathon", next: "carrera" }, pending: "(pendiente)", today: "hoy",
    foot: (n) => `${n} peticiones  ·  Fin: aún cargando…` },
};
// [name en, name es, type, start YYYY-MM, end YYYY-MM | null = today]
const ROWS = [
  ["daw-degree", "grado-daw", "edu", "2023-09", "2025-06"],
  ["internet-sin-riesgos", "internet-sin-riesgos", "intern", "2025-03", "2025-06"],
  ["unfollowers-ig.ts", "unfollowers-ig.ts", "proj", "2025-03", "2026-08"],
  ["tfg-socialicar.php", "tfg-socialicar.php", "proj", "2025-05", "2025-06"],
  ["esplai-talent-it", "esplai-talent-it", "train", "2025-09", "2025-12"],
  ["portfolio.tsx", "portfolio.tsx", "proj", "2025-10", null],
  ["nexecare-hackathon", "hackathon-nexecare", "hack", "2025-11", "2025-11"],
  ["bnt-business-telecom", "bnt-business-telecom", "job", "2026-06", null],
  ["box-box.pwa", "box-box.pwa", "proj", "2026-10", null],
  ["cabina.tsx", "cabina.tsx", "proj", "2026-10", null],
  ["next-challenge.tsx", "siguiente-reto.tsx", "next", null, null],
];
const BAR = { job: "#22c55e", intern: "#14b8a6", train: "#a855f7", edu: "#8b5cf6", proj: "#3b82f6", hack: "#f59e0b" };
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
    if (a.score === null || a.score === 1 || a.scoreDisplayMode === "informative") continue;
    console.log(`[${k}] ${id}: ${a.title}`);
    if (k !== "performance") for (const it of (a.details?.items ?? []).slice(0, 5)) console.log(`    ${it.node?.snippet ?? JSON.stringify(it).slice(0, 200)}`);
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
// ---------- shared bits for the new sections ----------
const ACCENT = `<linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const SYNTAX = {
  dark: { key: "#7ee787", str: "#a5d6ff", kw: "#ff7b72", fn: "#d2a8ff", hash: "#e3b341", head: "#56d4dd" },
  light: { key: "#116329", str: "#0a3069", kw: "#cf222e", fn: "#8250df", hash: "#9a6700", head: "#1b7c83" },
};
const ANIM = `
    .in { opacity: 0; animation: in .5s ease-out forwards; }
    .caret { animation: blink 1s step-end infinite; }
    @keyframes in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    @keyframes blink { 50% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .in, .caret { animation: none; opacity: 1; } }`;
// window frame with a title bar: dots + centered title
const frame = (c, w, h, title, body, defs = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
  <defs>${ACCENT}<clipPath id="r"><rect width="${w}" height="${h}" rx="10"/></clipPath>${defs}</defs>
  <style>
    text { ${FONT} font-size: 14px; fill: ${c.text}; }
    .mono { ${MONO} white-space: pre; }
    .dim { fill: ${c.dim}; }${ANIM}
  </style>
  <g clip-path="url(#r)">
    <rect width="${w}" height="${h}" fill="${c.bg}"/>
    <rect width="${w}" height="34" fill="${c.panel}"/>
    <circle cx="20" cy="17" r="5" fill="#ff5f57"/><circle cx="37" cy="17" r="5" fill="#febc2e"/><circle cx="54" cy="17" r="5" fill="#28c840"/>
    <text x="${w / 2}" y="22" text-anchor="middle" class="mono dim" style="font-size:12px">${esc(title)}</text>
    ${body}
  </g>
  <rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="10" fill="none" stroke="${c.line}"/>
</svg>
`;
const each = (name, fn) => { for (const l of LANGS) for (const th of Object.keys(THEMES)) write(`${name}-${l}-${th}.svg`, fn(l, th)); };

// ---------- 4. Experience & education as `git log --graph` ----------
const LOG = [
  { scope: "feat(job)", en: "Frontend Developer @ BNT Business Telecom", es: "Desarrollador Frontend @ BNT Business Telecom",
    meta: { en: "Jun 2026 – present · Málaga, hybrid · React · IoT SaaS (vDesk, HELIoT)", es: "jun 2026 – actualidad · Málaga, híbrido · React · SaaS IoT (vDesk, HELIoT)" } },
  { scope: "feat(training)", en: "Full Stack Developer @ Fundación Esplai, Talent IT", es: "Desarrollador Full Stack @ Fundación Esplai, Talent IT",
    meta: { en: "Sep – Dec 2025 · Spring Boot · React · TypeScript · MySQL · Docker", es: "sep – dic 2025 · Spring Boot · React · TypeScript · MySQL · Docker" } },
  { scope: "feat(internship)", en: "Web Developer @ Internet Sin Riesgos", es: "Desarrollador Web @ Internet Sin Riesgos",
    meta: { en: "Mar – Jun 2025 · remote · WordPress · WooCommerce · on-page SEO", es: "mar – jun 2025 · en remoto · WordPress · WooCommerce · SEO on-page" } },
  { scope: "build(degree)", en: "Higher Technician in Web App Development (DAW) @ MEDAC", es: "Técnico Superior en Desarrollo de Aplicaciones Web @ MEDAC",
    meta: { en: "2023 – 2025", es: "2023 – 2025" } },
  { scope: "init(degree)", en: "Technician in Microcomputer Systems and Networks @ IES Belén", es: "Técnico en Sistemas Microinformáticos y Redes @ IES Belén",
    meta: { en: "2018", es: "2018" } },
];
const sha = (s) => createHash("sha1").update(s).digest("hex").slice(0, 7);
each("experience", (lang, theme) => {
  const c = THEMES[theme], s = SYNTAX[theme], RH = 58, Y0 = 70, H = Y0 + LOG.length * RH + 6;
  const rows = LOG.map((e, i) => {
    const y = Y0 + i * RH, d = `style="animation-delay:${0.2 + i * 0.25}s"`;
    const head = i === 0 ? `<tspan style="fill:${s.head}">(HEAD -&gt; main)</tspan> ` : "";
    return `<g class="in" ${d}>
      <circle cx="34" cy="${y}" r="6" fill="${i === 0 ? "url(#accent)" : c.bg}" stroke="${i === 0 ? "none" : s.fn}" stroke-width="2"/>
      <text x="56" y="${y + 5}" class="mono"><tspan style="fill:${s.hash}">${sha(e.en)}</tspan> ${head}<tspan style="fill:${s.kw}">${e.scope}:</tspan> <tspan style="font-weight:600">${esc(e[lang])}</tspan></text>
      <text x="56" y="${y + 27}" class="dim" style="font-size:13px">${esc(e.meta[lang])}</text>
    </g>`;
  }).join("\n    ");
  return frame(c, 840, H, "~/francisco — git log --graph", `
    <text x="20" y="54" class="mono"><tspan style="fill:${s.key}">$</tspan> git log --graph --oneline</text>
    <line x1="34" y1="${Y0}" x2="34" y2="${Y0 + (LOG.length - 1) * RH}" stroke="${s.fn}" stroke-opacity=".5" stroke-width="2"/>
    ${rows}`);
});

// ---------- 5. Featured projects as clickable cards ----------
export const PROJECTS = [
  { id: "portfolio", url: "pirson.dev", title: "Portfolio", stack: ["React", "Vite", "Tailwind"],
    en: ["My personal site: projects, experience", "and certifications, in two languages."],
    es: ["Mi web personal: proyectos, experiencia", "y certificaciones, en dos idiomas."] },
  { id: "box-box", url: "github.com/SrPirson/Box-Box", title: "Box Box", stack: ["PWA", "Node.js", "Socket.io"],
    en: ["PWA for race teams: live comms, lap", "timing and telemetry, pit wall to driver."],
    es: ["PWA para equipos de carreras: radio,", "cronometraje y telemetría muro-piloto."] },
  { id: "unfollowers", url: "unfollowers-ig-extension.vercel.app", title: "Instagram Unfollowers", stack: ["TypeScript", "Manifest V3"],
    en: ["Browser extension that shows who doesn't", "follow you back. Light/dark, 10 languages."],
    es: ["Extensión que muestra quién no te sigue", "de vuelta. Modo claro/oscuro, 10 idiomas."] },
  { id: "cleanworld", url: "github.com/SrPirson/TerraDev_CleanWorld", title: "CleanWorld", stack: ["React", "TypeScript", "Spring Boot"],
    en: ["Full stack app for cleanup services,", "built end to end at Fundación Esplai."],
    es: ["App full stack de servicios de limpieza,", "hecha de principio a fin en Fundación Esplai."] },
  { id: "cabina", url: "github.com/SrPirson/cabina", title: "cabina", stack: ["TypeScript", "Claude Code"],
    en: ["Side pane for Claude Code: model,", "context, limits and cost at a glance."],
    es: ["Panel lateral para Claude Code: modelo,", "contexto, límites y coste de un vistazo."] },
  { id: "webeyes", url: "github.com/SrPirson/webeyes", title: "webeyes", stack: ["Python", "Claude Code"],
    en: ["Claude Code plugin that lets the agent", "watch and summarize videos."],
    es: ["Plugin de Claude Code para que el agente", "vea y resuma vídeos."] },
];
const CHIP = { light: ["#e0f2fe", "#0369a1", "#e0e7ff", "#4338ca", "#ccfbf1", "#0f766e"], dark: ["#0c2d48", "#7dd3fc", "#1e1b4b", "#a5b4fc", "#042f2e", "#5eead4"] };
for (const p of PROJECTS) each(`project-${p.id}`, (lang, theme) => {
  const c = THEMES[theme], ch = CHIP[theme];
  let x = 20;
  const chips = p.stack.map((t, i) => {
    const w = t.length * 7.4 + 22, g = `<rect x="${x}" y="136" width="${w}" height="22" rx="11" fill="${ch[i * 2]}"/><text x="${x + w / 2}" y="151" text-anchor="middle" style="font-size:12px; fill:${ch[i * 2 + 1]}">${t}</text>`;
    x += w + 8; return g;
  }).join("");
  return frame(c, 410, 172, p.url, `
    <rect x="0" y="34" width="410" height="3" fill="url(#accent)"/>
    <g class="in" style="animation-delay:.15s">
      <text x="20" y="72" style="font-size:20px; font-weight:700">${esc(p.title)}</text>
      <text x="390" y="72" text-anchor="end" style="font-size:16px; fill:#6366f1">↗</text>
      <text x="20" y="100" class="dim">${esc(p[lang][0])}</text>
      <text x="20" y="120" class="dim">${esc(p[lang][1])}</text>
      ${chips}
    </g>`);
});

// ---------- 6. Tech stack as a package.json ----------
const STACK = {
  dependencies: [["react", "^19.2.0"], ["typescript", "*"], ["tailwindcss", "^4.1.14"], ["vite", "^7.1.7"], ["motion", "^12.35.1"], ["react-router-dom", "^7.9.3"], ["i18next", "^25.6.0"], ["radix-ui", "^1.4.3"]],
  peerDependencies: [["java", "*"], ["spring-boot", "*"], ["php", "*"], ["laravel", "*"], ["node", "*"], ["express", "*"]],
  devDependencies: [["git", "*"], ["docker", "*"], ["mysql", "*"], ["postgresql", "*"], ["swagger", "*"], ["junit", "*"], ["wordpress", "*"]],
};
const SCRIPTS = {
  en: [["dev", "design && build interfaces"], ["build", "ship accessible UIs"], ["test", "review && iterate"]],
  es: [["dev", "diseñar && construir interfaces"], ["build", "publicar UIs accesibles"], ["test", "revisar && iterar"]],
};
each("stack", (lang, th) => {
  const c = THEMES[th], s = SYNTAX[th], LH = 21;
  const line = (x, y, k, v, comma, i) => `<text x="${x}" y="${y}" class="mono in" style="animation-delay:${(0.1 + i * 0.04).toFixed(2)}s">${" ".repeat(4)}<tspan style="fill:${s.key}">"${k}"</tspan>: <tspan style="fill:${s.str}">"${esc(v)}"</tspan>${comma ? "," : ""}</text>`;
  const block = (x, y0, name, list, last, i0) => {
    const out = [`<text x="${x}" y="${y0}" class="mono in" style="animation-delay:${(0.1 + i0 * 0.04).toFixed(2)}s">  <tspan style="fill:${s.key}">"${name}"</tspan>: {</text>`];
    list.forEach(([k, v], j) => out.push(line(x, y0 + (j + 1) * LH, k, v, j < list.length - 1, i0 + j + 1)));
    out.push(`<text x="${x}" y="${y0 + (list.length + 1) * LH}" class="mono">  }${last ? "" : ","}</text>`);
    return out.join("\n    ");
  };
  const Y = 76, H = Y + 19 * LH + 4; // right column: 6 peer + 7 dev rows + braces
  const body = `
    <text x="20" y="${Y - 18}" class="mono">{</text>
    <text x="20" y="${Y + 3}" class="mono">  <tspan style="fill:${s.key}">"name"</tspan>: <tspan style="fill:${s.str}">"francisco-cortes-pirson"</tspan>,</text>
    <text x="20" y="${Y + 3 + LH}" class="mono">  <tspan style="fill:${s.key}">"role"</tspan>: <tspan style="fill:${s.str}">"frontend"</tspan>,</text>
    ${block(20, Y + 3 + 2 * LH, "dependencies", STACK.dependencies, false, 0)}
    ${block(20, Y + 3 + 12 * LH, "scripts", SCRIPTS[lang], false, 10)}
    ${block(440, Y + 3, "peerDependencies", STACK.peerDependencies, false, 4)}
    ${block(440, Y + 3 + 8 * LH, "devDependencies", STACK.devDependencies, true, 12)}
    <text x="20" y="${H - 14}" class="mono">}</text>`;
  return frame(c, 840, H, "package.json", body);
});

// ---------- 7. Buttons and console footer ----------
const BUTTONS = {
  portfolio: { en: "pirson.dev ↗", es: "pirson.dev ↗" },
  linkedin: { en: "LinkedIn ↗", es: "LinkedIn ↗" },
  cv: { en: "Download CV ↓", es: "Descargar CV ↓" },
};
for (const [id, label] of Object.entries(BUTTONS)) each(`button-${id}`, (lang, theme) => {
  const c = THEMES[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="48" viewBox="0 0 200 48" role="img" aria-label="${esc(label[lang])}">
  <defs>${ACCENT}</defs>
  <rect x="1" y="1" width="198" height="46" rx="23" fill="${id === "portfolio" ? "url(#accent)" : c.bg}" stroke="url(#accent)" stroke-width="2"/>
  <text x="100" y="30" text-anchor="middle" style="${FONT} font-size:15px; font-weight:600; fill:${id === "portfolio" ? "#fff" : c.text}">${esc(label[lang])}</text>
</svg>
`;
});
const BYE = { en: "Thanks for stopping by. Let's build something great together.", es: "Gracias por pasarte. Construyamos algo increíble juntos." };
each("footer", (lang, theme) => {
  const c = THEMES[theme], s = SYNTAX[theme];
  return frame(c, 840, 112, "console", `
    <text x="20" y="62" class="mono in" style="animation-delay:.2s"><tspan style="fill:#3b82f6">&gt;</tspan> console.<tspan style="fill:${s.fn}">log</tspan>(<tspan style="fill:${s.str}">"${esc(BYE[lang])}"</tspan>)</text>
    <text x="20" y="90" class="mono in" style="animation-delay:.9s"><tspan style="fill:#3b82f6">&gt;</tspan> <tspan class="caret" style="fill:#22d3ee">▍</tspan></text>`);
});

console.log("built assets");
