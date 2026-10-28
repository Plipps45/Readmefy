// Shared drawing helpers. No DOM access: this file also runs inside the GitHub Action (Node).

// Text
export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export const n1 = (v) => (Math.round(v * 10) / 10).toString();

// metrics = { b: { "400": { "a": 0.52, ... } }, h: { "700": {...} } } measured at 1px
export function makeMeasure(metrics) {
  const pick = (role, weight) => {
    const set = metrics?.[role] || metrics?.b;
    if (!set) return null;
    const keys = Object.keys(set);
    if (!keys.length) return null;
    const k = keys.reduce((a, b) => (Math.abs(b - weight) < Math.abs(a - weight) ? b : a));
    return set[k];
  };
  return (s, size, weight = 400, role = "b") => {
    const t = pick(role, weight);
    let w = 0;
    for (const c of String(s)) w += t?.[c] ?? (c === " " ? 0.28 : 0.56);
    return w * size;
  };
}

export function wrap(m, s, size, width, weight = 400, role = "b", lines = 2) {
  const out = [];
  let cur = "";
  for (const word of String(s).split(/\s+/).filter(Boolean)) {
    const trial = cur ? `${cur} ${word}` : word;
    if (m(trial, size, weight, role) <= width || !cur) cur = trial;
    else {
      out.push(cur);
      cur = word;
    }
  }
  if (cur) out.push(cur);
  if (out.length > lines) {
    out.length = lines;
    out[lines - 1] = fit(m, out[lines - 1] + " …", size, width, weight, role);
  }
  return out.map((l) => fit(m, l, size, width, weight, role));
}

export function fit(m, s, size, width, weight = 400, role = "b") {
  s = String(s ?? "");
  if (m(s, size, weight, role) <= width) return s;
  let t = s;
  while (t.length > 1 && m(t + "…", size, weight, role) > width) t = t.slice(0, -1);
  return t.trimEnd() + "…";
}

// Color
export function hex(c) {
  c = String(c || "#000").trim();
  if (/^#[0-9a-f]{3}$/i.test(c)) c = "#" + [...c.slice(1)].map((x) => x + x).join("");
  return /^#[0-9a-f]{6}$/i.test(c) ? c.toLowerCase() : "#000000";
}

export function rgb(c) {
  const h = hex(c);
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function mix(a, b, t) {
  const pa = rgb(a);
  const pb = rgb(b);
  return "#" + pa.map((x, i) => Math.round(x + (pb[i] - x) * t).toString(16).padStart(2, "0")).join("");
}

export function luminance(c) {
  const [r, g, b] = rgb(c).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const readableOn = (bg) => (luminance(bg) > 0.42 ? "#111111" : "#ffffff");

export function toHsl(c) {
  let [r, g, b] = rgb(c).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

export function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}

// Seeded random, so decorations stay identical between renders
export function rng(seed) {
  let s = 0;
  for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shapes: cut paper. Older configs may still name removed shapes, so unknown kinds fall back to a circle.
export const SHAPES = ["circle", "square", "rounded", "stamp", "ticket", "arch", "hexagon"];

const SHAPE_ALIAS = { squircle: "rounded", flower: "stamp", cookie: "stamp", clover: "circle", burst: "stamp", star: "stamp", gear: "stamp", blob: "circle" };
export const shapeOf = (kind) => (SHAPES.includes(kind) ? kind : SHAPE_ALIAS[kind] ?? "circle");

function polygon(cx, cy, r, n, rot = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const u = (2 * Math.PI * i) / n - Math.PI / 2 + rot;
    pts.push(`${n1(cx + r * Math.cos(u))} ${n1(cy + r * Math.sin(u))}`);
  }
  return "M" + pts.join("L") + "Z";
}

function roundedRect(cx, cy, r, k = 0.3) {
  const x = cx - r;
  const y = cy - r;
  const s = 2 * r;
  const q = r * k * 2;
  return `M${n1(x + q)} ${n1(y)}H${n1(x + s - q)}Q${n1(x + s)} ${n1(y)} ${n1(x + s)} ${n1(y + q)}V${n1(y + s - q)}Q${n1(x + s)} ${n1(y + s)} ${n1(x + s - q)} ${n1(y + s)}H${n1(x + q)}Q${n1(x)} ${n1(y + s)} ${n1(x)} ${n1(y + s - q)}V${n1(y + q)}Q${n1(x)} ${n1(y)} ${n1(x + q)} ${n1(y)}Z`;
}

// Postage stamp: a square whose edges are bitten by perforation holes.
// Walking clockwise, sweep-flag 0 bends each bite towards the inside.
function stampPath(cx, cy, r, n = 9) {
  const s = 2 * r;
  const pitch = s / n;
  const br = pitch * 0.3;
  const x0 = cx - r;
  const y0 = cy - r;
  const corners = [[x0, y0, 1, 0], [x0 + s, y0, 0, 1], [x0 + s, y0 + s, -1, 0], [x0, y0 + s, 0, -1]];
  let d = `M${n1(x0)} ${n1(y0)}`;
  for (const [sx, sy, dx, dy] of corners) {
    for (let i = 0; i < n; i++) {
      const c = pitch * (i + 0.5);
      d += `L${n1(sx + dx * (c - br))} ${n1(sy + dy * (c - br))}`;
      d += `A${n1(br)} ${n1(br)} 0 0 0 ${n1(sx + dx * (c + br))} ${n1(sy + dy * (c + br))}`;
    }
    d += `L${n1(sx + dx * s)} ${n1(sy + dy * s)}`;
  }
  return d + "Z";
}

// Ticket: a rectangle with quarter-round notches punched out of every corner
export function ticketPath(x, y, w, h, notch) {
  const q = notch;
  return `M${n1(x + q)} ${n1(y)}H${n1(x + w - q)}A${n1(q)} ${n1(q)} 0 0 0 ${n1(x + w)} ${n1(y + q)}V${n1(y + h - q)}A${n1(q)} ${n1(q)} 0 0 0 ${n1(x + w - q)} ${n1(y + h)}H${n1(x + q)}A${n1(q)} ${n1(q)} 0 0 0 ${n1(x)} ${n1(y + h - q)}V${n1(y + q)}A${n1(q)} ${n1(q)} 0 0 0 ${n1(x + q)} ${n1(y)}Z`;
}

function archPath(cx, cy, r) {
  return `M${n1(cx - r)} ${n1(cy + r)}V${n1(cy)}A${n1(r)} ${n1(r)} 0 0 1 ${n1(cx + r)} ${n1(cy)}V${n1(cy + r)}Z`;
}

export function shapePath(kind, cx, cy, r) {
  kind = shapeOf(kind);
  if (kind === "square") return `M${n1(cx - r)} ${n1(cy - r)}h${n1(2 * r)}v${n1(2 * r)}h${n1(-2 * r)}Z`;
  if (kind === "rounded") return roundedRect(cx, cy, r, 0.16);
  if (kind === "stamp") return stampPath(cx, cy, r);
  if (kind === "ticket") return ticketPath(cx - r, cy - r, 2 * r, 2 * r, r * 0.22);
  if (kind === "arch") return archPath(cx, cy, r);
  if (kind === "hexagon") return polygon(cx, cy, r, 6, Math.PI / 6);
  return `M${n1(cx - r)} ${n1(cy)}a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0Z`;
}

// Icons. env.icons: { "logos:react": { body, w, h, palette } }
const BRAND_COLORS = {
  github: "#181717", x: "#000000", twitter: "#1d9bf0", linkedin: "#0a66c2", discord: "#5865f2", telegram: "#26a5e4",
  instagram: "#e4405f", youtube: "#ff0000", twitch: "#9146ff", tiktok: "#000000", reddit: "#ff4500", mastodon: "#6364ff",
  bluesky: "#0285ff", dev: "#0a0a0a", medium: "#000000", gmail: "#ea4335", mail: "#ea4335", email: "#ea4335",
  spotify: "#1db954", steam: "#1b2838", kofi: "#ff5e5b", "ko-fi": "#ff5e5b", patreon: "#ff424d", facebook: "#0866ff",
  whatsapp: "#25d366", stackoverflow: "#f58025", codepen: "#000000", dribbble: "#ea4c89", behance: "#1769ff",
  hashnode: "#2962ff", leetcode: "#ffa116", kaggle: "#20beff", npm: "#cb3837", gitlab: "#fc6d26", buymeacoffee: "#ffdd00",
  threads: "#000000", pinterest: "#bd081c", snapchat: "#fffc00", figma: "#f24e1e", notion: "#000000", paypal: "#003087",
};

export function brandColor(name) {
  const n = String(name).split(":").pop().toLowerCase().replace(/-icon$|-fill$|-line$/g, "");
  for (const [k, v] of Object.entries(BRAND_COLORS)) if (n === k || n.startsWith(k)) return v;
  return null;
}

// Single-color twin of a multicolor logo (logos:typescript-icon -> simple-icons:typescript)
const MONO_ALIASES = { nodejs: "nodedotjs", "c-sharp": "dotnet", "c-plusplus": "cplusplus", "html-5": "html5", "css-3": "css", "linux-tux": "linux", nextjs: "nextdotjs", vue: "vuedotjs" };

function monoTwin(name) {
  const [prefix, raw] = name.split(":");
  if (!["logos", "devicon", "skill-icons", "vscode-icons"].includes(prefix)) return null;
  const base = raw.replace(/^file-type-/, "").replace(/-(icon|original|plain|wordmark|light|dark)$/g, "").replace(/-(icon|original|plain|wordmark|light|dark)$/g, "");
  return `simple-icons:${MONO_ALIASES[base] ?? base}`;
}

export function icon(ctx, name, x, y, size, color, mono = false) {
  if (!name) return "";
  ctx.wantIcon(name);
  let ic = ctx.env.icons?.[name];
  if (mono && ic?.palette) {
    const twin = monoTwin(name);
    if (twin) {
      ctx.wantIcon(twin);
      if (ctx.env.icons?.[twin]) ic = ctx.env.icons[twin];
    }
  }
  if (!ic) return "";
  let body = ic.body;
  if (mono && ic.palette) body = body.replace(/(fill|stroke|stop-color)="(?!none)[^"]*"/g, '$1="currentColor"');
  // Multicolor logos may leave some paths unfilled (black by default): draw those in the text color
  const col = ic.palette && !mono ? ctx.p.text : color;
  return `<svg x="${n1(x)}" y="${n1(y)}" width="${n1(size)}" height="${n1(size)}" viewBox="0 0 ${ic.w} ${ic.h}" color="${col}" fill="currentColor" overflow="visible">${body}</svg>`;
}

// Motion. Entrances ease out on a long tail; continuous decor is slow and small so the card stays calm.
// Row pitch of the odometer digit column, in em; the gap keeps neighbouring digits well outside the clip window
const ODO_LH = 1.25;

const FROM = {
  up: "opacity:0;transform:translateY(18px)",
  press: "opacity:0;transform:translateY(18px)",
  pop: "opacity:0;transform:scale(.9)",
  left: "opacity:0;transform:translateX(-26px)",
  blur: "opacity:0;filter:blur(8px)",
  fade: "opacity:0",
};

function motionCss(mo) {
  if (!mo.on) return "*{animation:none!important}";
  const k = 1 / (mo.speed || 1);
  const ease = "cubic-bezier(.16,1,.3,1)";
  let css = "";
  const from = FROM[mo.entrance];
  if (from) {
    if (mo.loop) {
      const P = Math.max(4, mo.loopEvery || 10);
      const a = Math.min(40, ((0.8 * k) / P) * 100).toFixed(2);
      css += `@keyframes in{0%{${from};animation-timing-function:${ease}}${a}%,90%{opacity:1;transform:none;filter:none}97%,100%{opacity:0}}`;
      css += `.e{transform-box:fill-box;transform-origin:center;animation:in ${P}s infinite both}`;
    } else {
      css += `@keyframes in{from{${from}}to{opacity:1;transform:none;filter:none}}`;
      css += `.e{transform-box:fill-box;transform-origin:center;animation:in ${(0.8 * k).toFixed(2)}s ${ease} both}`;
    }
  }
  css +=
    `.gx{transform-box:fill-box;transform-origin:left center;animation:gx ${(0.9 * k).toFixed(2)}s ${ease} both}` +
    `.gy{transform-box:fill-box;transform-origin:center bottom;animation:gy ${(0.8 * k).toFixed(2)}s ${ease} both}` +
    `.dg{transform-box:fill-box;transform-origin:center;animation:dg ${(0.6 * k).toFixed(2)}s ${ease} both}` +
    `@keyframes gx{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes gy{from{transform:scaleY(0)}to{transform:scaleY(1)}}` +
    `@keyframes dg{from{transform:scale(0)}to{transform:scale(1)}}` +
    `.ro{animation:ro ${(1.6 * k).toFixed(2)}s cubic-bezier(.3,.9,.2,1) both}`;
  for (let d = 0; d <= 9; d++) css += `.r${d}{animation-name:r${d}}@keyframes r${d}{from{transform:translateY(0)}to{transform:translateY(-${d * ODO_LH}em)}}`;
  if (mo.decor) {
    css +=
      `.fl{transform-box:fill-box;transform-origin:center;animation:fl ${(9 * k).toFixed(1)}s ease-in-out infinite}` +
      `.tw{animation:tw ${(2.4 * k).toFixed(1)}s ease-in-out infinite}` +
      `.ping{transform-box:fill-box;transform-origin:center;animation:ping ${(2.4 * k).toFixed(1)}s cubic-bezier(0,0,.2,1) infinite}` +
      `@keyframes fl{0%,100%{transform:translate(0,0)}50%{transform:translate(4px,-7px)}}` +
      `@keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}` +
      `@keyframes ping{0%{transform:scale(1);opacity:.55}80%,100%{transform:scale(2.1);opacity:0}}`;
  }
  css += "@media (prefers-reduced-motion:reduce){*{animation:none!important}}";
  return css;
}

// Class + delay attributes for an entrance-animated group
export function enter(ctx, delay = 0) {
  if (!ctx.mo.on || ctx.mo.entrance === "none") return "";
  const d = delay / (ctx.mo.speed || 1);
  return ` class="e" style="animation-delay:${d.toFixed(2)}s"`;
}

export function delayStyle(ctx, delay) {
  return `animation-delay:${(delay / (ctx.mo.speed || 1)).toFixed(2)}s`;
}

// SMIL is not affected by CSS, so it is left out entirely when motion is off
export function smil(ctx, s, decor = true) {
  if (!ctx.mo.on || (decor && !ctx.mo.decor)) return "";
  return s;
}

export function txt(ctx, x, y, s, size, fill, o = {}) {
  const role = o.role ?? "b";
  const weight = o.weight ?? (role === "h" ? ctx.cfg.font.headingWeight : 400);
  useFont(ctx, role, weight, s);
  let attrs = `x="${n1(x)}" y="${n1(y)}" font-size="${n1(size)}" font-weight="${weight}" fill="${fill}"`;
  if (o.anchor && o.anchor !== "start") attrs += ` text-anchor="${o.anchor}"`;
  if (role !== "b") attrs += ` class="${role}"`;
  if (o.ls) attrs += ` letter-spacing="${o.ls}"`;
  if (o.opacity !== undefined) attrs += ` opacity="${o.opacity}"`;
  if (o.italic) attrs += ` font-style="italic"`;
  return `<text ${attrs}>${esc(s)}</text>`;
}

const STACK = "'Segoe UI',system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,'SFMono-Regular',Consolas,'Liberation Mono',monospace";

export function useFont(ctx, role, weight, text = "") {
  ctx.used.add(role);
  ctx.used.add(`${role}:${weight}`);
  const g = (ctx.glyphs[role] ??= new Set());
  for (const c of String(text)) g.add(c);
}

function fontCss(ctx) {
  const f = ctx.env.fontsFor?.(ctx.key) ?? ctx.env.fonts ?? {};
  let css = "";
  // Embed only the faces this svg draws with
  const face = (fam, role, src) => {
    if (!src || !ctx.used.has(role)) return "";
    const wanted = [...ctx.used].filter((u) => u.startsWith(role + ":")).map((u) => +u.split(":")[1]);
    const range = (x) => x.weight.split(" ").map(Number);
    const pick = new Set();
    for (const w of wanted) {
      const hit = src.faces.find((x) => {
        const [a, b = a] = range(x);
        return w >= a && w <= b;
      });
      pick.add(hit ?? src.faces.reduce((a, x) => (Math.abs(range(x)[0] - w) < Math.abs(range(a)[0] - w) ? x : a)));
    }
    return [...pick]
      .map((x) => `@font-face{font-family:${fam};src:url(data:${x.mime};base64,${x.data}) format('${x.format}');font-weight:${x.weight}}`)
      .join("");
  };
  css += face("PFB", "b", f.b);
  css += face("PFH", "h", f.h);
  const fb = ctx.cfg.font.body === "system" ? STACK : `PFB,${STACK}`;
  const fh = ctx.cfg.font.heading === "system" ? STACK : `PFH,PFB,${STACK}`;
  css += `text{font-family:${fb}}.h{font-family:${fh}}.m{font-family:${MONO}}`;
  return css;
}

export function svgDoc(ctx, w, h, body, title, extraCss = "") {
  // Collect the glyphs and weights of this svg so the export can embed a per-file font subset
  if (ctx.env.collect) {
    const slot = (ctx.env.collect[ctx.key] ??= { b: { chars: new Set(), weights: new Set() }, h: { chars: new Set(), weights: new Set() } });
    for (const role of ["b", "h"]) {
      for (const c of ctx.glyphs[role] ?? []) slot[role].chars.add(c);
      for (const u of ctx.used) if (u.startsWith(role + ":")) slot[role].weights.add(+u.split(":")[1]);
    }
  }
  const css = fontCss(ctx) + motionCss(ctx.mo) + extraCss;
  const defs = ctx.shared.defs ? `<defs>${ctx.shared.defs}</defs>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${n1(w)}" height="${n1(h)}" viewBox="0 0 ${n1(w)} ${n1(h)}" fill="none" role="img" aria-label="${esc(title)}">` +
    `<title>${esc(title)}</title><style>${css}</style>${defs}${body}</svg>`
  );
}

// Accent gradient, shared per svg. In box units it spans whatever it fills; with decor motion the colours flow.
export function grad(ctx, a = ctx.p.accent, b = ctx.p.accent2) {
  const key = `gr${a}${b}`;
  if (ctx.shared[key]) return `url(#${ctx.shared[key]})`;
  const id = ctx.uid("gr");
  const flow = smil(ctx, `<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="2 0" dur="${(9 / (ctx.mo.speed || 1)).toFixed(1)}s" repeatCount="indefinite"/>`);
  ctx.shared.defs = (ctx.shared.defs ?? "") + `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0" spreadMethod="reflect"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>${flow}</linearGradient>`;
  ctx.shared[key] = id;
  return `url(#${id})`;
}

// Same gradient over a fixed horizontal span, for text drawn in pieces (rolling digits)
export function gradSpan(ctx, x0, x1) {
  const id = ctx.uid("gs");
  ctx.shared.defs = (ctx.shared.defs ?? "") + `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n1(x0)}" y1="0" x2="${n1(x1)}" y2="0"><stop offset="0" stop-color="${ctx.p.accent}"/><stop offset="1" stop-color="${ctx.p.accent2}"/></linearGradient>`;
  return `url(#${id})`;
}

// Text in a palette role, or in the accent gradient when the role is "gradient"
export function inkText(ctx, role, x, y, s, size, o = {}) {
  const fill = role === "gradient" ? grad(ctx) : ctx.p[role] ?? ctx.p.accent;
  return txt(ctx, x, y, s, size, fill, o);
}

// Rounded bar that grows in from the left
export function bar(ctx, x, y, w, h, fill, delay = 0) {
  const cls = ctx.mo.on ? ` class="gx" style="${delayStyle(ctx, delay)}"` : "";
  return `<rect${cls} x="${n1(x)}" y="${n1(y)}" width="${n1(Math.max(0, w))}" height="${n1(h)}" rx="${n1(h / 2)}" fill="${fill}"/>`;
}

// Amplitude-modulated halftone. The dot screen is drawn in the red channel (radial-gradient cells) and the
// density field in the green channel; screen-blending keeps both, and one colour matrix thresholds R + G,
// so every dot grows with the density underneath it. The result is tinted with a single colour.
// field: svg drawn in greens (#00ff00 = full coverage) using density() fills or coverage filters.
export function screen(ctx, { x, y, w, h, color, pitch = 8, angle = 45, field, clip = "" }) {
  const id = ctx.uid("ht");
  let defs = "";
  if (!ctx.shared.dot) {
    ctx.shared.dot = ctx.uid("hd");
    defs += `<radialGradient id="${ctx.shared.dot}" cx=".5" cy=".5" r=".7071"><stop offset="0" stop-color="#f00"/><stop offset="1" stop-color="#000"/></radialGradient>`;
  }
  const [r, g, b] = rgb(color).map((v) => (v / 255).toFixed(3));
  defs +=
    `<pattern id="${id}p" width="${n1(pitch)}" height="${n1(pitch)}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><rect width="${n1(pitch)}" height="${n1(pitch)}" fill="url(#${ctx.shared.dot})"/></pattern>` +
    `<filter id="${id}f" x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">` +
    `<feColorMatrix values="12 12 0 0 -12 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1"/>` +
    `<feColorMatrix values="0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 1 0 0 0 0"/></filter>`;
  return defs + `<g filter="url(#${id}f)"${clip}><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" fill="url(#${id}p)"/><g style="mix-blend-mode:screen">${field}</g></g>`;
}

// Density gradient for screen(): stops [[offset, coverage 0..1]]. Returns [defs, fill]
export function density(ctx, kind, attrs, stops, anim = "") {
  const id = ctx.uid("dn");
  const st = stops.map(([o, v]) => `<stop offset="${o}" stop-color="${green(v)}"/>`).join("");
  const tag = kind === "radial" ? "radialGradient" : "linearGradient";
  return [`<${tag} id="${id}" gradientUnits="userSpaceOnUse" ${attrs}>${st}${anim}</${tag}>`, `url(#${id})`];
}

export const green = (v) => `#00${Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")}00`;

// Filter turning a photo into halftone coverage (green channel): dark areas on light cards, light areas on dark.
// lift/gain shape the curve so the second colour can take only the shadows.
export function coverage(ctx, dark, gain = 1.2, lift = 0) {
  const id = ctx.uid("cv");
  const row = dark ? ".2126 .7152 .0722 0 0" : "-.2126 -.7152 -.0722 0 1";
  return [
    `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 0 ${row} 0 0 0 0 0 0 0 0 1 0"/><feComponentTransfer><feFuncG type="linear" slope="${gain}" intercept="${lift}"/></feComponentTransfer></filter>`,
    id,
  ];
}

// Soft radial light: [defs, fill]. Opacity falls off to nothing at the edge.
export function glow(ctx, cx, cy, r, color, op = 0.5, anim = "") {
  const id = ctx.uid("gl");
  return [
    `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset=".55" stop-color="${color}" stop-opacity="${(op * 0.35).toFixed(3)}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>${anim}</radialGradient>`,
    `url(#${id})`,
  ];
}

// Card. "screen" and "gradient" are older keys for the lit card.
export function cardBg(ctx, w, h, o = {}) {
  const { p, cfg } = ctx;
  const st = cfg.style;
  const r = o.radius ?? st.radius;
  const bw = st.border;
  let kind = o.kind ?? st.bg;
  if (kind === "none") return "";
  if (kind === "screen" || kind === "gradient") kind = "glow";
  const half = bw / 2;
  const stroke = bw > 0 || kind === "outline" ? ` stroke="${p.border}" stroke-width="${Math.max(bw, 1)}"` : "";
  let s = `<rect x="${half}" y="${half}" width="${n1(w - bw)}" height="${n1(h - bw)}" rx="${r}" fill="${kind === "outline" ? "none" : p.bg}"${stroke}/>`;
  if (kind === "glow" && !o.plain) {
    const strength = st.gradientStrength ?? 0.3;
    const a = ((st.gradientAngle ?? 315) * Math.PI) / 180;
    const cx = w / 2 + (Math.cos(a) * w) / 2;
    const cy = h / 2 + (Math.sin(a) * h) / 2;
    const R = Math.min(w, Math.max(h, 320)) * 0.8;
    const [d1, f1] = glow(ctx, cx, cy, R, p.accent, Math.min(0.7, strength + (p.dark ? 0.05 : 0)));
    const [d2, f2] = glow(ctx, w - cx, h - cy, R * 0.7, p.accent2, strength * 0.5);
    const id = ctx.uid("pc");
    s += `<clipPath id="${id}"><rect width="${n1(w)}" height="${n1(h)}" rx="${r}"/></clipPath>${d1}${d2}`;
    s += `<g clip-path="url(#${id})"><rect width="${n1(w)}" height="${n1(h)}" fill="${f1}"/><rect width="${n1(w)}" height="${n1(h)}" fill="${f2}"/></g>`;
  }
  return s;
}

export function clipCard(ctx, w, h, inner) {
  const id = ctx.uid("cc");
  return `<clipPath id="${id}"><rect width="${n1(w)}" height="${n1(h)}" rx="${ctx.cfg.style.radius}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
}

// Tinted rounded square holding an icon
export function badge(ctx, x, y, size, ic, color = ctx.p.accent) {
  const { p } = ctx;
  const r = Math.min(size * 0.3, Math.max(4, (ctx.cfg.style.chipRadius ?? 10) * 1.1));
  const isz = size * 0.58;
  return `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(size)}" height="${n1(size)}" rx="${n1(r)}" fill="${tint(p, color)}"/>` + icon(ctx, ic, x + (size - isz) / 2, y + (size - isz) / 2, isz, color, true);
}

export const tint = (p, color, k = 1) => mix(p.bg, color, (p.dark ? 0.2 : 0.12) * k);

// Section title: icon badge, then the heading
export function sectionTitle(ctx, x, y, title, ic, delay = 0) {
  const { p } = ctx;
  const size = 22;
  const hw = ctx.cfg.font.headingWeight;
  const tx = ic ? x + 50 : x;
  const t = fit(ctx.m, title, size, ctx.W - tx - 40, hw, "h");
  let s = "";
  if (ic) s += `<g${enter(ctx, delay)}>${badge(ctx, x, y, 38, ic)}</g>`;
  s += `<g${enter(ctx, delay + 0.05)}>${txt(ctx, tx, y + 27, t, size, p.text, { role: "h" })}</g>`;
  return s;
}

// Pill with optional icon. Returns [svg, width]
export function chip(ctx, x, y, label, o = {}) {
  const { p } = ctx;
  const h = o.h ?? 36;
  const size = o.size ?? 15;
  const pad = o.pad ?? 13;
  const isz = o.iconSize ?? 18;
  const iw = o.icon ? isz + 8 : 0;
  const tw = label ? ctx.m(label, size, 600) : 0;
  const w = o.w ?? (label ? pad * 2 + iw + tw : h);
  const variant = o.variant ?? "tonal";
  let bg;
  let fg;
  let stroke = "";
  let icFill = o.iconColor ?? p.accent;
  const r = o.radius ?? Math.min(h / 2, ctx.cfg.style.chipRadius ?? 10);
  if (variant === "filled") {
    bg = o.bg ?? p.accent;
    fg = o.fg ?? readableOn(bg);
    icFill = o.iconColor ?? fg;
  } else if (variant === "outline") {
    bg = "none";
    fg = p.text;
    stroke = ` stroke="${p.border}" stroke-width="1.5"`;
  } else {
    bg = tint(p, o.tint ?? p.accent);
    fg = p.text;
  }
  const shape = o.ticket
    ? `<path d="${ticketPath(x + 0.6, y + 0.6, w - 1.2, h - 1.2, Math.min(7, h * 0.2))}" fill="${bg}"${stroke}/>`
    : `<rect x="${n1(x + 0.75)}" y="${n1(y + 0.75)}" width="${n1(w - 1.5)}" height="${n1(h - 1.5)}" rx="${r}" fill="${bg}"${stroke}/>`;
  let body = shape;
  const ix = label ? x + pad : x + (w - isz) / 2;
  if (o.icon) body += icon(ctx, o.icon, ix, y + (h - isz) / 2, isz, icFill, o.mono ?? false);
  if (label) body += txt(ctx, x + pad + iw, y + h / 2 + size * 0.35, label, size, fg, { weight: 600 });
  return [`<g${enter(ctx, o.delay ?? 0)}>${body}</g>`, w];
}

// Typing engine. phrases: [{ lines: [{ text, x, y }] }]
// Every line is revealed with a clip rect whose width steps per character.
export function typing(ctx, phrases, o) {
  const { size, weight = 400, role = "b", fill, cursor = "bar", cursorColor, cps = 14, pause = 1.6, loop = true } = o;
  const m = ctx.m;
  const step = 1 / cps;
  const del = step / 2;
  const id = ctx.uid("ty");
  const textOf = (l) => txt(ctx, l.x, l.y, l.text, size, fill, { role, weight });
  if (!ctx.mo.on) {
    return phrases[0].lines.map(textOf).join("");
  }
  const lead = 0.4;
  // Timeline points per phrase
  const slots = phrases.map((ph) => {
    const n = ph.lines.reduce((a, l) => a + [...l.text].length, 0);
    const type = n * step;
    const hold = loop || phrases.length > 1 ? pause : 0;
    const back = loop || phrases.length > 1 ? n * del : 0;
    return { n, type, hold, back, len: type + hold + back + (loop ? 0.35 : 0) };
  });
  const many = loop || phrases.length > 1;
  const total = lead + slots.reduce((a, s) => a + s.len, 0);
  const kt = (t) => (t / total).toFixed(5);
  const cw = (l) => {
    const acc = [0];
    let w = 0;
    for (const c of l.text) {
      w += m(c, size, weight, role);
      acc.push(w);
    }
    return acc;
  };
  let out = "";
  const curPts = [];
  let t0 = lead;
  phrases.forEach((ph, pi) => {
    const s = slots[pi];
    const lineW = ph.lines.map(cw);
    const starts = [];
    let acc = 0;
    for (const l of ph.lines) {
      starts.push(acc);
      acc += [...l.text].length;
    }
    // revealed count -> per line width
    const widthAt = (li, k) => lineW[li][Math.max(0, Math.min(lineW[li].length - 1, k - starts[li]))];
    const frames = []; // [t, k]
    frames.push([0, 0]);
    for (let k = 0; k <= s.n; k++) frames.push([t0 + k * step, k]);
    if (many) {
      const back0 = t0 + s.type + s.hold;
      for (let k = s.n - 1; k >= 0; k--) frames.push([back0 + (s.n - k) * del, k]);
    }
    ph.lines.forEach((l, li) => {
      const cid = `${id}${pi}_${li}`;
      const vals = frames.map(([, k]) => n1(widthAt(li, k) + (widthAt(li, k) > 0 ? 2 : 0)));
      const times = frames.map(([t]) => kt(t));
      out += `<clipPath id="${cid}"><rect x="${n1(l.x - 2)}" y="${n1(l.y - size * 1.1)}" width="0" height="${n1(size * 1.5)}"><animate attributeName="width" values="${vals.join(";")}" keyTimes="${times.join(";")}" calcMode="discrete" dur="${total.toFixed(2)}s" ${many ? 'repeatCount="indefinite"' : 'fill="freeze"'}/></rect></clipPath>`;
      out += `<g clip-path="url(#${cid})">${textOf(l)}</g>`;
    });
    for (const [t, k] of frames.slice(1)) {
      let li = ph.lines.findIndex((_, i) => k <= starts[i] + [...ph.lines[i].text].length);
      if (li < 0) li = ph.lines.length - 1;
      const l = ph.lines[li];
      curPts.push([t, l.x + widthAt(li, k) + 2, l.y]);
    }
    t0 += s.len;
  });
  if (cursor !== "none") {
    const first = phrases[0].lines[0];
    const pts = [[0, first.x, first.y], ...curPts];
    const times = pts.map(([t]) => kt(t)).join(";");
    const cw2 = cursor === "block" ? size * 0.55 : cursor === "underscore" ? size * 0.6 : Math.max(2, size * 0.1);
    const ch = cursor === "underscore" ? Math.max(2, size * 0.1) : size * 1.1;
    const dy = cursor === "underscore" ? size * 0.12 : -size * 0.88;
    const xs = pts.map(([, x]) => n1(x)).join(";");
    const ys = pts.map(([, , y]) => n1(y + dy)).join(";");
    out +=
      `<rect x="${n1(first.x)}" y="${n1(first.y + dy)}" width="${n1(cw2)}" height="${n1(ch)}" rx="${n1(Math.min(cw2, ch) / 3)}" fill="${cursorColor ?? fill}" opacity="${cursor === "block" ? 0.7 : 1}">` +
      `<animate attributeName="x" values="${xs}" keyTimes="${times}" calcMode="discrete" dur="${total.toFixed(2)}s" ${many ? 'repeatCount="indefinite"' : 'fill="freeze"'}/>` +
      `<animate attributeName="y" values="${ys}" keyTimes="${times}" calcMode="discrete" dur="${total.toFixed(2)}s" ${many ? 'repeatCount="indefinite"' : 'fill="freeze"'}/>` +
      `<animate attributeName="fill-opacity" values="1;0" calcMode="discrete" dur="1s" repeatCount="indefinite"/>` +
      `</rect>`;
  }
  return out;
}

// Rolling digits (odometer). Text baseline at y.
export function odometer(ctx, x, y, value, size, fill, o = {}) {
  const str = String(value);
  const role = o.role ?? "h";
  const weight = o.weight ?? ctx.cfg.font.headingWeight;
  if (!ctx.mo.on || !o.roll) return txt(ctx, x, y, str, size, fill, { role, weight, anchor: o.anchor });
  useFont(ctx, role, weight, str + "0123456789");
  const total = ctx.m(str, size, weight, role);
  let cx = o.anchor === "middle" ? x - total / 2 : o.anchor === "end" ? x - total : x;
  const id = ctx.uid("od");
  const lh = size * ODO_LH;
  // Only the vertical edges hide the other digits; the sides get room for glyphs that overhang their advance (the flag of a "1")
  const pad = size * 0.4;
  let out = `<clipPath id="${id}"><rect x="${n1(cx - pad)}" y="${n1(y - size * 1.05)}" width="${n1(total + pad * 2)}" height="${n1(size * 1.32)}"/></clipPath><g clip-path="url(#${id})" font-size="${n1(size)}">`;
  let i = 0;
  for (const c of str) {
    const w = ctx.m(c, size, weight, role);
    if (/\d/.test(c)) {
      const d = +c;
      const col = Array.from({ length: 10 }, (_, k) => `<tspan x="${n1(cx)}" dy="${k ? n1(lh) : 0}">${k}</tspan>`).join("");
      const del = ((o.delay ?? 0) + i * 0.08) / (ctx.mo.speed || 1);
      out += `<g class="ro r${d}" style="animation-delay:${del.toFixed(2)}s;font-size:${n1(size)}px"><text y="${n1(y)}" font-weight="${weight}" fill="${fill}"${role !== "b" ? ` class="${role}"` : ""}>${col}</text></g>`;
    } else {
      out += txt(ctx, cx, y, c, size, fill, { role, weight });
    }
    cx += w;
    i++;
  }
  return out + "</g>";
}

export function shortNum(n) {
  n = Number(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (n >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(n);
}
