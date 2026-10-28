// Fonts (Google Fonts subset) and icons (Iconify). Both work in the browser and in Node.
import { b64 } from "./github.js";

const fontCache = new Map();
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

// Returns { faces: [{ weight, mime, format, data, url }] } or null for the system font
export async function loadFont(family, weights, text) {
  if (!family || family === "system") return null;
  const key = `${family}|${weights.join(",")}|${text}`;
  if (fontCache.has(key)) return fontCache.get(key);
  const p = (async () => {
    const fam = encodeURIComponent(family).replace(/%20/g, "+");
    const t = encodeURIComponent(text);
    // Google picks the format from the User-Agent; outside the browser ask for woff2 explicitly
    const opts = typeof window === "undefined" ? { headers: { "User-Agent": UA } } : {};
    let r = await fetch(`https://fonts.googleapis.com/css2?family=${fam}:wght@${[...new Set(weights)].sort((a, b) => a - b).join(";")}&text=${t}`, opts);
    if (!r.ok) r = await fetch(`https://fonts.googleapis.com/css2?family=${fam}&text=${t}`, opts);
    if (!r.ok) throw new Error(`font ${family}`);
    const css = await r.text();
    const faces = [];
    for (const m of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
      const body = m[1];
      const weight = /font-weight:\s*([\d ]+)/.exec(body)?.[1]?.trim() ?? "400";
      const src = /url\(([^)]+)\)\s*format\('([^']+)'\)/.exec(body);
      if (!src) continue;
      faces.push({ weight, url: src[1], format: src[2] });
    }
    // One file can cover several weights (variable font)
    const byUrl = new Map();
    for (const f of faces) {
      const g = byUrl.get(f.url) ?? { ...f, weights: [] };
      g.weights.push(...f.weight.split(" ").map(Number));
      byUrl.set(f.url, g);
    }
    const out = [];
    for (const g of byUrl.values()) {
      const res = await fetch(g.url);
      const buf = new Uint8Array(await res.arrayBuffer());
      const min = Math.min(...g.weights);
      const max = Math.max(...g.weights);
      const mime = g.format === "woff2" ? "font/woff2" : g.format === "woff" ? "font/woff" : "font/ttf";
      out.push({ weight: min === max ? String(min) : `${min} ${max}`, mime, format: g.format, data: b64(buf), bytes: buf });
    }
    if (!out.length) throw new Error(`font ${family}`);
    return { family, faces: out };
  })();
  fontCache.set(key, p);
  p.catch(() => fontCache.delete(key));
  return p;
}

export function fontWeights(cfg) {
  return { b: [400, 500, 600, 700], h: [cfg.font.headingWeight, 500] };
}

// Icons
const ICON_API = "https://api.iconify.design";

function scopeIds(name, body) {
  const pre = name.replace(/[^a-z0-9]/gi, "_") + "_";
  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of ids) {
    const re = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    body = body
      .replace(new RegExp(`id="${re}"`, "g"), `id="${pre}${id}"`)
      .replace(new RegExp(`url\\(#${re}\\)`, "g"), `url(#${pre}${id})`)
      .replace(new RegExp(`href="#${re}"`, "g"), `href="#${pre}${id}"`);
  }
  return body;
}

// names: ["mdi:home", "logos:react"] -> { name: { body, w, h, palette } | null }
export async function fetchIcons(names) {
  const byPrefix = {};
  for (const n of names) {
    const [prefix, icon] = n.split(":");
    if (!prefix || !icon) continue;
    (byPrefix[prefix] ??= []).push(icon);
  }
  const out = {};
  for (const n of names) out[n] = null;
  await Promise.all(
    Object.entries(byPrefix).map(async ([prefix, icons]) => {
      try {
        const r = await fetch(`${ICON_API}/${prefix}.json?icons=${icons.join(",")}`);
        if (!r.ok) return;
        const j = await r.json();
        if (typeof j !== "object" || !j?.icons) return;
        for (const ic of icons) {
          let src = j.icons[ic];
          let extra = {};
          if (!src && j.aliases?.[ic]) {
            extra = j.aliases[ic];
            src = j.icons[extra.parent];
          }
          if (!src) continue;
          const w = src.width ?? extra.width ?? j.width ?? 16;
          const h = src.height ?? extra.height ?? j.height ?? 16;
          const body = scopeIds(`${prefix}:${ic}`, src.body);
          out[`${prefix}:${ic}`] = { body, w, h, palette: !/currentColor/.test(body) };
        }
      } catch {
        // Leave as null: the renderer draws nothing for it
      }
    }),
  );
  return out;
}

export async function searchIcons(query, prefixes, limit = 96) {
  const pre = prefixes?.length ? `&prefixes=${prefixes.join(",")}` : "";
  const r = await fetch(`${ICON_API}/search?query=${encodeURIComponent(query)}&limit=${limit}${pre}`);
  if (!r.ok) return [];
  return (await r.json()).icons ?? [];
}

export const iconPreviewUrl = (name, color) => {
  const [p, i] = name.split(":");
  return `${ICON_API}/${p}/${i}.svg?height=28${color ? `&color=${encodeURIComponent(color)}` : ""}`;
};
