import { hsl, toHsl, readableOn } from "./kit.js";

export const ROLES = [
  ["bg", "Card background"],
  ["bg2", "Secondary background"],
  ["border", "Border"],
  ["text", "Text"],
  ["muted", "Secondary text"],
  ["accent", "Main accent"],
  ["accent2", "Accent 2"],
  ["accent3", "Accent 3"],
];

export const HARMONIES = {
  analog: "Analogous",
  complement: "Complementary",
  triad: "Triadic",
  split: "Split complementary",
  mono: "Monochromatic",
};

const OFFSETS = { analog: [35, -35], complement: [180, 30], triad: [120, 240], split: [150, 210], mono: [0, 0] };

// Surfaces stay close to neutral; the seed becomes the main accent and the harmony picks the other two
export function generate(seed, harmony = "analog") {
  const [h, s0] = toHsl(seed);
  const [o1, o2] = OFFSETS[harmony] ?? OFFSETS.analog;
  const mono = harmony === "mono";
  const s = Math.max(0.5, Math.min(1, s0 || 0.7));
  const light = {
    bg: hsl(h, 0.12, 0.962),
    bg2: hsl(h, 0.1, 0.915),
    border: hsl(h, 0.08, 0.84),
    text: hsl(h, 0.12, 0.11),
    muted: hsl(h, 0.06, 0.38),
    accent: hsl(h, s, 0.42),
    accent2: hsl(h + o1, mono ? s * 0.5 : Math.min(1, s * 1.05), mono ? 0.66 : 0.6),
    accent3: hsl(h + o2, mono ? s * 0.3 : s, mono ? 0.8 : 0.62),
  };
  const dark = {
    bg: hsl(h, 0.1, 0.085),
    bg2: hsl(h, 0.1, 0.13),
    border: hsl(h, 0.08, 0.21),
    text: hsl(h, 0.08, 0.94),
    muted: hsl(h, 0.06, 0.66),
    accent: hsl(h, s, 0.6),
    accent2: hsl(h + o1, mono ? s * 0.5 : s, mono ? 0.45 : 0.6),
    accent3: hsl(h + o2, mono ? s * 0.3 : s * 0.9, mono ? 0.3 : 0.5),
  };
  return { light, dark };
}

// Base swatches for the hand-tuned sets below
const INK = {
  black: "#1d1d1f", blue: "#0078bf", fluoPink: "#ff48b0", yellow: "#ffe800", teal: "#00838a", orange: "#ff6c2f",
  sunflower: "#ffb511", federal: "#3d5588", red: "#f15060", aqua: "#5ec8e5", green: "#00a95c", mediumBlue: "#3255a4",
  purple: "#765ba7", mint: "#82d8d5", scarlet: "#f65058", burgundy: "#914e72", gold: "#bb8b41", cornflower: "#62a8e5",
  fluoOrange: "#ff7477", kelly: "#67b346",
};

const paper = (bg, bg2, border, text = INK.black, muted = "#5a5a5f") => ({ bg, bg2, border, text, muted });
const stock = (bg, bg2, border, text = "#f1f1ec", muted = "#a7a7ad") => ({ bg, bg2, border, text, muted });
const WHITE = paper("#f6f6f2", "#ebebe5", "#d9d9d2");
const BLACK = stock("#141416", "#1e1e21", "#303034");

// Discord brand colours
const DC = { blurple: "#5865f2", green: "#57f287", yellow: "#fee75c", fuchsia: "#eb459e", red: "#ed4245" };

// Hand-tuned sets. On dark cards the accents are lifted so they keep their contrast.
export const PRESETS = {
  discord: {
    label: "Discord",
    seed: DC.blurple,
    harmony: "split",
    light: { bg: "#ffffff", bg2: "#f2f3f5", border: "#e3e5e8", text: "#060607", muted: "#5c5e66", accent: DC.blurple, accent2: DC.fuchsia, accent3: "#23a55a" },
    dark: { bg: "#2b2d31", bg2: "#1e1f22", border: "#3f4147", text: "#f2f3f5", muted: "#b5bac1", accent: DC.blurple, accent2: DC.fuchsia, accent3: DC.green },
  },
  nitro: {
    label: "Nitro",
    seed: DC.fuchsia,
    harmony: "analog",
    light: { bg: "#fdf8ff", bg2: "#f4ecfa", border: "#e8dcf1", text: "#16101f", muted: "#665a75", accent: "#d63c8c", accent2: DC.blurple, accent3: "#b88c00" },
    dark: { bg: "#221d33", bg2: "#17132a", border: "#3a3352", text: "#f6f3ff", muted: "#b6aed4", accent: DC.fuchsia, accent2: "#7984f5", accent3: DC.yellow },
  },
  midnight: {
    label: "Midnight",
    seed: DC.blurple,
    harmony: "triad",
    light: { bg: "#ffffff", bg2: "#f6f7f9", border: "#e4e6ea", text: "#0b0b0f", muted: "#5c5e66", accent: "#4752c4", accent2: "#1f8b4c", accent3: "#c49400" },
    dark: { bg: "#0b0b0f", bg2: "#15161b", border: "#24252c", text: "#f2f3f5", muted: "#9da1aa", accent: "#6b77ff", accent2: DC.green, accent3: DC.yellow },
  },
  riso: {
    label: "Blue + Neon pink",
    seed: INK.blue,
    harmony: "triad",
    light: { ...WHITE, accent: INK.blue, accent2: INK.fluoPink, accent3: INK.yellow },
    dark: { ...BLACK, accent: "#2f9be3", accent2: "#ff5cbc", accent3: "#b8a400" },
  },
  teal: {
    label: "Teal + Orange",
    seed: INK.teal,
    harmony: "complement",
    light: { ...WHITE, accent: INK.teal, accent2: INK.orange, accent3: INK.sunflower },
    dark: { ...BLACK, accent: "#1fb5bc", accent2: "#ff7a45", accent3: "#a87400" },
  },
  federal: {
    label: "Federal blue + Red",
    seed: INK.federal,
    harmony: "split",
    light: { ...WHITE, accent: INK.federal, accent2: INK.red, accent3: INK.aqua },
    dark: { ...BLACK, accent: "#7e98d6", accent2: "#ff6676", accent3: "#22708a" },
  },
  verde: {
    label: "Green + Neon pink",
    seed: INK.green,
    harmony: "complement",
    light: { ...WHITE, accent: INK.green, accent2: INK.fluoPink, accent3: INK.mint },
    dark: { ...BLACK, accent: "#22c878", accent2: "#ff5cbc", accent3: "#2a6f6c" },
  },
  violeta: {
    label: "Violet + Scarlet",
    seed: INK.purple,
    harmony: "triad",
    light: { ...WHITE, accent: INK.purple, accent2: INK.scarlet, accent3: INK.mint },
    dark: { ...BLACK, accent: "#a68ae0", accent2: "#ff6a70", accent3: "#2f716d" },
  },
  burdeos: {
    label: "Burgundy + Gold",
    seed: INK.burgundy,
    harmony: "analog",
    light: { ...paper("#f4f2ee", "#e8e5df", "#d6d1c8"), accent: INK.burgundy, accent2: INK.gold, accent3: INK.cornflower },
    dark: { ...stock("#161315", "#211c1f", "#352d32"), accent: "#d07aa5", accent2: "#d6a356", accent3: "#2f5f8e" },
  },
  rosa: {
    label: "Pastel pink",
    seed: INK.mediumBlue,
    harmony: "split",
    light: { ...paper("#ffdde9", "#f7cadb", "#efb4ca", INK.black, "#5c3a48"), accent: INK.mediumBlue, accent2: INK.fluoOrange, accent3: INK.yellow },
    dark: { ...stock("#2a1420", "#361b2a", "#4c2a3c", "#ffe9f1", "#d9a9bd"), accent: "#7d9bff", accent2: "#ff8689", accent3: "#8a7a00" },
  },
  amarillo: {
    label: "Pastel yellow",
    seed: INK.purple,
    harmony: "triad",
    light: { ...paper("#fff1a6", "#f6e388", "#e8d26b", INK.black, "#5b5320"), accent: INK.purple, accent2: INK.scarlet, accent3: INK.kelly },
    dark: { ...stock("#1d1a0b", "#29240f", "#3e3718", "#fff6c9", "#cfc48e"), accent: "#b39af0", accent2: "#ff6a70", accent3: "#3d7a2a" },
  },
  kraft: {
    label: "Kraft",
    seed: INK.red,
    harmony: "analog",
    light: { ...paper("#d9c09b", "#ccb088", "#b99a70", "#1a1612", "#4d3f2e"), accent: INK.black, accent2: INK.red, accent3: "#8a6a3f" },
    dark: { ...stock("#1f1913", "#2a221a", "#3d3226", "#f1e2c9", "#bba584"), accent: "#efe0c6", accent2: "#ff6a6a", accent3: "#6d5434" },
  },
  negro: {
    label: "Monochrome",
    seed: "#6b6b70",
    harmony: "mono",
    light: { ...WHITE, accent: INK.black, accent2: "#8f8f95", accent3: "#c9c9cc" },
    dark: { ...BLACK, accent: "#f1f1ec", accent2: "#8f8f95", accent3: "#3a3a3f" },
  },
  dracula: {
    label: "Dracula",
    seed: "#bd93f9",
    harmony: "triad",
    dark: { bg: "#282a36", bg2: "#343746", border: "#44475a", text: "#f8f8f2", muted: "#a4a8c4", accent: "#bd93f9", accent2: "#ff79c6", accent3: "#8be9fd" },
  },
  nord: {
    label: "Nord",
    seed: "#88c0d0",
    harmony: "analog",
    light: { bg: "#eceff4", bg2: "#e5e9f0", border: "#d8dee9", text: "#2e3440", muted: "#4c566a", accent: "#5e81ac", accent2: "#bf616a", accent3: "#88c0d0" },
    dark: { bg: "#2e3440", bg2: "#3b4252", border: "#434c5e", text: "#eceff4", muted: "#a3adbf", accent: "#88c0d0", accent2: "#bf616a", accent3: "#5e81ac" },
  },
  catppuccin: {
    label: "Catppuccin",
    seed: "#cba6f7",
    harmony: "analog",
    light: { bg: "#eff1f5", bg2: "#e6e9ef", border: "#ccd0da", text: "#4c4f69", muted: "#6c6f85", accent: "#8839ef", accent2: "#ea76cb", accent3: "#04a5e5" },
    dark: { bg: "#1e1e2e", bg2: "#313244", border: "#45475a", text: "#cdd6f4", muted: "#a6adc8", accent: "#cba6f7", accent2: "#f5c2e7", accent3: "#89dceb" },
  },
  gruvbox: {
    label: "Gruvbox",
    seed: "#fe8019",
    harmony: "analog",
    light: { bg: "#fbf1c7", bg2: "#ebdbb2", border: "#d5c4a1", text: "#3c3836", muted: "#665c54", accent: "#af3a03", accent2: "#b57614", accent3: "#427b58" },
    dark: { bg: "#282828", bg2: "#3c3836", border: "#504945", text: "#ebdbb2", muted: "#bdae93", accent: "#fe8019", accent2: "#fabd2f", accent3: "#8ec07c" },
  },
  github: {
    label: "GitHub",
    seed: "#2f81f7",
    harmony: "split",
    light: { bg: "#ffffff", bg2: "#f6f8fa", border: "#d0d7de", text: "#1f2328", muted: "#59636e", accent: "#0969da", accent2: "#bf3989", accent3: "#1a7f37" },
    dark: { bg: "#0d1117", bg2: "#161b22", border: "#30363d", text: "#e6edf3", muted: "#9198a1", accent: "#4493f8", accent2: "#db61a2", accent3: "#238636" },
  },
  synthwave: {
    label: "Synthwave",
    seed: "#ff3cac",
    harmony: "triad",
    light: { bg: "#fff7fc", bg2: "#fbeaf5", border: "#f0d3e6", text: "#1d0b2a", muted: "#6a4f7d", accent: "#d61f8a", accent2: "#6b3fd4", accent3: "#0089a8" },
    dark: { bg: "#1a1030", bg2: "#120a24", border: "#34245a", text: "#fbefff", muted: "#b9a5d9", accent: "#ff3cac", accent2: "#8b5cf6", accent3: "#22d3ee" },
  },
  oceano: {
    label: "Ocean",
    seed: "#0ea5e9",
    harmony: "analog",
    light: { bg: "#f5fbff", bg2: "#e6f4fb", border: "#cfe6f2", text: "#06202f", muted: "#466577", accent: "#0277bd", accent2: "#0f9d8a", accent3: "#4f5bd5" },
    dark: { bg: "#0b1d2c", bg2: "#071522", border: "#1c3a52", text: "#e8f6ff", muted: "#97b6c9", accent: "#38bdf8", accent2: "#2dd4bf", accent3: "#818cf8" },
  },
  hacker: {
    label: "Hacker",
    seed: "#22c55e",
    harmony: "mono",
    light: { bg: "#f6fbf7", bg2: "#e9f5ec", border: "#cfe5d5", text: "#04150a", muted: "#41604b", accent: "#15803d", accent2: "#0f766e", accent3: "#65a30d" },
    dark: { bg: "#07110b", bg2: "#0c1a11", border: "#173222", text: "#d9ffe6", muted: "#7fb592", accent: "#39ff88", accent2: "#14d9b4", accent3: "#a3e635" },
  },
  atardecer: {
    label: "Sunset",
    seed: "#f97316",
    harmony: "analog",
    light: { bg: "#fffaf5", bg2: "#fdeee2", border: "#f5dac4", text: "#2a1206", muted: "#7a5440", accent: "#e0531a", accent2: "#d61f69", accent3: "#b7791f" },
    dark: { bg: "#24140f", bg2: "#1a0d09", border: "#47291e", text: "#fff1e8", muted: "#d4ac98", accent: "#fb923c", accent2: "#f43f5e", accent3: "#facc15" },
  },
  bosque: {
    label: "Forest",
    seed: "#16a34a",
    harmony: "analog",
    light: { bg: "#f8faf5", bg2: "#eef3e8", border: "#d9e3cf", text: "#14200f", muted: "#55654b", accent: "#2f7d32", accent2: "#a16207", accent3: "#0e7490" },
    dark: { bg: "#18211a", bg2: "#111813", border: "#2c3a2e", text: "#eef6ea", muted: "#a9bba4", accent: "#6ccf73", accent2: "#e8b04b", accent3: "#4fb7c9" },
  },
};

export function presetTheme(key) {
  const pr = PRESETS[key] ?? PRESETS.discord;
  const gen = generate(pr.seed, pr.harmony);
  return { preset: key, seed: pr.seed, harmony: pr.harmony, light: { ...gen.light, ...pr.light }, dark: { ...gen.dark, ...pr.dark } };
}

export function palette(theme, dark) {
  const p = { ...(dark ? theme.dark : theme.light) };
  p.onAccent = readableOn(p.accent);
  p.dark = dark;
  return p;
}

// GitHub linguist colors for the most common languages
export const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572a5", Java: "#b07219", "C#": "#178600", "C++": "#f34b7d",
  C: "#555555", Go: "#00add8", Rust: "#dea584", Ruby: "#701516", PHP: "#4f5d95", Swift: "#f05138", Kotlin: "#a97bff",
  Dart: "#00b4ab", HTML: "#e34c26", CSS: "#663399", SCSS: "#c6538c", Shell: "#89e051", Vue: "#41b883", Svelte: "#ff3e00",
  Lua: "#000080", "Jupyter Notebook": "#da5b0b", R: "#198ce7", Scala: "#c22d40", Elixir: "#6e4a7e", Haskell: "#5e5086",
  Zig: "#ec915c", Nix: "#7e7eff", PowerShell: "#012456", Dockerfile: "#384d54", Astro: "#ff5a03", GDScript: "#355570",
  Clojure: "#db5855", "Objective-C": "#438eff", Perl: "#0298c3", Julia: "#a270ba", MDX: "#fcb32c", Solidity: "#aa6746",
  Assembly: "#6e4c13", Makefile: "#427819", CMake: "#da3434", Batchfile: "#c1f12e", "Vim Script": "#199f4b", OCaml: "#ef7a08",
};

export const LANG_ICONS = {
  JavaScript: "logos:javascript", TypeScript: "logos:typescript-icon", Python: "logos:python", Java: "logos:java",
  "C#": "logos:c-sharp", "C++": "logos:c-plusplus", C: "logos:c", Go: "logos:go", Rust: "logos:rust", Ruby: "logos:ruby",
  PHP: "logos:php", Swift: "logos:swift", Kotlin: "logos:kotlin-icon", Dart: "logos:dart", HTML: "logos:html-5",
  CSS: "logos:css-3", SCSS: "logos:sass", Shell: "logos:bash-icon", Vue: "logos:vue", Svelte: "logos:svelte-icon",
  Lua: "logos:lua", "Jupyter Notebook": "logos:jupyter", R: "logos:r-lang", Elixir: "devicon:elixir", Haskell: "logos:haskell-icon",
  Zig: "logos:zig", Nix: "devicon:nixos", PowerShell: "devicon:powershell", Dockerfile: "logos:docker-icon", Astro: "logos:astro-icon",
  GDScript: "logos:godot-icon", Scala: "logos:scala", Julia: "logos:julia", Solidity: "logos:solidity",
};
