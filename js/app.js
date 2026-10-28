import {
  BLOCKS, COMMON_FIELDS, HARMONIES, LANGS, PRESETS, ROLES, charset, defaultConfig, generate, localizeDeep, newBlock, presetTheme, relocalize, renderProfile, slug, themesOf,
} from "../render/index.js";
import { fetchIcons, fontWeights, loadFont } from "../render/assets.js";
import { demoData, loadData, toDataUrl } from "../render/github.js";
import { renderFinal } from "../render/pipeline.js";
import { buildForm, h, iconImg } from "./forms.js";
import { pickIcon } from "./iconpicker.js";
import { TEMPLATES } from "./templates.js";
import { makeZip } from "./zip.js";
import { hydrateIcons, ui } from "./ui-icons.js";
import { inspectRepo, installFiles } from "./install.js";
import { applyStatic, getLang, setLang, t } from "./i18n.js";

const $ = (s) => document.querySelector(s);

const FONTS = [
  "Unbounded", "Figtree", "Geist", "Onest", "Plus Jakarta Sans", "Outfit", "Inter", "Manrope", "Sora", "Space Grotesk", "DM Sans",
  "Bricolage Grotesque", "Instrument Sans", "Lexend", "Urbanist", "Poppins", "Montserrat", "Rubik", "Nunito", "Syne", "Fredoka",
  "Quicksand", "Righteous", "Bebas Neue", "Anton", "Archivo Black", "Archivo", "Bowlby One", "Dela Gothic One", "Rubik Mono One",
  "Big Shoulders Display", "Familjen Grotesk", "Chivo", "Raleway", "Playfair Display", "Lora", "Merriweather", "Gloock", "Pacifico",
  "Caveat", "Orbitron", "Fraunces", "IBM Plex Sans", "JetBrains Mono", "Fira Code", "Space Mono", "IBM Plex Mono", "Source Code Pro", "Press Start 2P", "VT323", "Silkscreen",
];

const ACTION_CRONS = [
  ["17 * * * *", "Every hour"],
  ["17 */6 * * *", "Every 6 hours"],
  ["17 */12 * * *", "Every 12 hours"],
  ["17 3 * * *", "Once a day"],
];

// ───────────────────────── State
const S = {
  cfg: null,
  data: demoData("", getLang()),
  avatar: null,
  icons: {},
  fonts: { key: "", chars: "", b: null, h: null },
  sel: null,
  tab: "blocks",
  theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  view: "preview",
  device: "desktop",
  token: sessionStorage.getItem("pf:token") ?? "",
  out: null,
};

function load() {
  try {
    const raw = localStorage.getItem("pf:cfg");
    if (raw) return migrate(JSON.parse(raw));
  } catch {}
  return defaultConfig("", getLang());
}

// Fill fields added in newer versions
function migrate(c) {
  // Configs saved before languages existed were written in Spanish
  const lang = c.lang ?? "es";
  const base = defaultConfig(c.login ?? "", lang);
  const out = { ...base, ...c, lang };
  for (const k of ["font", "style", "motion", "readme", "action"]) out[k] = { ...base[k], ...(c[k] ?? {}) };
  out.theme = { ...base.theme, ...(c.theme ?? {}) };
  out.blocks = (c.blocks ?? base.blocks)
    .filter((b) => BLOCKS[b.type])
    .map((b) => ({ ...newBlock(b.type, out.login, lang), ...b }));
  if ((c.version ?? 1) < 2) modernize(out, base);
  return out;
}

// Version 1 printed everything as a risograph; carry those configs over to the current look
const PRINT_PRESETS = new Set(["riso", "teal", "federal", "verde", "violeta", "burdeos", "rosa", "amarillo", "kraft", "negro"]);
const PRINT_FONTS = new Set(["Archivo Black", "Bowlby One", "Alfa Slab One", "Rubik Mono One"]);

function modernize(out, base) {
  out.version = base.version;
  if (PRINT_PRESETS.has(out.theme.preset)) out.theme = { ...base.theme, modes: out.theme.modes };
  if (PRINT_FONTS.has(out.font.heading)) out.font = { ...base.font };
  const st = out.style;
  if (st.radius <= 6) st.radius = base.style.radius;
  if (st.chipRadius <= 3) st.chipRadius = base.style.chipRadius;
  if (st.bg === "screen" || st.bg === "gradient") st.bg = "solid";
  if (out.motion.entrance === "press") out.motion.entrance = "up";
  for (const b of out.blocks) {
    if (b.type === "header") {
      if (["halftone", "bands", "marks"].includes(b.decor)) b.decor = "glow";
      if (["offset", "stamp"].includes(b.ring)) b.ring = "glow";
      if (b.print === "duotone") b.print = "photo";
    }
    if (b.type === "socials" && b.style === "ticket") b.style = "chip";
    if (b.type === "calendar" && b.cell === "halftone") b.cell = "rounded";
    if (b.type === "divider" && ["perforation", "registration", "colorbar"].includes(b.style)) Object.assign(b, { style: "glow", color: "gradient" });
    if (b.type === "marquee" && b.sep === "mdi:asterisk") b.sep = "mdi:star-four-points";
  }
}

try {
  S.icons = JSON.parse(localStorage.getItem("pf:icons") ?? "{}");
} catch {}
S.cfg = load();

// History
const hist = { past: [], future: [], last: JSON.stringify(S.cfg), timer: 0 };

function commit(structural = false) {
  clearTimeout(hist.timer);
  hist.timer = setTimeout(() => {
    const now = JSON.stringify(S.cfg);
    if (now === hist.last) return;
    hist.past.push(hist.last);
    if (hist.past.length > 120) hist.past.shift();
    hist.future = [];
    hist.last = now;
    save();
    paintHistory();
  }, structural ? 0 : 450);
  schedule();
}

function save() {
  try {
    const { icons, metrics, ...rest } = S.cfg;
    localStorage.setItem("pf:cfg", JSON.stringify({ ...rest, metrics }));
  } catch {}
}

function restore(json) {
  S.cfg = migrate(JSON.parse(json));
  // The editor language wins over the one stored in history or in an imported file
  relocalize(S.cfg, S.cfg.lang, getLang());
  hist.last = json;
  save();
  if (S.sel && !S.cfg.blocks.find((b) => b.id === S.sel)) S.sel = null;
  paintAll();
  schedule();
}

function undo() {
  if (!hist.past.length) return;
  hist.future.push(JSON.stringify(S.cfg));
  restore(hist.past.pop());
  paintHistory();
}

function redo() {
  if (!hist.future.length) return;
  hist.past.push(JSON.stringify(S.cfg));
  restore(hist.future.pop());
  paintHistory();
}

function paintHistory() {
  $("#undo").disabled = !hist.past.length;
  $("#redo").disabled = !hist.future.length;
}

// ───────────────────────── Rendering
let renderTimer = 0;
let busy = false;

function schedule(delay = 120) {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderNow, delay);
}

async function ensureFonts() {
  const c = S.cfg;
  const key = `${c.font.body}|${c.font.heading}|${c.font.headingWeight}`;
  const text = charset(c, S.data);
  const have = new Set(S.fonts.chars);
  const missing = [...text].some((ch) => !have.has(ch));
  if (key === S.fonts.key && !missing) {
    // A template, undo or import can bring a config without measurements for the fonts already loaded
    c.metrics = S.fonts.metrics;
    return false;
  }
  const chars = [...new Set(S.fonts.key === key ? S.fonts.chars + text : text)].sort().join("");
  setStatus(t("Loading fonts…"));
  const w = fontWeights(c);
  const [b, hh] = await Promise.all([
    loadFont(c.font.body, w.b, chars).catch(() => null),
    loadFont(c.font.heading, w.h, chars).catch(() => null),
  ]);
  if (c.font.body !== "system" && !b) toast(t("Font “{name}” was not found on Google Fonts", { name: c.font.body }));
  if (c.font.heading !== "system" && !hh) toast(t("Font “{name}” was not found on Google Fonts", { name: c.font.heading }));
  S.fonts = { key, chars, b, h: hh, metrics: await measureFonts(c, b, hh, chars) };
  c.metrics = S.fonts.metrics;
  setStatus("");
  return true;
}

// Per-character advance widths at 1px, measured with the real font
async function measureFonts(c, b, hh, chars) {
  const canvas = document.createElement("canvas").getContext("2d");
  const out = {};
  const reg = async (fam, src) => {
    if (!src) return null;
    const name = `PF-${fam}-${Math.random().toString(36).slice(2, 7)}`;
    for (const f of src.faces) {
      const face = new FontFace(name, f.bytes, { weight: f.weight });
      await face.load();
      document.fonts.add(face);
    }
    return `"${name}"`;
  };
  const stack = "'Segoe UI',system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif";
  const fb = (await reg("b", b)) ?? stack;
  const fh = (await reg("h", hh)) ?? stack;
  const w = fontWeights(c);
  for (const [role, fam, weights] of [["b", fb, w.b], ["h", fh, w.h]]) {
    out[role] = {};
    for (const wt of new Set(weights)) {
      canvas.font = `${wt} 100px ${fam}`;
      const t = {};
      for (const ch of chars) t[ch] = Math.round(canvas.measureText(ch).width * 10) / 1000;
      out[role][wt] = t;
    }
  }
  return out;
}

async function renderNow() {
  if (busy) return schedule(80);
  busy = true;
  try {
    await ensureFonts();
    if (avatarSource() !== S.avatarSrc) await loadAvatar();
    const env = { icons: S.icons, fonts: { b: S.fonts.b, h: S.fonts.h }, avatar: S.avatar };
    let out = renderProfile(S.cfg, S.data, env);
    // Fetched icons can ask for more (single-color twins of logos), hence the loop
    for (let round = 0; out.missing.size && round < 3; round++) {
      Object.assign(S.icons, await fetchIcons([...out.missing]));
      try {
        localStorage.setItem("pf:icons", JSON.stringify(S.icons));
      } catch {}
      out = renderProfile(S.cfg, S.data, env);
    }
    S.out = out;
    paintPreview();
  } catch (e) {
    console.error(e);
    toast(t("Render error: ") + e.message);
  } finally {
    busy = false;
  }
}

// ───────────────────────── Preview
const urlCache = new Map(); // svg string -> blob url

function blobUrl(svg) {
  let u = urlCache.get(svg);
  if (!u) {
    u = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    urlCache.set(svg, u);
  }
  return u;
}

function gcUrls(keep) {
  for (const [svg, u] of urlCache) {
    if (!keep.has(svg)) {
      URL.revokeObjectURL(u);
      urlCache.delete(svg);
    }
  }
}

let marked = null;
async function md(text) {
  try {
    marked ??= (await import("https://cdn.jsdelivr.net/npm/marked@12.0.2/lib/marked.esm.js")).marked;
    return marked.parse(text);
  } catch {
    return `<pre>${text.replace(/</g, "&lt;")}</pre>`;
  }
}

let paintSeq = 0;

async function paintPreview() {
  const out = S.out;
  if (!out) return;
  const seq = ++paintSeq;
  const fresh = [];
  const frame = $("#frame");
  frame.dataset.theme = S.theme;
  frame.dataset.device = S.device;
  $("#readme-code").value = out.readme;
  paintFiles();
  const themes = themesOf(S.cfg);
  const theme = themes.includes(S.theme) ? S.theme : themes[0];
  const body = $("#md");
  const keep = new Set();
  const nodes = [];
  for (const part of out.parts) {
    if (part.block.hidden) continue;
    const wrap = h("div", { class: "part" + (part.block.id === S.sel ? " sel" : ""), "data-id": part.block.id });
    wrap.addEventListener("click", (e) => {
      if (e.target.closest("a")) e.preventDefault();
      select(part.block.id);
    });
    wrap.append(h("span", { class: "part-tag" }, t(BLOCKS[part.block.type].label)));
    if (part.raw !== undefined) {
      const div = h("div", { class: "raw" });
      div.innerHTML = await md(part.raw);
      wrap.append(div);
    } else {
      const rows = [];
      const items = part.items;
      if (items[0]?.inline) rows.push(items);
      else if (items[0]?.row === 2) for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
      else for (const it of items) rows.push([it]);
      for (const r of rows) {
        const p = h("p", {});
        r.forEach((it, i) => {
          const svg = it.svg[theme];
          keep.add(svg);
          // Unchanged svgs keep their <img>, so editing one block does not replay every animation
          const old = imgCache.get(`${part.block.id}:${items.indexOf(it)}`);
          let img = old;
          if (!old || old.__svg !== svg) {
            img = h("img", { src: blobUrl(svg), alt: it.alt ?? "" });
            img.__svg = svg;
            fresh.push(img);
          }
          // Reserve the final size before the image loads, so the layout (and scroll position) never collapses
          const [, sw, sh] = /width="([\d.]+)" height="([\d.]+)"/.exec(svg) ?? [];
          img.removeAttribute("width");
          img.removeAttribute("height");
          if (sw && sh) img.style.aspectRatio = `${sw} / ${sh}`;
          if (it.inline) {
            img.setAttribute("height", it.height);
            if (sw && sh) img.setAttribute("width", Math.round((it.height * sw) / sh));
          } else img.setAttribute("width", it.width || "100%");
          imgCache.set(`${part.block.id}:${items.indexOf(it)}`, img);
          p.append(it.link ? h("a", { href: it.link }, img) : img);
          if (i < r.length - 1) p.append(document.createTextNode(" "));
        });
        wrap.append(p);
      }
    }
    nodes.push(wrap);
  }
  // Swapping in undecoded svg images can leave Chromium's animation clock stuck at frame 0
  await Promise.all(fresh.map((i) => i.decode().catch(() => {})));
  if (seq !== paintSeq) return;
  const scroller = $("#view-preview");
  const top = scroller.scrollTop;
  body.replaceChildren(...nodes);
  scroller.scrollTop = top;
  body.classList.toggle("center", S.cfg.readme.align === "center");
  gcUrls(keep);
  $("#login-label").textContent = S.cfg.login || t("your-username");
  paintInkbar(theme);
  $("#mode-warn").hidden = themes.includes(S.theme);
}
const imgCache = new Map();

// Palette strip above the preview: the colours of the profile in the theme on screen
const INKBAR = [["bg", "Background"], ["text", "Text"], ["accent", "Accent"], ["accent2", "Accent 2"], ["accent3", "Accent 3"]];

function paintInkbar(theme) {
  const pal = S.cfg.theme[theme] ?? S.cfg.theme.light;
  $("#inkbar").replaceChildren(
    ...INKBAR.map(([k, l]) => h("span", { class: "ink" }, h("i", { style: `--c:${pal[k]}` }), h("small", {}, t(l)))),
  );
}

function openColors() {
  S.tab = "style";
  paintTabs();
  const fold = $("#fold-colors");
  if (fold) {
    fold.open = true;
    fold.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

function replay() {
  imgCache.clear();
  for (const u of urlCache.values()) URL.revokeObjectURL(u);
  urlCache.clear();
  paintPreview();
}

function paintFiles() {
  const list = $("#files-list");
  const files = S.out.files;
  let total = 0;
  const rows = Object.entries(files).map(([k, v]) => {
    total += v.length;
    return h("li", {}, h("span", {}, k), h("span", { class: "muted" }, kb(v.length)));
  });
  list.replaceChildren(h("li", { class: "head" }, h("span", {}, t("{n} SVG files (preview)", { n: rows.length })), h("span", {}, kb(total))), ...rows);
}

const kb = (n) => (n > 1048576 ? (n / 1048576).toFixed(2) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");

// ───────────────────────── Sidebar: blocks
function select(id) {
  S.sel = id;
  S.tab = "blocks";
  paintTabs();
  paintBlocks();
  document.querySelectorAll(".part").forEach((p) => p.classList.toggle("sel", p.dataset.id === id));
  if (id) document.querySelector(`.part[data-id="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function removeBlock(id) {
  const i = S.cfg.blocks.findIndex((b) => b.id === id);
  if (i < 0) return;
  const label = t(BLOCKS[S.cfg.blocks[i].type].label);
  S.cfg.blocks.splice(i, 1);
  commit(true);
  if (S.sel === id) select(null);
  else paintBlocks();
  toast(t("“{name}” deleted (Ctrl+Z to undo)", { name: label }));
}

const formCtx = {
  onChange: (structural) => commit(structural),
  pickIcon,
  repoNames: () => (S.data.repos ?? []).map((r) => r.name),
  fonts: FONTS,
  // New list items get their default texts in the README language
  localize: (v) => localizeDeep(S.cfg.lang, v),
};

function blockSummary(b) {
  const text = b.title || b.text || b.greeting || b.lines?.[0]?.text || b.items?.[0]?.label || b.items?.[0]?.text;
  if (text) return text;
  // Fall back to the readable name of the chosen style
  const opt = BLOCKS[b.type].fields?.find((f) => f.k === "style")?.o?.find(([v]) => v === b.style);
  return opt ? t(opt[1]) : "";
}

function paintBlocks() {
  const pane = $("#tab-blocks");
  pane.innerHTML = "";
  const block = S.cfg.blocks.find((b) => b.id === S.sel);
  if (block) {
    const def = BLOCKS[block.type];
    const form = h("div", { class: "form" });
    pane.append(
      h(
        "div",
        { class: "editor-head" },
        h("button", { class: "icon back", title: t("Back to the list (Esc)"), "aria-label": t("Back to the list"), html: ui("back"), onclick: () => select(null) }),
        iconImg(def.icon, 22),
        h("div", {}, h("strong", {}, t(def.label)), h("small", {}, block.id)),
        h("button", { class: "icon danger del", title: t("Delete block (Del)"), "aria-label": t("Delete block"), html: ui("trash", 17), onclick: () => removeBlock(block.id) }),
      ),
      form,
    );
    buildForm(form, def.raw ? def.fields : [...def.fields, ...COMMON_FIELDS], block, formCtx);
    return;
  }
  const list = h("ul", { class: "blocks" });
  let dragIdx = -1;
  S.cfg.blocks.forEach((b, i) => {
    const def = BLOCKS[b.type];
    const li = h(
      "li",
      { class: b.hidden ? "off" : "", draggable: "true" },
      h("span", { class: "grip", title: t("Drag to reorder"), html: ui("grip", 16) }),
      iconImg(def.icon, 20),
      h("button", { class: "name", onclick: () => select(b.id) }, h("strong", {}, t(def.label)), h("small", {}, String(blockSummary(b)).slice(0, 40))),
      h("button", { class: "icon", title: t(b.hidden ? "Show" : "Hide"), "aria-label": t(b.hidden ? "Show" : "Hide"), html: ui(b.hidden ? "eyeOff" : "eye", 17), onclick: () => ((b.hidden = !b.hidden), commit(true), paintBlocks()) }),
      h("button", {
        class: "icon",
        title: t("Duplicate"),
        "aria-label": t("Duplicate"),
        html: ui("copy", 17),
        onclick: () => {
          const copy = structuredClone(b);
          copy.id = newBlock(b.type, "", S.cfg.lang).id;
          S.cfg.blocks.splice(i + 1, 0, copy);
          commit(true);
          paintBlocks();
        },
      }),
      h("button", {
        class: "icon danger",
        title: t("Delete (Del)"),
        "aria-label": t("Delete"),
        html: ui("trash", 17),
        onclick: () => removeBlock(b.id),
      }),
    );
    li.addEventListener("dragstart", (e) => {
      dragIdx = i;
      e.dataTransfer.effectAllowed = "move";
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));
    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      li.classList.add("over");
    });
    li.addEventListener("dragleave", () => li.classList.remove("over"));
    li.addEventListener("drop", (e) => {
      e.preventDefault();
      li.classList.remove("over");
      if (dragIdx < 0 || dragIdx === i) return;
      const [m] = S.cfg.blocks.splice(dragIdx, 1);
      S.cfg.blocks.splice(i, 0, m);
      commit(true);
      paintBlocks();
    });
    list.append(li);
  });
  const add = h(
    "div",
    { class: "add-grid" },
    ...Object.entries(BLOCKS).map(([type, def]) =>
      h("button", {
        class: "add-card",
        onclick: () => {
          const b = newBlock(type, S.cfg.login, S.cfg.lang);
          S.cfg.blocks.push(b);
          commit(true);
          select(b.id);
        },
      }, iconImg(def.icon, 22), h("span", {}, t(def.label))),
    ),
  );
  pane.append(
    h("p", { class: "hint" }, t("Click a block (here or in the preview) to edit it. Drag to reorder.")),
    list,
    h("div", { class: "form-group" }, t("Add block")),
    add,
  );
}

// ───────────────────────── Sidebar: style
function paintStyle() {
  const pane = $("#tab-style");
  pane.innerHTML = "";
  const c = S.cfg;
  // Presets
  const presets = h(
    "div",
    { class: "presets" },
    ...Object.entries(PRESETS).map(([k, pr]) => {
      const th = presetTheme(k);
      const sw = (pal) => h("span", { class: "sw" }, ...["bg", "accent", "accent2", "accent3"].map((r) => h("i", { style: `background:${pal[r]}` })));
      return h("button", {
        class: "preset" + (c.theme.preset === k ? " on" : ""),
        onclick: () => {
          c.theme = { ...presetTheme(k), modes: c.theme.modes };
          commit(true);
          paintStyle();
        },
      }, sw(th.light), sw(th.dark), h("span", { title: t(pr.label) }, t(pr.label)));
    }),
  );
  pane.append(h("div", { class: "form-group" }, t("Palette")), presets);

  const gen = h("div", { class: "form" });
  const seedObj = { seed: c.theme.seed, harmony: c.theme.harmony, modes: c.theme.modes };
  buildForm(gen, [
    { k: "seed", t: "color", l: "Base color" },
    { k: "harmony", t: "select", l: "Harmony", o: Object.entries(HARMONIES) },
  ], seedObj, {
    ...formCtx,
    onChange: () => {
      const g = generate(seedObj.seed, seedObj.harmony);
      c.theme = { ...c.theme, preset: null, seed: seedObj.seed, harmony: seedObj.harmony, light: g.light, dark: g.dark };
      commit();
      paintColors();
      pane.querySelectorAll(".preset").forEach((p) => p.classList.remove("on"));
    },
  });
  pane.append(gen);
  const modes = h("div", { class: "form" });
  buildForm(modes, [{ k: "modes", t: "select", l: "Versions to generate", o: [["both", "Light and dark (follows GitHub's theme)"], ["light", "Light only"], ["dark", "Dark only"]] }], c.theme, formCtx);
  pane.append(modes);

  const colors = h("div", { class: "colors" });
  const paintColors = () => {
    colors.innerHTML = "";
    for (const side of ["light", "dark"]) {
      const col = h("div", { class: "form" }, h("div", { class: "col-title", html: ui(side === "light" ? "sun" : "moon", 15) + t(side === "light" ? "Light" : "Dark") }));
      const f = h("div", {});
      buildForm(f, ROLES.map(([k, l]) => ({ k, t: "color", l })), c.theme[side], {
        ...formCtx,
        onChange: (s) => {
          c.theme.preset = null;
          commit(s);
        },
      });
      col.append(f);
      colors.append(col);
    }
  };
  paintColors();
  pane.append(h("details", { class: "fold", id: "fold-colors" }, h("summary", {}, t("Edit each color")), colors));

  const sections = [
    ["Typography", c.font, [
      { k: "heading", t: "font", l: "Heading font" },
      { k: "body", t: "font", l: "Body font" },
      { k: "headingWeight", t: "range", l: "Heading weight", min: 400, max: 900, step: 100 },
      { t: "info", l: "Any font from <a href='https://fonts.google.com' target='_blank' rel='noopener'>Google Fonts</a>. Only the letters you use get embedded." },
    ]],
    ["Cards", c.style, [
      { k: "width", t: "range", l: "Base width (px)", min: 600, max: 1000, step: 10 },
      { k: "bg", t: "select", l: "Card background", o: [["solid", "Solid color"], ["glow", "With a color light"], ["outline", "Border only"], ["none", "Transparent"]] },
      { k: "gradientAngle", t: "range", l: "Light direction (degrees)", min: 0, max: 360, step: 5, if: (o) => o.bg === "glow" },
      { k: "gradientStrength", t: "range", l: "Light intensity", min: 0.05, max: 0.6, step: 0.01, if: (o) => o.bg === "glow" },
      { k: "radius", t: "range", l: "Corner radius", min: 0, max: 48, step: 1 },
      { k: "border", t: "range", l: "Border width", min: 0, max: 4, step: 0.5 },
      { k: "chipRadius", t: "range", l: "Tag radius", min: 0, max: 24, step: 1 },
    ]],
    ["Animation", c.motion, [
      { k: "on", t: "toggle", l: "Enable animations" },
      { k: "entrance", t: "select", l: "Entrance", o: [["up", "Rise"], ["pop", "Pop in"], ["left", "From the left"], ["blur", "Blur"], ["fade", "Fade"], ["none", "No entrance"]] },
      { k: "speed", t: "range", l: "Speed", min: 0.25, max: 3, step: 0.05 },
      { k: "decor", t: "toggle", l: "Continuous animations (gradients, lights, ring, status)" },
      { k: "loop", t: "toggle", l: "Loop the entrance" },
      { k: "loopEvery", t: "range", l: "Repeat every (seconds)", min: 4, max: 60, step: 1, if: (o) => o.loop },
    ]],
  ];
  for (const [title, obj, fields] of sections) {
    const f = h("div", { class: "form" });
    buildForm(f, fields, obj, formCtx);
    pane.append(h("div", { class: "form-group" }, t(title)), f);
  }
}

// ───────────────────────── Sidebar: settings
function paintSettings() {
  const pane = $("#tab-settings");
  pane.innerHTML = "";
  const c = S.cfg;
  const tok = h("input", { type: "password", value: S.token, placeholder: t("ghp_… (optional)"), autocomplete: "off" });
  tok.addEventListener("change", () => {
    S.token = tok.value.trim();
    sessionStorage.setItem("pf:token", S.token);
    if (c.login) loadUser(c.login, true);
  });
  pane.append(
    h("div", { class: "form-group" }, t("GitHub data")),
    h("p", { class: "hint" }, S.data.demo ? t("Showing sample data. Type your username above and press Load.") : `${t("Data for @{user}.", { user: S.data.login })} ${t(S.data.exact ? "Exact contributions (GraphQL)." : "Contributions estimated from recent public activity; with a token they are exact.")}`),
    h("label", { class: "field" }, h("span", { class: "field-label" }, t("GitHub token (kept only in this tab)")), tok),
    h("p", { class: "hint" }, t("Used for: the exact contribution calendar, pinned repos and installing the profile directly.") + " ", h("a", { href: "https://github.com/settings/tokens/new?scopes=public_repo,workflow&description=Readmefy", target: "_blank", rel: "noopener" }, t("Create token (public_repo + workflow)"))),
  );
  const f1 = h("div", { class: "form" });
  buildForm(f1, [
    { k: "align", t: "select", l: "README alignment", o: [["center", "Centered"], ["left", "Left"]] },
    { k: "prefix", t: "code", l: "Markdown before the blocks" },
    { k: "suffix", t: "code", l: "Markdown after the blocks" },
  ], c.readme, formCtx);
  const f2 = h("div", { class: "form" });
  buildForm(f2, [
    { k: "enabled", t: "toggle", l: "Include a GitHub Action that keeps the stats updated" },
    { k: "cron", t: "select", l: "Frequency", o: ACTION_CRONS, if: (o) => o.enabled },
  ], c.action, formCtx);
  pane.append(h("div", { class: "form-group" }, "README"), f1, h("div", { class: "form-group" }, t("Automatic updates")), f2);

  const file = h("input", { type: "file", accept: ".json,application/json", class: "hidden" });
  file.addEventListener("change", async () => {
    const f = file.files[0];
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      hist.past.push(JSON.stringify(S.cfg));
      restore(JSON.stringify(j));
      toast(t("Configuration imported"));
    } catch {
      toast(t("That file is not a valid configuration"));
    }
  });
  pane.append(
    h("div", { class: "form-group" }, t("Configuration")),
    h(
      "div",
      { class: "btn-row" },
      h("button", { onclick: () => download(new Blob([JSON.stringify(S.cfg, null, 2)], { type: "application/json" }), `readmefy-${c.login || "config"}.json`) }, t("Export JSON")),
      h("button", { onclick: () => file.click() }, t("Import JSON")),
      file,
      h("button", {
        class: "danger",
        onclick: () => {
          if (!confirm(t("Start from scratch? The current configuration will be lost (you can undo)."))) return;
          hist.past.push(JSON.stringify(S.cfg));
          restore(JSON.stringify(defaultConfig(c.login, c.lang)));
        },
      }, t("Reset")),
    ),
  );
}

function paintTabs() {
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === S.tab));
  document.querySelectorAll(".pane").forEach((p) => (p.hidden = p.id !== `tab-${S.tab}`));
}

function paintAll() {
  paintTabs();
  paintBlocks();
  paintStyle();
  paintSettings();
  $("#login").value = S.cfg.login;
  paintHistory();
  paintDemo();
}

function paintTemplates() {
  const sel = $("#templates");
  sel.length = 1;
  for (const [k, tp] of Object.entries(TEMPLATES)) sel.append(h("option", { value: k }, t(tp.label)));
}

// Sample data notice, plus a pointer to the username field on the very first visit
function paintDemo() {
  $("#demo-banner").hidden = !S.data.demo;
  let welcomed = true;
  try {
    welcomed = !!localStorage.getItem("pf:welcomed");
  } catch {}
  $("#welcome-tip").hidden = welcomed || !S.data.demo;
}

function dismissWelcome() {
  try {
    localStorage.setItem("pf:welcomed", "1");
  } catch {}
  $("#welcome-tip").hidden = true;
}

function switchLang(lang) {
  if (lang === S.cfg.lang && lang === getLang()) return;
  setLang(lang);
  relocalize(S.cfg, S.cfg.lang, lang);
  if (S.data.demo) S.data = demoData("", lang);
  applyStatic();
  paintTemplates();
  paintAll();
  commit(true);
}

// ───────────────────────── GitHub data
async function loadUser(login, force = false) {
  login = login.trim().replace(/^@/, "");
  if (!login) return;
  const key = `pf:gh:${login.toLowerCase()}:${S.token ? "t" : "p"}`;
  setStatus(t("Loading GitHub data…"));
  try {
    let cached = null;
    try {
      cached = JSON.parse(sessionStorage.getItem(key) ?? "null");
    } catch {}
    let data;
    if (!force && cached && Date.now() - cached.t < 30 * 60 * 1000) data = cached.v;
    else {
      data = await loadData(login, S.token);
      try {
        sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: data }));
      } catch {}
    }
    const changed = S.cfg.login.toLowerCase() !== data.login.toLowerCase();
    S.data = data;
    S.cfg.login = data.login;
    if (changed) {
      // Point default links at the new user
      for (const b of S.cfg.blocks) {
        for (const it of b.items ?? []) if (typeof it.url === "string") it.url = it.url.replace(/github\.com\/[^/?]*(\?tab=repositories)?$/, `github.com/${data.login}$1`);
      }
    }
    await loadAvatar();
    dismissWelcome();
    paintDemo();
    commit(true);
    setStatus(t("@{user} loaded", { user: data.login }), 2500);
    paintSettings();
    if (S.sel) paintBlocks();
  } catch (e) {
    const msg = t({ notFound: "User not found", limit: "GitHub API limit reached; try later or use a token", badToken: "Invalid token" }[e.code] ?? "Could not load the data");
    setStatus("");
    toast(msg);
  }
}

function avatarSource() {
  const header = S.cfg.blocks.find((b) => b.type === "header");
  const custom = header?.avatarUrl?.trim();
  if (custom) return custom;
  return S.data.avatarUrl ? `${S.data.avatarUrl}${S.data.avatarUrl.includes("?") ? "&" : "?"}s=256` : null;
}

async function loadAvatar() {
  const url = avatarSource();
  S.avatarSrc = url;
  if (!url) return (S.avatar = null);
  try {
    S.avatar = await toDataUrl(url);
  } catch {
    S.avatar = null;
    if (url !== S.data.avatarUrl) setStatus(t("Could not download the avatar image (try another URL)"), 4000);
  }
}

// ───────────────────────── Export
const RENDER_FILES = ["index.js", "blocks.js", "kit.js", "theme.js", "lang.js", "github.js", "assets.js", "pipeline.js", "run.js"];

function workflow(cron) {
  return `name: Readmefy

on:
  schedule:
    - cron: "${cron}"
  workflow_dispatch:
  push:
    paths:
      - .readme/config.json

permissions:
  contents: write

jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Render profile
        run: node .readme/run.js
        env:
          GITHUB_TOKEN: \${{ secrets.PROFILE_TOKEN || github.token }}
      - name: Commit
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add -A assets README.md .readme/manifest.json
          git diff --cached --quiet || (git commit -m "Update profile stats" && git push)
`;
}

async function buildExport(progress) {
  if (!S.cfg.login) throw new Error(t("Type your GitHub username and press Load before exporting"));
  await ensureFonts();
  const out = await renderFinal(S.cfg, S.data, { icons: S.icons, fonts: { b: S.fonts.b, h: S.fonts.h }, avatar: S.avatar }, (d, n) => progress?.(t("Optimizing fonts… {d}/{n}", { d, n })));
  Object.assign(S.icons, out.icons);
  const files = { ...out.files, "README.md": out.readme };
  const used = {};
  for (const n of out.usedIcons) if (S.icons[n]) used[n] = S.icons[n];
  const cfg = { ...S.cfg, icons: used };
  files[".readme/config.json"] = JSON.stringify(cfg, null, 1) + "\n";
  files[".readme/manifest.json"] = JSON.stringify(Object.keys(out.files), null, 1) + "\n";
  if (S.cfg.action.enabled) {
    for (const f of RENDER_FILES) files[`.readme/${f}`] = await (await fetch(`render/${f}`)).text();
    files[".readme/package.json"] = JSON.stringify({ private: true, type: "module" }, null, 2) + "\n";
    files[".github/workflows/readmefy.yml"] = workflow(S.cfg.action.cron);
  }
  return files;
}

function openExport() {
  const dlg = $("#export");
  const log = $("#ex-log");
  const say = (m, replace) => {
    if (replace && log.lastChild?.dataset?.live) log.lastChild.textContent = m;
    else log.append(h("div", { "data-live": replace ? "1" : null }, m));
    log.scrollTop = log.scrollHeight;
  };
  log.innerHTML = "";
  $("#ex-user").textContent = S.cfg.login || t("your-username");
  $("#ex-token").value = S.token;
  $("#ex-action").checked = S.cfg.action.enabled;
  dlg.showModal();

  $("#ex-action").onchange = (e) => {
    S.cfg.action.enabled = e.target.checked;
    commit(true);
    paintSettings();
  };
  $("#ex-zip").onclick = async () => {
    try {
      say(t("Generating files…"));
      const files = await buildExport((m) => say(m, true));
      download(makeZip(files), `${S.cfg.login}-profile.zip`);
      say(t("Done: {n} files. Upload them to a public repository named exactly “{repo}”.", { n: Object.keys(files).length, repo: S.cfg.login }));
    } catch (e) {
      say(t("Error: ") + e.message);
    }
  };
  $("#ex-copy").onclick = async () => {
    await navigator.clipboard.writeText(S.out?.readme ?? "");
    say(t("README.md copied. Note: it also needs the assets/ folder with the SVGs (use the ZIP)."));
  };
  $("#ex-install").onclick = async () => {
    const token = $("#ex-token").value.trim();
    if (!token) return say(t("Paste a token to install directly."));
    S.token = token;
    sessionStorage.setItem("pf:token", token);
    try {
      say(t("Checking the token…"));
      const info = await inspectRepo(token, S.cfg.login);
      if (!info.matches) return say(t("The token belongs to @{user}, but the profile is @{login}'s. Load @{user} or use another token.", { user: info.user, login: S.cfg.login }));
      if (info.readme && !info.ours && !confirm(t("The repository {repo} already has a README.md. Replace it?", { repo: `${info.user}/${info.user}` }))) return say(t("Cancelled."));
      say(t("Generating files…"));
      const files = await buildExport((m) => say(m, true));
      const res = await installFiles(token, files, say);
      say(t("✅ Profile installed!"));
      log.append(h("div", {}, h("a", { href: res.url, target: "_blank", rel: "noopener" }, t("View {url}", { url: res.url }))));
      if (S.cfg.action.enabled) say(t("The Action will run now and then at the chosen frequency to refresh the stats."));
    } catch (e) {
      say(t("Error: ") + e.message);
    }
  };
}

function download(blob, name) {
  const a = h("a", { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  setTimeout(() => (URL.revokeObjectURL(a.href), a.remove()), 4000);
}

// ───────────────────────── Share link
async function shareLink() {
  const { icons, metrics, ...rest } = S.cfg;
  const bytes = new TextEncoder().encode(JSON.stringify(rest));
  const cs = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const buf = new Uint8Array(await new Response(cs).arrayBuffer());
  let s = "";
  for (const b of buf) s += String.fromCharCode(b);
  const code = btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const url = `${location.origin}${location.pathname}#c=${code}`;
  await navigator.clipboard.writeText(url).catch(() => {});
  toast(t("Link copied: anyone who opens it will see this same configuration"));
}

async function fromHash() {
  const m = /#c=([\w-]+)/.exec(location.hash);
  if (!m) return false;
  try {
    const b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const json = await new Response(ds).text();
    S.cfg = migrate(JSON.parse(json));
    hist.last = JSON.stringify(S.cfg);
    history.replaceState(null, "", location.pathname);
    toast(t("Configuration loaded from the link"));
    return true;
  } catch {
    toast(t("The shared link is not valid"));
    return false;
  }
}

// ───────────────────────── Misc UI
let statusTimer = 0;
function setStatus(m, clearAfter = 0) {
  $("#status").textContent = m;
  clearTimeout(statusTimer);
  if (clearAfter) statusTimer = setTimeout(() => ($("#status").textContent = ""), clearAfter);
}

function toast(m) {
  const t = h("div", { class: "toast" }, m);
  $("#toasts").append(t);
  setTimeout(() => t.classList.add("out"), 3600);
  setTimeout(() => t.remove(), 4200);
}

function paintToolbar() {
  document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("on", b.dataset.view === S.view));
  document.querySelectorAll("[data-theme-btn]").forEach((b) => b.classList.toggle("on", b.dataset.themeBtn === S.theme));
  document.querySelectorAll("[data-device]").forEach((b) => b.classList.toggle("on", b.dataset.device === S.device));
  $("#view-preview").hidden = S.view !== "preview";
  $("#view-code").hidden = S.view !== "code";
  $("#view-files").hidden = S.view !== "files";
}

function wire() {
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => ((S.tab = b.dataset.tab), paintTabs())));
  document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => ((S.view = b.dataset.view), paintToolbar())));
  document.querySelectorAll("[data-theme-btn]").forEach((b) =>
    b.addEventListener("click", () => {
      S.theme = b.dataset.themeBtn;
      paintToolbar();
      paintPreview();
    }),
  );
  document.querySelectorAll("[data-device]").forEach((b) =>
    b.addEventListener("click", () => {
      S.device = b.dataset.device;
      paintToolbar();
      paintPreview();
    }),
  );
  $("#replay").addEventListener("click", replay);
  $("#inkbar").addEventListener("click", openColors);
  $("#undo").addEventListener("click", undo);
  $("#redo").addEventListener("click", redo);
  $("#share").addEventListener("click", shareLink);
  $("#export-btn").addEventListener("click", openExport);
  $("#ex-close").addEventListener("click", () => $("#export").close());
  $("#load-form").addEventListener("submit", (e) => {
    e.preventDefault();
    loadUser($("#login").value, true);
  });
  $("#copy-readme").addEventListener("click", async () => {
    await navigator.clipboard.writeText(S.out?.readme ?? "");
    toast(t("README.md copied"));
  });
  $("#welcome-close").addEventListener("click", dismissWelcome);
  $("#demo-go").addEventListener("click", () => {
    $("#login").focus();
    $("#login").select();
  });
  const langSel = $("#lang");
  for (const [k, name] of Object.entries(LANGS)) langSel.append(h("option", { value: k, selected: k === getLang() }, name));
  langSel.addEventListener("change", () => switchLang(langSel.value));
  const tpl = $("#templates");
  paintTemplates();
  tpl.addEventListener("change", () => {
    const tp = TEMPLATES[tpl.value];
    tpl.value = "";
    if (!tp) return;
    hist.past.push(JSON.stringify(S.cfg));
    const c = tp.make(S.cfg.login, S.cfg.lang);
    S.sel = null;
    restore(JSON.stringify(c));
    paintHistory();
    toast(t("Template “{name}” applied (you can undo)", { name: t(tp.label) }));
  });
  addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      e.shiftKey ? redo() : undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
    } else if ((e.key === "Delete" || e.key === "Backspace") && S.sel && !e.target.matches("select, [contenteditable]") && !document.querySelector("dialog[open]")) {
      e.preventDefault();
      removeBlock(S.sel);
    } else if (e.key === "Escape" && S.sel) select(null);
  });
}

// ───────────────────────── Boot
(async () => {
  hydrateIcons();
  applyStatic();
  wire();
  // Every visit starts without a user; the saved design stays. A shared link keeps its user.
  if (!(await fromHash())) S.cfg.login = "";
  // Default texts follow the editor language (older configs were written in Spanish)
  if (S.cfg.lang !== getLang()) {
    relocalize(S.cfg, S.cfg.lang, getLang());
    hist.last = JSON.stringify(S.cfg);
    save();
  }
  paintAll();
  paintToolbar();
  schedule(0);
  if (S.cfg.login) loadUser(S.cfg.login);
})();
