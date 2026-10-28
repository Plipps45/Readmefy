import { defaultConfig, newBlock, presetTheme, tr } from "../render/index.js";

// Overrides are written in English; their default texts are translated like the blocks' own
const blocks = (login, lang, list) =>
  list.map(([type, over]) => {
    const b = newBlock(type, login, lang);
    for (const [k, v] of Object.entries(over ?? {})) b[k] = typeof v === "string" ? tr(lang, v) : Array.isArray(v) ? v.map((x) => (x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([kk, vv]) => [kk, typeof vv === "string" ? tr(lang, vv) : vv])) : x)) : v;
    return b;
  });

// Shared setup: palette, fonts and card style over the default config
const base = (login, lang, preset, font, style = {}, motion = {}) => {
  const c = defaultConfig(login, lang);
  c.theme = { ...presetTheme(preset), modes: "both" };
  if (font) c.font = font;
  c.style = { ...c.style, ...style };
  c.motion = { ...c.motion, ...motion };
  return c;
};

export const TEMPLATES = {
  discord: {
    label: "Discord",
    make: (login, lang) => defaultConfig(login, lang),
  },
  nitro: {
    label: "Nitro",
    make: (login, lang) => {
      const c = base(login, lang, "nitro", null, { bg: "glow", gradientAngle: 300, gradientStrength: 0.22, radius: 20 }, { entrance: "pop" });
      c.blocks = blocks(login, lang, [
        ["header", { layout: "center", nameSize: 64, greeting: "", chips: [], status: "dnd", decor: "gradient" }],
        ["marquee", { size: 22, height: 60 }],
        ["socials", { style: "chip", color: "brand", size: 42 }],
        ["typing", { effect: "slide", size: 26, height: 88 }],
        ["stack", { style: "tiles", groupTitles: false, title: "" }],
        ["projects", { count: 2, columns: 1 }],
        ["buttons", {}],
      ]);
      return c;
    },
  },
  midnight: {
    label: "Midnight",
    make: (login, lang) => {
      const c = base(login, lang, "midnight", { heading: "Onest", body: "Onest", headingWeight: 800 }, { radius: 12 });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "grid", shape: "rounded", status: "idle" }],
        ["stats", { langStyle: "donut", langColors: "theme" }],
        ["calendar", { weeks: 53, cell: "rounded", colors: "accent2" }],
        ["streak", {}],
        ["stack", { style: "tiles", iconColor: "original" }],
        ["projects", { columns: 1 }],
        ["divider", { style: "dots", height: 30 }],
        ["socials", { style: "icon", color: "tonal", size: 40 }],
      ]);
      return c;
    },
  },
  galaxia: {
    label: "Galaxy",
    make: (login, lang) => {
      const c = base(login, lang, "nitro", { heading: "Lexend", body: "Figtree", headingWeight: 700 }, { radius: 18 });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "stars", ring: "glow", status: "online", nameSize: 56 }],
        ["typing", { effect: "type", size: 24, color: "gradient" }],
        ["about", { columns: 2 }],
        ["divider", { style: "glow" }],
        ["stats", { langStyle: "donut" }],
        ["projects", {}],
        ["socials", { style: "chip", color: "tonal" }],
      ]);
      return c;
    },
  },
  synthwave: {
    label: "Synthwave",
    make: (login, lang) => {
      const c = base(login, lang, "synthwave", { heading: "Orbitron", body: "Figtree", headingWeight: 800 }, { bg: "glow", gradientAngle: 90, gradientStrength: 0.2, radius: 14 }, { entrance: "blur" });
      c.blocks = blocks(login, lang, [
        ["header", { layout: "center", decor: "synth", nameSize: 60, shape: "hexagon", chips: [], greeting: "" }],
        ["marquee", { size: 20, height: 56 }],
        ["typing", { effect: "slide", size: 24, color: "accent3" }],
        ["stack", { style: "tiles", groupTitles: false, title: "" }],
        ["streak", {}],
        ["buttons", {}],
      ]);
      return c;
    },
  },
  oceano: {
    label: "Ocean",
    make: (login, lang) => {
      const c = base(login, lang, "oceano", { heading: "Outfit", body: "Figtree", headingWeight: 700 }, { radius: 22, chipRadius: 16 });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "tide", status: "online" }],
        ["about", {}],
        ["stack", { style: "chips" }],
        ["divider", { style: "wave" }],
        ["calendar", { cell: "circle" }],
        ["projects", {}],
        ["socials", { style: "chip", color: "tonal" }],
      ]);
      return c;
    },
  },
  hacker: {
    label: "Hacker",
    make: (login, lang) => {
      const c = base(login, lang, "hacker", { heading: "JetBrains Mono", body: "JetBrains Mono", headingWeight: 800 }, { radius: 6, chipRadius: 4 }, { entrance: "fade" });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "rain", shape: "square", ring: "outline", nameGradient: false, nameSize: 44, greeting: "root@" }],
        ["typing", { effect: "type", size: 22, font: "m", color: "accent", align: "left", prefix: "> ", cursor: "block" }],
        ["stats", { langColors: "theme" }],
        ["calendar", { cell: "square" }],
        ["projects", { columns: 1 }],
        ["socials", { style: "chip", color: "outline" }],
      ]);
      return c;
    },
  },
  constelacion: {
    label: "Constellation",
    make: (login, lang) => {
      const c = base(login, lang, "github", { heading: "Geist", body: "Geist", headingWeight: 700 }, { radius: 14 });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "network", shape: "rounded" }],
        ["socials", { style: "icon", color: "brand", size: 40 }],
        ["stats", {}],
        ["streak", {}],
        ["stack", { style: "icons" }],
        ["projects", {}],
      ]);
      return c;
    },
  },
  atardecer: {
    label: "Sunset",
    make: (login, lang) => {
      const c = base(login, lang, "atardecer", { heading: "Bricolage Grotesque", body: "Figtree", headingWeight: 800 }, { bg: "glow", gradientAngle: 45, gradientStrength: 0.18, radius: 24, chipRadius: 18 }, { entrance: "pop" });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "sunburst", layout: "center", status: "idle", chips: [] }],
        ["typing", { effect: "fade", size: 24 }],
        ["about", {}],
        ["title", { text: "Projects", icon: "mdi:white-balance-sunny", color: "gradient" }],
        ["projects", {}],
        ["quote", {}],
        ["socials", { style: "chip", color: "tonal" }],
      ]);
      return c;
    },
  },
  bosque: {
    label: "Forest",
    make: (login, lang) => {
      const c = base(login, lang, "bosque", { heading: "Fraunces", body: "Figtree", headingWeight: 700 }, { radius: 18 });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "topo", shape: "arch", ring: "outline", status: "none" }],
        ["about", { columns: 2 }],
        ["stack", { style: "chips" }],
        ["calendar", { cell: "rounded" }],
        ["projects", {}],
        ["divider", { style: "dots", height: 30 }],
        ["socials", { style: "icon", color: "tonal", size: 40 }],
      ]);
      return c;
    },
  },
  invierno: {
    label: "Winter",
    make: (login, lang) => {
      const c = base(login, lang, "nord", { heading: "Outfit", body: "Figtree", headingWeight: 700 }, { radius: 20 });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "snow", status: "online" }],
        ["typing", { effect: "fade", size: 24, color: "accent" }],
        ["stats", {}],
        ["stack", { style: "tiles" }],
        ["projects", {}],
        ["socials", { style: "chip", color: "tonal" }],
      ]);
      return c;
    },
  },
  dracula: {
    label: "Dracula",
    make: (login, lang) => {
      const c = base(login, lang, "dracula", { heading: "Unbounded", body: "Figtree", headingWeight: 700 }, { radius: 16 });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "meteors", status: "dnd" }],
        ["marquee", { size: 20, height: 56 }],
        ["about", {}],
        ["stats", { langStyle: "donut" }],
        ["streak", {}],
        ["projects", {}],
        ["buttons", {}],
      ]);
      return c;
    },
  },
  burbujas: {
    label: "Bubbles",
    make: (login, lang) => {
      const c = base(login, lang, "catppuccin", { heading: "Fredoka", body: "Nunito", headingWeight: 700 }, { radius: 28, chipRadius: 20 }, { entrance: "pop" });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "bubbles", layout: "center", shape: "circle" }],
        ["socials", { style: "chip", color: "brand" }],
        ["about", {}],
        ["stack", { style: "chips" }],
        ["calendar", { cell: "circle" }],
        ["quote", {}],
      ]);
      return c;
    },
  },
  blueprint: {
    label: "Blueprint",
    make: (login, lang) => {
      const c = base(login, lang, "oceano", { heading: "Manrope", body: "IBM Plex Sans", headingWeight: 800 }, { bg: "outline", radius: 4, chipRadius: 3 });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "lines", shape: "square", ring: "outline", status: "none", nameGradient: false }],
        ["about", { columns: 2 }],
        ["stack", { style: "tiles", iconColor: "original" }],
        ["stats", { langColors: "theme" }],
        ["divider", { style: "line", color: "accent", thickness: 1.5 }],
        ["projects", { columns: 1 }],
      ]);
      return c;
    },
  },
  orbita: {
    label: "Orbit",
    make: (login, lang) => {
      const c = base(login, lang, "midnight", { heading: "Sora", body: "Sora", headingWeight: 700 }, { radius: 16 });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "orbits", ring: "none", status: "online" }],
        ["typing", { effect: "type", size: 24 }],
        ["stats", {}],
        ["calendar", { weeks: 53 }],
        ["projects", {}],
        ["socials", { style: "chip", color: "tonal" }],
      ]);
      return c;
    },
  },
  terminal: {
    label: "Terminal",
    make: (login, lang) => {
      const c = base(login, lang, "github", { heading: "JetBrains Mono", body: "JetBrains Mono", headingWeight: 800 }, { radius: 8, chipRadius: 6 });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "grid", shape: "rounded", ring: "outline", nameGradient: false, nameSize: 44, greeting: "~/" }],
        ["typing", { effect: "type", size: 22, font: "m", color: "accent3", align: "left", prefix: "$ ", cursor: "block" }],
        ["about", { columns: 2 }],
        ["stats", {}],
        ["streak", {}],
        ["divider", { style: "line", color: "accent", thickness: 1.5 }],
        ["projects", {}],
        ["socials", { style: "chip", color: "outline" }],
      ]);
      return c;
    },
  },
  aurora: {
    label: "Aurora",
    make: (login, lang) => {
      const c = base(login, lang, "catppuccin", { heading: "Outfit", body: "Outfit", headingWeight: 700 }, { bg: "glow", gradientAngle: 225, gradientStrength: 0.18, radius: 24, chipRadius: 18 });
      c.blocks = blocks(login, lang, [
        ["header", { decor: "confetti", shape: "hexagon", nameSize: 50 }],
        ["typing", { effect: "fade", size: 24, color: "gradient" }],
        ["socials", { style: "chip", color: "tonal" }],
        ["about", {}],
        ["stack", { style: "chips" }],
        ["calendar", { cell: "circle" }],
        ["title", { text: "Projects", icon: "mdi:rocket-launch", color: "gradient" }],
        ["projects", {}],
        ["quote", {}],
      ]);
      return c;
    },
  },
  minimal: {
    label: "Minimal",
    make: (login, lang) => {
      const c = base(login, lang, "discord", null, { bg: "none", border: 0 }, { entrance: "fade", decor: false });
      c.blocks = blocks(login, lang, [
        ["header", { layout: "center", decor: "none", ring: "none", status: "none", chips: [] }],
        ["socials", { style: "icon", color: "tonal", size: 40 }],
        ["stack", { style: "icons", groupTitles: false, title: "" }],
        ["stats", { metrics: [{ key: "stars", label: "Stars", icon: "mdi:star-outline" }, { key: "repos", label: "Repositories", icon: "mdi:book-outline" }, { key: "followers", label: "Followers", icon: "mdi:account-outline" }], langColors: "theme" }],
        ["projects", { decor: false }],
      ]);
      return c;
    },
  },
};
