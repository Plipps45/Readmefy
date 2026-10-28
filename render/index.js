import { BLOCKS } from "./blocks.js";
import { esc, makeMeasure } from "./kit.js";
import { palette, presetTheme } from "./theme.js";
import { tr } from "./lang.js";

export { BLOCKS, COMMON_FIELDS, METRICS, projectList } from "./blocks.js";
export { PRESETS, ROLES, HARMONIES, generate, presetTheme, palette } from "./theme.js";
export { makeMeasure } from "./kit.js";
export { LANGS, localizeDeep, relocalize, tr } from "./lang.js";

let seq = 0;
export const newId = (type) => `${type}-${Date.now().toString(36).slice(-4)}${(seq++).toString(36)}`;

// Default texts come out in the given README language
export function newBlock(type, login, lang = "en") {
  const def = BLOCKS[type];
  return { id: newId(type), type, hidden: false, animate: true, card: true, link: "", imgWidth: "100%", ...def.defaults(login, (s) => tr(lang, s)) };
}

export function defaultConfig(login = "", lang = "en") {
  const blocks = ["header", "socials", "typing", "about", "stack", "stats", "calendar", "streak", "title", "projects", "divider", "buttons"].map((t) => newBlock(t, login, lang));
  return {
    version: 2,
    lang,
    login,
    theme: { ...presetTheme("discord"), modes: "both" },
    font: { heading: "Unbounded", body: "Figtree", headingWeight: 700 },
    style: { width: 840, radius: 16, border: 1, bg: "solid", gradientAngle: 315, gradientStrength: 0.3, chipRadius: 10 },
    motion: { on: true, entrance: "up", speed: 1, loop: false, loopEvery: 12, decor: true },
    readme: { align: "center", prefix: "", suffix: "" },
    action: { enabled: true, cron: "17 */6 * * *" },
    blocks,
    icons: {},
    metrics: {},
  };
}

export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "x";

function makeCtx(cfg, block, data, env, theme, track) {
  const mo = { ...cfg.motion, on: !!cfg.motion.on && block.animate !== false };
  const base = (k) => {
    let n = 0;
    const tag = slug(block.id).replace(/-/g, "") + (k ?? "");
    return {
      cfg, block, data, env, theme, mo,
      p: palette(cfg.theme, theme === "dark"),
      m: env.measure,
      W: cfg.style.width,
      used: new Set(),
      shared: {},
      glyphs: {},
      key: block.id + (k ?? ""),
      uid: (p) => `${p}${tag}_${n++}`,
      wantIcon: track,
      fork: (i) => base(`k${i}`),
    };
  };
  return base();
}

export function themesOf(cfg) {
  return cfg.theme.modes === "light" ? ["light"] : cfg.theme.modes === "dark" ? ["dark"] : ["light", "dark"];
}

// Renders every block for every theme.
// Returns { parts: [{ block, items: [{ files: {light, dark}, alt, link, width, height, inline }] }], files, readme, missing, usedIcons }
export function renderProfile(cfg, data, env) {
  env = { icons: {}, ...env, measure: env.measure ?? makeMeasure(cfg.metrics) };
  const missing = new Set();
  const usedIcons = new Set();
  const track = (name) => {
    usedIcons.add(name);
    if (!(name in env.icons)) missing.add(name);
  };
  const themes = themesOf(cfg);
  const files = {};
  const parts = [];
  for (const block of cfg.blocks) {
    const def = BLOCKS[block.type];
    if (!def) continue;
    if (def.raw) {
      parts.push({ block, raw: block.content ?? "" });
      continue;
    }
    let items = null;
    for (const theme of themes) {
      let out;
      try {
        out = def.render(makeCtx(cfg, block, data, env, theme, track));
      } catch (e) {
        console.error(`Error rendering ${block.type}`, e);
        out = [];
      }
      if (!items) items = out.map(({ svg, ...o }) => ({ ...o, files: {}, svg: {} }));
      out.forEach((o, i) => {
        const name = `assets/${slug(block.id)}${o.suffix ? "-" + slug(o.suffix) : ""}-${theme}.svg`;
        if (!items[i]) return;
        items[i].files[theme] = name;
        if (!block.hidden) files[name] = o.svg;
        items[i].svg[theme] = o.svg;
      });
    }
    parts.push({ block, items: items ?? [] });
  }
  const readme = buildReadme(cfg, parts);
  return { parts, files, readme, missing, usedIcons };
}

function pic(item, themes, attrs) {
  const light = item.files.light;
  const dark = item.files.dark;
  const alt = esc(item.alt ?? "");
  if (themes.length === 2) {
    return `<picture><source media="(prefers-color-scheme: dark)" srcset="${dark}"><img src="${light}" ${attrs} alt="${alt}"></picture>`;
  }
  return `<img src="${light ?? dark}" ${attrs} alt="${alt}">`;
}

const linked = (url, inner) => (url ? `<a href="${esc(url)}">${inner}</a>` : inner);

export function buildReadme(cfg, parts) {
  const themes = themesOf(cfg);
  const out = [];
  for (const part of parts) {
    if (part.block.hidden) continue;
    if (part.raw !== undefined) {
      out.push(part.raw.trim());
      continue;
    }
    const items = part.items;
    if (!items.length) continue;
    if (items[0].inline) {
      out.push(items.map((it) => linked(it.link, pic(it, themes, `height="${it.height}"`))).join("&nbsp;"));
    } else if (items[0].row === 2) {
      for (let i = 0; i < items.length; i += 2) {
        out.push(items.slice(i, i + 2).map((it) => linked(it.link, pic(it, themes, `width="${it.width}"`))).join("&nbsp;"));
      }
    } else {
      for (const it of items) out.push(linked(it.link, pic(it, themes, `width="${it.width || "100%"}"`)));
    }
  }
  const align = cfg.readme.align;
  let body = out.join("\n\n");
  if (align === "center") body = `<div align="center">\n\n${body}\n\n</div>`;
  const pre = cfg.readme.prefix?.trim() ? cfg.readme.prefix.trim() + "\n\n" : "";
  const post = cfg.readme.suffix?.trim() ? "\n\n" + cfg.readme.suffix.trim() : "";
  return `<!-- ${tr(cfg.lang, "Generated with Readmefy. Edit .readme/config.json or regenerate it from the web.")} -->\n${pre}${body}${post}\n`;
}

// Every string the renderer may draw, so the embedded font subset covers it
export function textOf(cfg, data) {
  const out = [];
  const walk = (v) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(cfg.blocks);
  out.push(data.name ?? "", cfg.login ?? "");
  for (const r of data.repos ?? []) out.push(r.name, r.desc ?? "", r.language ?? "");
  for (const r of data.pinned ?? []) out.push(r.name, r.desc ?? "", r.language ?? "");
  for (const [l] of data.languages ?? []) out.push(l);
  out.push(data.rangeLabel ?? "");
  return out.join(" ");
}

export const BASE_CHARS =
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~" +
  "áéíóúÁÉÍÓÚñÑüÜ¿¡çÇàèìòùâêîôûäëïöÿãõ·•…—–“”‘’«»€°×";

export function charset(cfg, data) {
  const set = new Set(BASE_CHARS);
  for (const c of textOf(cfg, data)) if (c.codePointAt(0) <= 0xffff && !/[\u0000-\u001f]/.test(c)) set.add(c);
  return [...set].sort().join("");
}
