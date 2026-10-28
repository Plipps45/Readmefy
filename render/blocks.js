import {
  badge, bar, brandColor, cardBg, chip, clipCard, coverage, delayStyle, density, enter, fit, glow, grad, gradSpan, icon, inkText,
  mix, n1, odometer, readableOn, rng, screen, sectionTitle, shapeOf, shapePath, shortNum, smil, svgDoc, tint, txt, typing, wrap,
} from "./kit.js";
import { LANG_COLORS, LANG_ICONS } from "./theme.js";
import { MONTHS, locale, tr } from "./lang.js";

const SHAPE_OPTS = [
  ["circle", "Circle"], ["rounded", "Rounded square"], ["square", "Square"], ["hexagon", "Hexagon"],
  ["stamp", "Stamp"], ["ticket", "Ticket"], ["arch", "Arch"],
];
const COLOR_OPTS = [["gradient", "Accent gradient"], ["accent", "Main accent"], ["accent2", "Accent 2"], ["accent3", "Accent 3"], ["text", "Text"]];
const FONT_OPTS = [["h", "Headings"], ["b", "Body"], ["m", "Monospace"]];

// Values from older configs map onto the closest current option
const DECOR_ALIAS = { shapes: "geo", aurora: "glow", marks: "grid" };
const RING_ALIAS = { spin: "glow", burst: "glow", solid: "outline", pulse: "glow", stamp: "outline" };
const DIVIDER_ALIAS = { pulse: "glow", registration: "glow", colorbar: "dots" };

// Discord status colours
const STATUS = { online: "#23a55a", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e" };

const common = [
  { t: "group", l: "Block" },
  { k: "card", t: "toggle", l: "Card background" },
  { k: "animate", t: "toggle", l: "Animations in this block" },
  { k: "link", t: "text", l: "Link on click (optional)", ph: "https://..." },
  { k: "imgWidth", t: "select", l: "Width in the README", o: [["100%", "100%"], ["90%", "90%"], ["75%", "75%"], ["60%", "60%"], ["50%", "50%"]] },
];

const ACC = (p) => [p.accent, p.accent2, p.accent3];

// Default text in the README language
// Configs from before languages existed were written in Spanish
const langOf = (ctx) => ctx.cfg.lang ?? "es";
const L = (ctx, s) => tr(langOf(ctx), s);

const bgOf = (ctx, w, h, o) => (ctx.block.card === false ? "" : cardBg(ctx, w, h, o));

function single(ctx, w, h, body, alt) {
  return [{ svg: svgDoc(ctx, w, h, body, alt), alt, width: ctx.block.imgWidth || "100%", link: ctx.block.link }];
}

const sp = (ctx) => ctx.mo.speed || 1;

// Fill for a colour option: the accent gradient or one palette role
const fillOf = (ctx, role) => (role === "gradient" ? grad(ctx) : ctx.p[role] ?? ctx.p.accent);

// ───────────────────────── Header
// Backgrounds. Static ones never move; animated ones show a still frame when continuous motion is off.
const DECOR_STATIC = [
  ["lights", "Color lights"], ["mesh", "Mesh gradient"], ["grid", "Dot grid"], ["lines", "Line grid"],
  ["plus", "Crosses"], ["diagonal", "Diagonal stripes"], ["bands", "Diagonal bands"], ["topo", "Contour lines"],
  ["circles", "Concentric circles"], ["geo", "Geometric shapes"], ["waves", "Waves"], ["sunburst", "Sunburst"],
  ["halftone", "Halftone dots"], ["none", "Plain"],
];
const DECOR_ANIMATED = [
  ["glow", "Aurora (moving lights)"], ["gradient", "Moving gradient"], ["stars", "Starry sky"], ["meteors", "Meteor shower"],
  ["confetti", "Floating confetti"], ["bubbles", "Bubbles"], ["snow", "Snow"], ["rain", "Digital rain"], ["fireflies", "Fireflies"],
  ["network", "Constellation"], ["orbits", "Orbits"], ["pulse", "Ripples"], ["tide", "Rolling waves"],
  ["synth", "Retro grid (synthwave)"], ["beams", "Sweeping shine"], ["breathe", "Breathing halftone"],
];

const o2 = (x) => Math.max(0, Math.min(1, x)).toFixed(2);

// Closed Catmull-Rom curve through the points
function smoothClosed(pts) {
  const n = pts.length;
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [a, b, c, e] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]];
    d += `C${n1(b[0] + (c[0] - a[0]) / 6)} ${n1(b[1] + (c[1] - a[1]) / 6)} ${n1(c[0] - (e[0] - b[0]) / 6)} ${n1(c[1] - (e[1] - b[1]) / 6)} ${n1(c[0])} ${n1(c[1])}`;
  }
  return d + "Z";
}

function headerDecor(ctx, w, h, right, ax, ay, ar) {
  const { p, block } = ctx;
  const kind = DECOR_ALIAS[block.decor] ?? block.decor ?? "glow";
  if (kind === "none") return "";
  const R = rng(block.id + kind);
  const k = (p.dark ? 1 : 0.62) * (block.decorStrength ?? 1);
  const one = block.decorColor && block.decorColor !== "mix" ? p[block.decorColor] ?? p.accent : null;
  const cols = one ? [one, one, one] : ACC(p);
  const [c1, c2, c3] = cols;
  const center = block.layout === "center";
  const moving = ctx.mo.on && ctx.mo.decor;
  // x on the side away from the avatar (anywhere when centred); t in 0..1
  const far = right ? w * 0.1 : w * 0.9;
  const side = (t) => (center ? t * w : right ? t * w * 0.48 : w * 0.52 + t * w * 0.48);
  const D = (sec) => `${(sec / sp(ctx)).toFixed(1)}s`;
  const A = (s) => smil(ctx, s);
  const full = (fill, extra = "") => `<rect width="${n1(w)}" height="${n1(h)}" fill="${fill}"${extra}/>`;
  const light = (cx, cy, r, color, o, anim = "") => {
    const [d, f] = glow(ctx, cx, cy, r, color, Number(Math.min(1, o).toFixed(3)), anim);
    return d + full(f);
  };
  const corner = center ? w / 2 : right ? 0 : w;
  const fade = (cx, cy, r) => {
    const id = ctx.uid("fm");
    return [
      `<radialGradient id="${id}g" gradientUnits="userSpaceOnUse" cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="${id}">${full(`url(#${id}g)`)}</mask>`,
      ` mask="url(#${id})"`,
    ];
  };
  // Repeating tile fading out from the corner away from the avatar
  const tile = (size, inner, o, extra = "") => {
    const id = ctx.uid("pt");
    const [md, m] = fade(corner, 0, w * 0.62);
    return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse"${extra}>${inner}</pattern>${md}${full(`url(#${id})`, `${m} opacity="${o2(o)}"`)}`;
  };
  const tw = () => (moving ? ` class="tw" style="${delayStyle(ctx, -R() * 3)};animation-duration:${((1.6 + R() * 2.4) / sp(ctx)).toFixed(1)}s"` : "");
  // Filled wave band from y0 down to the bottom edge
  const wavePath = (x0, x1, y0, amp, len) => {
    let d = `M${n1(x0)} ${n1(h + 2)}L${n1(x0)} ${n1(y0)}`;
    let x = x0;
    for (let i = 0; x < x1; i++, x += len / 2) d += `Q${n1(x + len / 4)} ${n1(y0 + (i % 2 ? amp : -amp))} ${n1(x + len / 2)} ${n1(y0)}`;
    return d + `L${n1(x)} ${n1(h + 2)}Z`;
  };
  let s = "";

  if (kind === "glow" || kind === "lights") {
    // Coloured light behind the avatar, a second accent in the far corner, the third low; "glow" drifts
    const drift = (attr, a, b, dur) =>
      kind === "glow" ? A(`<animate attributeName="${attr}" values="${n1(a)};${n1(b)};${n1(a)}" dur="${D(dur)}" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>`) : "";
    s += light(w * 0.58, h * 1.05, h * 0.7, c3, 0.2 * k, drift("cx", w * 0.58, w * 0.7, 11));
    s += light(far, 0, h * 0.9, c2, 0.36 * k, drift("cx", far, far + (right ? 60 : -60), 13));
    s += light(ax, ay, h * 0.95, c1, 0.5 * k, drift("r", h * 0.95, h * 1.1, 8));
  } else if (kind === "mesh") {
    // Large overlapping lights covering the whole card
    [[0.08, 0.15], [0.42, 1.05], [0.78, 0.05], [1, 0.9], [0.25, 0.55]].forEach(([x, y], i) => (s += light(x * w, y * h, w * (0.3 + R() * 0.14), cols[i % 3], 0.42 * k)));
  } else if (kind === "grid") {
    s += tile(20, `<circle cx="10" cy="10" r="1.3" fill="${p.muted}"/>`, p.dark ? 0.5 : 0.4);
    s += light(corner, 0, w * 0.45, c1, 0.28 * k);
  } else if (kind === "lines") {
    s += tile(28, `<path d="M28 .5H.5V28" fill="none" stroke="${p.muted}" stroke-width="1"/>`, p.dark ? 0.3 : 0.28);
    s += light(corner, 0, w * 0.45, c1, 0.28 * k);
  } else if (kind === "plus") {
    s += tile(26, `<path d="M13 9v8M9 13h8" stroke="${p.muted}" stroke-width="1.5" stroke-linecap="round"/>`, p.dark ? 0.5 : 0.42);
    s += light(corner, 0, w * 0.45, c2, 0.24 * k);
  } else if (kind === "diagonal") {
    s += tile(16, `<rect width="6" height="16" fill="${c1}"/>`, 0.26 * k + 0.04, ` patternTransform="rotate(45)"`);
    s += light(ax, ay, h * 0.9, c2, 0.22 * k);
  } else if (kind === "bands") {
    // Two translucent bands crossing behind the text
    const x0 = right ? w * 0.18 : w * 0.72;
    const band = (x, tilt, bw, col, op) => `<path d="M${n1(x)} ${n1(h + 10)}L${n1(x + tilt)} -10h${n1(bw)}L${n1(x + bw)} ${n1(h + 10)}Z" fill="${col}" opacity="${o2(op)}"/>`;
    s += band(x0, h * 0.42, 74, c1, 0.22 * k + 0.08) + band(x0 + 70, -h * 0.36, 46, c2, 0.2 * k + 0.08);
  } else if (kind === "topo") {
    // Contour lines around a point on the free side
    const cx = center ? w * 0.86 : far;
    const cy = h * 0.32;
    const ph = [R() * 6.3, R() * 6.3, R() * 6.3];
    for (let i = 1; i <= 11; i++) {
      const r0 = i * 28;
      const pts = [];
      for (let j = 0; j < 18; j++) {
        const t = (j / 18) * Math.PI * 2;
        const r = r0 * (1 + 0.14 * Math.sin(3 * t + ph[0]) + 0.08 * Math.sin(5 * t + ph[1] + i * 0.2) + 0.04 * Math.sin(2 * t + ph[2]));
        pts.push([cx + Math.cos(t) * r * 1.35, cy + Math.sin(t) * r]);
      }
      const major = i % 4 === 0;
      s += `<path d="${smoothClosed(pts)}" fill="none" stroke="${major ? c2 : c1}" stroke-width="${major ? 1.6 : 1}" opacity="${o2((0.62 - i * 0.035) * k)}"/>`;
    }
  } else if (kind === "circles") {
    for (let i = 0; i < 9; i++) {
      const dash = i % 3 === 2 ? ` stroke-dasharray="2 7" stroke-linecap="round"` : "";
      s += `<circle cx="${n1(ax)}" cy="${n1(ay)}" r="${n1(ar + 26 + i * 30)}" fill="none" stroke="${i % 3 === 2 ? c2 : c1}" stroke-width="${i % 3 === 2 ? 2 : 1.2}"${dash} opacity="${o2((0.5 - i * 0.045) * k)}"/>`;
    }
  } else if (kind === "geo") {
    // Outlined shapes scattered on the free side
    for (let i = 0; i < 16; i++) {
      const x = side(0.04 + R() * 0.92);
      const y = 14 + R() * (h - 28);
      const z = 8 + R() * 12;
      const shape = [
        `<path d="M0 ${n1(-z)}L${n1(z * 0.87)} ${n1(z / 2)}L${n1(-z * 0.87)} ${n1(z / 2)}Z"/>`,
        `<circle r="${n1(z * 0.75)}"/>`,
        `<rect x="${n1(-z * 0.7)}" y="${n1(-z * 0.7)}" width="${n1(z * 1.4)}" height="${n1(z * 1.4)}" rx="2"/>`,
        `<path d="M0 ${n1(-z * 0.8)}V${n1(z * 0.8)}M${n1(-z * 0.8)} 0H${n1(z * 0.8)}"/>`,
        `<path d="M${n1(-z)} 0l${n1(z / 2)} ${n1(-z / 2)}l${n1(z / 2)} ${n1(z / 2)}l${n1(z / 2)} ${n1(-z / 2)}l${n1(z / 2)} ${n1(z / 2)}"/>`,
      ][i % 5];
      s += `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${Math.round(R() * 360)})" fill="none" stroke="${cols[i % 3]}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="${o2(0.6 * k + 0.1)}">${shape}</g>`;
    }
  } else if (kind === "waves" || kind === "tide") {
    // Three wave bands along the bottom; "tide" rolls them sideways at different speeds
    [[0.8, 9, 300, c3, 0.09, 13], [0.87, 7, 230, c2, 0.11, 9], [0.94, 5, 170, c1, 0.15, 6]].forEach(([y, amp, len, col, o, dur], i) => {
      const roll = kind === "tide" ? A(`<animateTransform attributeName="transform" type="translate" from="0 0" to="${i % 2 ? -len : len} 0" dur="${D(dur)}" repeatCount="indefinite"/>`) : "";
      s += `<g><path d="${wavePath(-len, w + len, h * y, amp, len)}" fill="${col}" opacity="${o2(o * k + 0.02)}"/>${roll}</g>`;
    });
  } else if (kind === "sunburst") {
    const n = 32;
    const L = w * 1.3;
    let d = "";
    for (let i = 0; i < n; i += 2) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      d += `M${n1(ax)} ${n1(ay)}L${n1(ax + Math.cos(a0) * L)} ${n1(ay + Math.sin(a0) * L)}L${n1(ax + Math.cos(a1) * L)} ${n1(ay + Math.sin(a1) * L)}Z`;
    }
    const [md, m] = fade(ax, ay, w * 0.62);
    s += md + `<path d="${d}" fill="${c1}" opacity="${o2(0.16 * k)}"${m}/>` + light(ax, ay, h * 0.8, c2, 0.3 * k);
  } else if (kind === "halftone" || kind === "breathe") {
    // Dot screen fading out of the corner; "breathe" slowly spreads and recedes
    const cx = right || center ? w : 0;
    const r0 = w * 0.5;
    const anim = kind === "breathe" ? A(`<animate attributeName="r" values="${n1(r0)};${n1(r0 * 1.25)};${n1(r0)}" dur="${D(8)}" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>`) : "";
    const [def, fill] = density(ctx, "radial", `cx="${n1(cx)}" cy="0" r="${n1(r0)}"`, [[0, 0.75], [0.4, 0.35], [0.74, 0]], anim);
    s += def + `<g opacity="${o2((p.dark ? 0.6 : 0.8) * (block.decorStrength ?? 1))}">${screen(ctx, { x: 0, y: 0, w, h, color: c1, pitch: 10, angle: 45, field: full(fill) })}</g>`;
  } else if (kind === "gradient") {
    // Accent gradient washing across the card
    const id = ctx.uid("mg");
    s += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${n1(w)}" y2="${n1(h * 0.6)}" spreadMethod="reflect"><stop offset="0" stop-color="${c1}"/><stop offset=".5" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/>${A(`<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="${n1(w * 2)} 0" dur="${D(16)}" repeatCount="indefinite"/>`)}</linearGradient>`;
    s += full(`url(#${id})`, ` opacity="${o2(0.24 * k + 0.04)}"`);
  } else if (kind === "stars") {
    s += light(far, 0, h * 1.1, c1, 0.26 * k);
    const dot = p.dark ? p.text : p.muted;
    for (let i = 0; i < 64; i++) {
      const r = 0.6 + R() ** 2 * 1.8;
      s += `<circle${tw()} cx="${n1(R() * w)}" cy="${n1(R() * h)}" r="${n1(r)}" fill="${R() < 0.75 ? dot : cols[i % 3]}" opacity="${o2(0.85 * k + 0.1)}"/>`;
    }
    // A few four-point sparkles on the free side
    for (let i = 0; i < 6; i++) {
      const z = 5 + R() * 6;
      const x = side(0.05 + R() * 0.9);
      const y = 12 + R() * (h - 24);
      s += `<path${tw()} d="M${n1(x)} ${n1(y - z)}Q${n1(x)} ${n1(y)} ${n1(x + z)} ${n1(y)}Q${n1(x)} ${n1(y)} ${n1(x)} ${n1(y + z)}Q${n1(x)} ${n1(y)} ${n1(x - z)} ${n1(y)}Q${n1(x)} ${n1(y)} ${n1(x)} ${n1(y - z)}Z" fill="${cols[i % 3]}"/>`;
    }
  } else if (kind === "meteors") {
    s += light(far, 0, h * 1.1, c1, 0.26 * k);
    const ids = cols.map((c) => {
      const id = ctx.uid("mt");
      s += `<linearGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset="1" stop-color="${p.dark ? p.text : c}"/></linearGradient>`;
      return id;
    });
    for (let i = 0; i < 8; i++) {
      const len = 70 + R() * 90;
      const dur = 4 + R() * 4;
      const T = 320;
      const begin = (-R() * dur).toFixed(1);
      const fly = A(
        `<animateTransform attributeName="transform" type="translate" values="0 0;${-T} ${n1(T * 0.55)};${-T} ${n1(T * 0.55)}" keyTimes="0;.3;1" dur="${D(dur)}" begin="${begin}s" repeatCount="indefinite"/>` +
          `<animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.04;.3;1" dur="${D(dur)}" begin="${begin}s" repeatCount="indefinite"/>`,
      );
      const x = w * 0.25 + R() * w * 0.85;
      const y = -10 + R() * h * 0.55;
      s += `<g transform="translate(${n1(x)} ${n1(y)})"><g opacity="${o2(0.9 * k + 0.1)}"><g transform="rotate(151)"><path d="M${n1(-len)} 0L0 -1.4L0 1.4Z" fill="url(#${ids[i % 3]})"/><circle r="1.8" fill="${p.dark ? p.text : cols[i % 3]}"/></g>${fly}</g></g>`;
    }
  } else if (kind === "confetti") {
    for (let i = 0; i < 34; i++) {
      const cls = moving ? ` class="fl" style="${delayStyle(ctx, -R() * 9)}"` : "";
      s += `<circle${cls} cx="${n1(side(R()))}" cy="${n1(R() * h)}" r="${n1(2 + R() * 4.5)}" fill="${cols[i % 3]}" opacity="${o2(0.7 * k + 0.1)}"/>`;
    }
  } else if (kind === "bubbles") {
    for (let i = 0; i < 22; i++) {
      const x = side(0.03 + R() * 0.94);
      const r = 4 + R() * 14;
      const dur = 8 + R() * 9;
      const col = cols[i % 3];
      const rise = A(
        `<animate attributeName="cy" values="${n1(h + r)};${n1(-r)}" dur="${D(dur)}" begin="${(-R() * dur).toFixed(1)}s" repeatCount="indefinite"/>` +
          `<animate attributeName="cx" values="${n1(x)};${n1(x + 10)};${n1(x)}" dur="${D(3 + R() * 2)}" repeatCount="indefinite"/>`,
      );
      s += `<circle cx="${n1(x)}" cy="${n1(R() * h)}" r="${n1(r)}" fill="${col}" fill-opacity="${o2(0.1 * k)}" stroke="${col}" stroke-width="1.4" stroke-opacity="${o2(0.55 * k + 0.1)}">${rise}</circle>`;
    }
  } else if (kind === "snow") {
    const flake = p.dark ? p.text : p.muted;
    for (let i = 0; i < 56; i++) {
      const x = R() * w;
      const dur = 7 + R() * 8;
      const fall = A(
        `<animate attributeName="cy" values="-4;${n1(h + 4)}" dur="${D(dur)}" begin="${(-R() * dur).toFixed(1)}s" repeatCount="indefinite"/>` +
          `<animate attributeName="cx" values="${n1(x)};${n1(x + 8 + R() * 8)};${n1(x)}" dur="${D(4 + R() * 3)}" repeatCount="indefinite"/>`,
      );
      s += `<circle cx="${n1(x)}" cy="${n1(R() * h)}" r="${n1(0.8 + R() * 2.2)}" fill="${i % 7 ? flake : cols[i % 3]}" opacity="${o2(0.6 * k + 0.15)}">${fall}</circle>`;
    }
  } else if (kind === "rain") {
    // Falling streaks in columns, bright at the head
    const ids = cols.map((c) => {
      const id = ctx.uid("rn");
      s += `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
      return id;
    });
    const x0 = center ? 12 : side(0) + 8;
    const x1 = center ? w - 12 : side(1) - 8;
    for (let x = x0, i = 0; x < x1; x += 18, i++) {
      const len = 30 + R() * 70;
      const dur = 2.5 + R() * 3.5;
      const fall = A(`<animate attributeName="y" values="${n1(-len)};${n1(h)}" dur="${D(dur)}" begin="${(-R() * dur).toFixed(1)}s" repeatCount="indefinite"/>`);
      s += `<rect x="${n1(x)}" y="${n1(R() * h - len)}" width="2" height="${n1(len)}" rx="1" fill="url(#${ids[i % 3]})" opacity="${o2(0.6 * k + 0.1)}">${fall}</rect>`;
    }
  } else if (kind === "fireflies") {
    s += light(far, h, h, c1, 0.22 * k);
    for (let i = 0; i < 18; i++) {
      const col = cols[i % 3];
      const pts = [0, 1, 2].map(() => `${n1((R() - 0.5) * 60)} ${n1((R() - 0.5) * 40)}`);
      const wander = A(`<animateTransform attributeName="transform" type="translate" values="0 0;${pts.join(";")};0 0" dur="${D(9 + R() * 7)}" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/>`);
      const x = side(0.04 + R() * 0.92);
      const y = 14 + R() * (h - 28);
      s += `<g><g${tw()}><circle cx="${n1(x)}" cy="${n1(y)}" r="8" fill="${col}" opacity="${o2(0.3 * k)}"/><circle cx="${n1(x)}" cy="${n1(y)}" r="2.6" fill="${col}"/></g>${wander}</g>`;
    }
  } else if (kind === "network") {
    // Points joined to their neighbours, with a few pulses travelling along the links
    const pts = Array.from({ length: 20 }, () => [side(0.03 + R() * 0.94), 12 + R() * (h - 24)]);
    const links = [];
    pts.forEach((a, i) => pts.slice(i + 1).forEach((b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 100 && links.push([a, b])));
    let g = "";
    for (const [a, b] of links) g += `<path d="M${n1(a[0])} ${n1(a[1])}L${n1(b[0])} ${n1(b[1])}" stroke="${c1}" stroke-width="1" opacity="${o2(0.22 * k + 0.04)}"/>`;
    pts.forEach(([x, y], i) => (g += `<circle${tw()} cx="${n1(x)}" cy="${n1(y)}" r="${n1(2 + R() * 1.6)}" fill="${cols[i % 3]}"/>`));
    if (moving) {
      links.slice(0, 6).forEach(([a, b], i) => {
        g += `<circle r="2.2" fill="${cols[(i + 1) % 3]}"><animateMotion path="M${n1(a[0])} ${n1(a[1])}L${n1(b[0])} ${n1(b[1])}" dur="${D(2.5 + R() * 2)}" begin="${(-R() * 3).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
      });
    }
    s += `<g${moving ? ' class="fl"' : ""}>${g}</g>`;
  } else if (kind === "orbits") {
    s += light(ax, ay, ar * 2.2, c1, 0.3 * k);
    [[46, 11, c1], [92, 17, c2], [146, 25, c3]].forEach(([gap, dur, col], i) => {
      const r = ar + gap;
      s += `<circle cx="${n1(ax)}" cy="${n1(ay)}" r="${n1(r)}" fill="none" stroke="${col}" stroke-width="1.2"${i === 1 ? ` stroke-dasharray="3 7" stroke-linecap="round"` : ""} opacity="${o2(0.35 * k + 0.05)}"/>`;
      for (let j = 0; j < (i === 2 ? 2 : 1); j++) {
        const a0 = Math.round(R() * 360);
        const spin = A(`<animateTransform attributeName="transform" type="rotate" from="${a0} ${n1(ax)} ${n1(ay)}" to="${a0 + (i % 2 ? -360 : 360)} ${n1(ax)} ${n1(ay)}" dur="${D(dur)}" repeatCount="indefinite"/>`);
        s += `<circle cx="${n1(ax + r)}" cy="${n1(ay)}" r="${i === 0 ? 4 : 5.5}" fill="${col}" transform="rotate(${a0} ${n1(ax)} ${n1(ay)})">${spin}</circle>`;
      }
    });
  } else if (kind === "pulse") {
    s += light(ax, ay, h, c1, 0.26 * k);
    for (let i = 0; i < 4; i++) {
      const anim = A(
        `<animate attributeName="r" values="${n1(ar + 6)};${n1(ar + 280)}" dur="${D(4.8)}" begin="${(-i * 1.2).toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keySplines=".2 .6 .4 1"/>` +
          `<animate attributeName="opacity" values="${o2(0.7 * k + 0.1)};0" dur="${D(4.8)}" begin="${(-i * 1.2).toFixed(1)}s" repeatCount="indefinite"/>`,
      );
      s += `<circle cx="${n1(ax)}" cy="${n1(ay)}" r="${n1(ar + 34 + i * 58)}" fill="none" stroke="${cols[i % 3]}" stroke-width="2" opacity="${o2((0.55 - i * 0.12) * k)}">${anim}</circle>`;
    }
  } else if (kind === "synth") {
    // Perspective floor on the lower half, lines rolling towards the viewer
    const hz = h * 0.64;
    const vx = center ? w / 2 : right ? w * 0.26 : w * 0.72;
    const id = ctx.uid("sy");
    s += `<linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="0" y1="${n1(hz)}" x2="0" y2="${n1(h)}"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient><mask id="${id}">${full(`url(#${id}g)`)}</mask>`;
    s += light(vx, hz, w * 0.36, c2, 0.4 * k) + light(vx, hz, w * 0.18, c3, 0.3 * k);
    let g = "";
    for (let i = -16; i <= 16; i++) g += `<path d="M${n1(vx + i * 7)} ${n1(hz)}L${n1(vx + i * 95)} ${n1(h + 4)}" stroke="${c1}" stroke-width="1.2"/>`;
    const N = 8;
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const roll = A(`<animateTransform attributeName="transform" type="translate" values="0 0;0 ${n1(h - hz)}" dur="${D(3.2)}" begin="${(-t * 3.2).toFixed(2)}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".6 0 1 1"/>`);
      g += `<path d="M0 ${n1(moving ? hz : hz + (h - hz) * t * t)}H${n1(w)}" stroke="${c2}" stroke-width="1.4">${roll}</path>`;
    }
    s += `<g mask="url(#${id})" opacity="${o2(0.6 * k + 0.1)}">${g}</g><path d="M0 ${n1(hz)}H${n1(w)}" stroke="${c2}" stroke-width="1.2" opacity="${o2(0.4 * k)}"/>`;
  } else if (kind === "beams") {
    // Soft light with a bright band sweeping across now and then
    s += light(far, 0, h * 1.1, c1, 0.3 * k) + light(ax, ay, h * 0.8, c2, 0.2 * k);
    const id = ctx.uid("bm");
    const shine = p.dark ? "#ffffff" : c1;
    s += `<linearGradient id="${id}"><stop offset="0" stop-color="${shine}" stop-opacity="0"/><stop offset=".5" stop-color="${shine}" stop-opacity="${o2((p.dark ? 0.12 : 0.16) * (block.decorStrength ?? 1))}"/><stop offset="1" stop-color="${shine}" stop-opacity="0"/></linearGradient>`;
    [[180, 7, 0], [70, 7, -3.2]].forEach(([bw, dur, begin]) => {
      const sweep = A(`<animateTransform attributeName="transform" type="translate" values="0 0;${n1(w + bw * 2 + h)} 0;${n1(w + bw * 2 + h)} 0" keyTimes="0;.45;1" dur="${D(dur)}" begin="${begin}s" repeatCount="indefinite" calcMode="spline" keySplines=".5 0 .5 1;0 0 1 1"/>`);
      s += `<g transform="translate(${n1(moving ? -bw - h : w * 0.42)} 0)"><g>${sweep}<rect y="-20" width="${bw}" height="${n1(h + 40)}" fill="url(#${id})" transform="skewX(-22)"/></g></g>`;
    });
  }
  return s;
}

// Discord-style presence dot on the lower right of the avatar, cut out of the image
function statusDot(ctx, cx, cy, r, kind, shape) {
  const { p } = ctx;
  const col = STATUS[kind];
  if (!col) return "";
  const k = shape === "circle" ? Math.SQRT1_2 : 0.76;
  const x = cx + r * k;
  const y = cy + r * k;
  const sr = r * 0.17;
  let s = `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(sr + r * 0.065)}" fill="${p.bg}"/>`;
  if (kind === "online") s += `<circle${ctx.mo.on && ctx.mo.decor ? ' class="ping"' : ""} cx="${n1(x)}" cy="${n1(y)}" r="${n1(sr)}" fill="${col}"/>`;
  s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(sr)}" fill="${col}"/>`;
  if (kind === "idle") s += `<circle cx="${n1(x - sr * 0.5)}" cy="${n1(y - sr * 0.5)}" r="${n1(sr * 0.62)}" fill="${p.bg}"/>`;
  if (kind === "dnd") s += `<rect x="${n1(x - sr * 0.6)}" y="${n1(y - sr * 0.18)}" width="${n1(sr * 1.2)}" height="${n1(sr * 0.36)}" rx="${n1(sr * 0.18)}" fill="${p.bg}"/>`;
  if (kind === "offline") s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(sr * 0.45)}" fill="${p.bg}"/>`;
  return s;
}

function avatarSvg(ctx, cx, cy, r) {
  const { p, block, env } = ctx;
  const kind = shapeOf(block.shape);
  const ring = RING_ALIAS[block.ring] ?? block.ring;
  const print = block.print ?? "photo";
  const sh = shapePath(kind, cx, cy, r);
  let s = "";
  if (ring === "glow") {
    // Accent gradient ring; with decor motion the colours turn around the avatar
    const id = ctx.uid("rg");
    const spin = smil(ctx, `<animateTransform attributeName="gradientTransform" type="rotate" from="0 ${n1(cx)} ${n1(cy)}" to="360 ${n1(cx)} ${n1(cy)}" dur="${(7 / sp(ctx)).toFixed(1)}s" repeatCount="indefinite"/>`);
    s += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n1(cx - r)}" y1="${n1(cy - r)}" x2="${n1(cx + r)}" y2="${n1(cy + r)}"><stop offset="0" stop-color="${p.accent}"/><stop offset=".55" stop-color="${p.accent2}"/><stop offset="1" stop-color="${p.accent3}"/>${spin}</linearGradient>`;
    s += `<path d="${shapePath(kind, cx, cy, r + 9)}" stroke="url(#${id})" stroke-width="14" opacity="${p.dark ? 0.22 : 0.16}"/>`;
    s += `<path d="${shapePath(kind, cx, cy, r + 8)}" stroke="url(#${id})" stroke-width="3.5"/>`;
  }
  if (ring === "offset") s += `<path d="${shapePath(kind, cx + 12, cy + 12, r)}" fill="${tint(p, p.accent, 2.2)}"/>`;
  if (ring === "outline") s += `<path d="${shapePath(kind, cx, cy, r + 8)}" stroke="${p.border}" stroke-width="2"/>`;
  const cid = ctx.uid("av");
  s += `<clipPath id="${cid}"><path d="${sh}"/></clipPath>`;
  s += `<path d="${sh}" fill="${p.bg2}"/>`;
  const box = { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r };
  if (!env.avatar) {
    s += `<g clip-path="url(#${cid})">${icon(ctx, "mdi:account", cx - r * 0.6, cy - r * 0.55, r * 1.2, p.muted)}</g>`;
  } else if (print === "photo") {
    s += `<image href="${env.avatar}" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${cid})"/>`;
  } else {
    // Halftone portrait: the main accent carries the image, the second accent only the shadows, both in register
    const img = ctx.uid("im");
    s += `<defs><image id="${img}" href="${env.avatar}" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" preserveAspectRatio="xMidYMid slice"/></defs>`;
    const pitch = Math.max(3.6, r / 21);
    const [fa, ida] = coverage(ctx, p.dark, p.dark ? 1.1 : 1.55, p.dark ? -0.08 : 0.02);
    s += fa + screen(ctx, { ...box, color: print === "mono" ? p.text : p.accent, pitch, angle: 45, field: `<use href="#${img}" filter="url(#${ida})" clip-path="url(#${cid})"/>` });
    if (print === "duotone") {
      const [fb, idb] = p.dark ? coverage(ctx, true, 1.3, -0.72) : coverage(ctx, false, 1.9, -0.66);
      s += fb + screen(ctx, { ...box, color: p.accent2, pitch, angle: 15, field: `<use href="#${img}" filter="url(#${idb})" clip-path="url(#${cid})"/>` });
    }
  }
  s += statusDot(ctx, cx, cy, r, block.status, kind);
  return `<g${enter(ctx, 0)}>${s}</g>`;
}

const header = {
  label: "Header",
  icon: "mdi:card-account-details-star",
  defaults: (login, T) => ({
    greeting: T("Hi, I'm"),
    name: "",
    subtitle: T("Developer who turns coffee into code and design into experiences."),
    typing: true,
    chips: [
      { icon: "mdi:map-marker", label: T("Planet Earth") },
      { icon: "mdi:code-tags", label: "Full-stack" },
    ],
    avatar: true,
    shape: "circle",
    ring: "glow",
    print: "photo",
    status: "online",
    layout: "left",
    decor: "glow",
    decorColor: "mix",
    decorStrength: 1,
    nameGradient: true,
    nameSize: 52,
    card: true,
  }),
  fields: [
    { t: "group", l: "Content" },
    { k: "greeting", t: "text", l: "Greeting" },
    { k: "name", t: "text", l: "Name (empty = GitHub name)" },
    { k: "subtitle", t: "textarea", l: "Subtitle" },
    { k: "typing", t: "toggle", l: "Typewriter effect on the subtitle" },
    { k: "chips", t: "list", l: "Tags", add: { icon: "mdi:star", label: "New" }, fields: [{ k: "icon", t: "icon", l: "Icon" }, { k: "label", t: "text", l: "Text" }], title: (x) => x.label },
    { t: "group", l: "Design" },
    { k: "layout", t: "select", l: "Layout", o: [["left", "Avatar on the left"], ["center", "Centered"], ["right", "Avatar on the right"]] },
    { k: "nameSize", t: "range", l: "Name size", min: 32, max: 80, step: 1 },
    { k: "nameGradient", t: "toggle", l: "Animated gradient name" },
    { t: "group", l: "Background" },
    { k: "decor", t: "select", l: "Background style", g: [["Animated", DECOR_ANIMATED], ["Static", DECOR_STATIC]] },
    { k: "decorColor", t: "select", l: "Background color", o: [["mix", "All three accents"], ["accent", "Main accent"], ["accent2", "Accent 2"], ["accent3", "Accent 3"], ["muted", "Gray"]], if: (b) => b.decor !== "none" },
    { k: "decorStrength", t: "range", l: "Background intensity", min: 0.3, max: 2, step: 0.1, if: (b) => b.decor !== "none" },
    { t: "info", l: "Animated backgrounds stay still if you turn off continuous animations in Style." },
    { t: "group", l: "Avatar" },
    { k: "avatar", t: "toggle", l: "Show avatar" },
    { k: "avatarUrl", t: "text", l: "Custom image URL (empty = GitHub avatar)", ph: "https://..." },
    { k: "shape", t: "select", l: "Shape", o: SHAPE_OPTS },
    { k: "ring", t: "select", l: "Frame", o: [["glow", "Spinning gradient ring"], ["outline", "Thin border"], ["offset", "Offset shadow"], ["none", "None"]] },
    { k: "status", t: "select", l: "Status (like Discord)", o: [["online", "Online"], ["idle", "Idle"], ["dnd", "Do not disturb"], ["offline", "Offline"], ["none", "No status"]] },
    { k: "print", t: "select", l: "Photo treatment", o: [["photo", "Original photo"], ["duotone", "Two-color halftone"], ["mono", "One-color halftone"]] },
  ],
  render(ctx) {
    const { p, block, cfg, data } = ctx;
    const W = ctx.W;
    const center = block.layout === "center";
    const right = block.layout === "right";
    const name = block.name || data.name || cfg.login || L(ctx, "your-username");
    const hw = cfg.font.headingWeight;
    const ar = center ? 72 : 86;
    const hasAv = block.avatar !== false;
    const avSpan = 44 + 22 + ar * 2 + 22 + 34;
    const textX = center ? 48 : hasAv && !right ? avSpan : 48;
    const textR = center ? W - 48 : hasAv && right ? W - avSpan : W - 44;
    const tw = textR - textX;
    const nameSize = Math.min(block.nameSize || 52, tw / Math.max(1, ctx.m(name, 1, hw, "h")));
    const subLines = block.subtitle ? wrap(ctx.m, block.subtitle, 18, Math.min(tw, 560), 400, "b", 2) : [];
    let y = center ? 44 + ar * 2 + 48 : 0;
    const items = [];
    if (block.greeting) {
      y += 20;
      items.push(["greet", y]);
      y += 14;
    }
    y += nameSize * 0.9;
    items.push(["name", y]);
    y += 16;
    const subY = [];
    for (let i = 0; i < subLines.length; i++) {
      y += 26;
      subY.push(y);
    }
    let chipY = 0;
    if (block.chips?.length) {
      y += 22;
      chipY = y;
      y += 34;
    }
    const contentH = y;
    const H = center ? Math.round(contentH + 44) : Math.round(Math.max(hasAv ? ar * 2 + 104 : 0, contentH + 96));
    const off = center ? 0 : (H - contentH) / 2;
    const ax = center ? W / 2 : right ? W - 44 - ar - 22 : 44 + ar + 22;
    const ay = center ? 44 + ar : H / 2;

    let b = bgOf(ctx, W, H);
    const deco = headerDecor(ctx, W, H, right, ax, ay, ar);
    if (deco) b += clipCard(ctx, W, H, deco);
    if (hasAv) b += avatarSvg(ctx, ax, ay, ar);

    const anchor = center ? "middle" : "start";
    const tx = center ? W / 2 : textX;
    const lineX = (s, size, weight = 400, role = "b") => (center ? W / 2 - ctx.m(s, size, weight, role) / 2 : textX);
    let d = 0.1;
    for (const [kind, yy] of items) {
      const Y = yy + off;
      if (kind === "greet") b += `<g${enter(ctx, d)}>${txt(ctx, tx, Y, block.greeting, 20, p.muted, { weight: 600, anchor })}</g>`;
      if (kind === "name") b += `<g${enter(ctx, d)}>${txt(ctx, tx, Y, name, nameSize, block.nameGradient ? grad(ctx) : p.text, { role: "h", anchor })}</g>`;
      d += 0.12;
    }
    if (subLines.length) {
      if (block.typing && ctx.mo.on) {
        const lines = subLines.map((t, i) => ({ text: t, x: lineX(t, 18), y: subY[i] + off }));
        b += typing(ctx, [{ lines }], { size: 18, fill: p.text, cursorColor: p.accent, cps: 26, loop: false });
      } else {
        subLines.forEach((t, i) => (b += `<g${enter(ctx, d + i * 0.06)}>${txt(ctx, tx, subY[i] + off, t, 18, p.text, { anchor })}</g>`));
      }
    }
    if (block.chips?.length) {
      const acc = ACC(p);
      const sized = block.chips.map((c) => chip(ctx, 0, 0, c.label, { icon: c.icon, h: 34 })[1]);
      const total = sized.reduce((a, x) => a + x + 8, -8);
      let cx = center ? (W - total) / 2 : textX;
      block.chips.forEach((c, i) => {
        if (cx + sized[i] > W - 24) return;
        const t = acc[i % 3];
        b += chip(ctx, cx, chipY + off, c.label, { icon: c.icon, h: 34, tint: t, iconColor: t, mono: true, delay: 0.5 + i * 0.08 })[0];
        cx += sized[i] + 8;
      });
    }
    return single(ctx, W, H, b, `${block.greeting} ${name}`);
  },
};

// ───────────────────────── Typing
const typingBlock = {
  label: "Animated text",
  icon: "mdi:keyboard-outline",
  defaults: (login, T) => ({
    lines: [{ text: T("I build fast web apps") }, { text: T("Open source lover") }, { text: T("Always learning something new") }],
    prefix: "",
    effect: "type",
    size: 26,
    font: "h",
    color: "gradient",
    align: "center",
    cursor: "bar",
    speed: 14,
    pause: 1.6,
    height: 84,
    card: true,
  }),
  fields: [
    { t: "group", l: "Phrases" },
    { k: "lines", t: "list", l: "Rotating phrases", add: { text: "New phrase" }, fields: [{ k: "text", t: "text", l: "Text" }], title: (x) => x.text },
    { k: "prefix", t: "text", l: "Fixed prefix (optional)", ph: "> " },
    { t: "group", l: "Style" },
    { k: "effect", t: "select", l: "Effect", o: [["type", "Typewriter"], ["fade", "Fade"], ["slide", "Slide up"]] },
    { k: "size", t: "range", l: "Size", min: 14, max: 64, step: 1 },
    { k: "font", t: "select", l: "Font", o: FONT_OPTS },
    { k: "color", t: "select", l: "Color", o: COLOR_OPTS },
    { k: "align", t: "select", l: "Alignment", o: [["center", "Center"], ["left", "Left"]] },
    { k: "cursor", t: "select", l: "Cursor", o: [["bar", "Bar"], ["block", "Block"], ["underscore", "Underscore"], ["none", "None"]] },
    { k: "speed", t: "range", l: "Speed (letters/sec)", min: 4, max: 40, step: 1 },
    { k: "pause", t: "range", l: "Pause between phrases (sec)", min: 0.3, max: 5, step: 0.1 },
    { k: "height", t: "range", l: "Height", min: 40, max: 200, step: 2 },
  ],
  render(ctx) {
    const { p, block } = ctx;
    const W = ctx.W;
    const H = Math.max(block.height, block.size * 1.6);
    const role = block.font || "h";
    const weight = role === "h" ? ctx.cfg.font.headingWeight : 600;
    const lines = (block.lines || []).map((l) => l.text).filter(Boolean);
    if (!lines.length) lines.push(" ");
    const size = block.size;
    const y = H / 2 + size * 0.35;
    const pre = block.prefix || "";
    const preW = pre ? ctx.m(pre, size, weight, role) : 0;
    const fill = fillOf(ctx, block.color);
    const curCol = block.color === "gradient" ? p.accent2 : fill;
    let b = bgOf(ctx, W, H);
    const xOf = (t) => {
      const tw = ctx.m(t, size, weight, role);
      return block.align === "left" ? 36 + preW : (W - preW - tw) / 2 + preW;
    };
    const phrases = lines.map((t) => fit(ctx.m, t, size, W - 80 - preW, weight, role));
    if (pre) {
      const px = block.align === "left" ? 36 : xOf(phrases[0]) - preW;
      b += txt(ctx, px, y, pre, size, p.muted, { role, weight });
    }
    if (block.effect === "type" || !ctx.mo.on) {
      b += typing(ctx, phrases.map((t) => ({ lines: [{ text: t, x: xOf(t), y }] })), {
        size, weight, role, fill, cursor: block.cursor, cursorColor: curCol, cps: block.speed, pause: block.pause, loop: true,
      });
    } else {
      const slot = 0.6 + block.pause;
      const total = slot * phrases.length;
      phrases.forEach((t, i) => {
        const a = (i * slot) / total;
        const z = ((i + 1) * slot) / total;
        const fadeIn = Math.min(0.5 / total, (z - a) / 3);
        const kt = [0, a, a + fadeIn, z - fadeIn, z, 1].map((v) => Math.min(1, v).toFixed(4));
        const vis = phrases.length === 1 ? "1;1;1;1;1;1" : "0;0;1;1;0;0";
        let anim = `<animate attributeName="opacity" values="${vis}" keyTimes="${kt.join(";")}" dur="${total.toFixed(2)}s" repeatCount="indefinite"/>`;
        if (block.effect === "slide" && phrases.length > 1) {
          anim += `<animateTransform attributeName="transform" type="translate" values="0 ${size * 0.6};0 ${size * 0.6};0 0;0 0;0 ${-size * 0.6};0 ${-size * 0.6}" keyTimes="${kt.join(";")}" dur="${total.toFixed(2)}s" repeatCount="indefinite"/>`;
        }
        b += `<g opacity="${i === 0 ? 1 : 0}">${txt(ctx, xOf(t), y, t, size, fill, { role, weight })}${anim}</g>`;
      });
    }
    return single(ctx, W, H, b, lines.join(" · "));
  },
};

// ───────────────────────── About
const about = {
  label: "About me",
  icon: "mdi:account-heart",
  defaults: (login, T) => ({
    title: T("About me"),
    icon: "mdi:account-heart",
    columns: 1,
    items: [
      { icon: "mdi:briefcase-variant", label: T("I work on web projects and developer tools") },
      { icon: "mdi:school", label: T("Learning Rust and systems design") },
      { icon: "mdi:handshake", label: T("Open to collaborating on open source projects") },
      { icon: "mdi:lightning-bolt", label: T("Fun fact: I write better code late at night") },
    ],
    card: true,
  }),
  fields: [
    { t: "group", l: "Content" },
    { k: "title", t: "text", l: "Title" },
    { k: "icon", t: "icon", l: "Title icon" },
    { k: "items", t: "list", l: "Items", add: { icon: "mdi:star", label: "Something about you" }, fields: [{ k: "icon", t: "icon", l: "Icon" }, { k: "label", t: "text", l: "Text" }], title: (x) => x.label },
    { t: "group", l: "Design" },
    { k: "columns", t: "select", l: "Columns", o: [[1, "1 column"], [2, "2 columns"]] },
  ],
  render(ctx) {
    const { p, block } = ctx;
    const W = ctx.W;
    const cols = Number(block.columns) || 1;
    const rowH = 50;
    const gap = 28;
    const colW = (W - 56 - gap * (cols - 1)) / cols;
    const rows = Math.ceil((block.items?.length || 0) / cols);
    const top = block.title ? 84 : 22;
    const H = top + rows * rowH + 18;
    let b = bgOf(ctx, W, H);
    if (block.title) b += sectionTitle(ctx, 28, 26, block.title, block.icon);
    const acc = ACC(p);
    (block.items || []).forEach((it, n) => {
      const x = 28 + (n % cols) * (colW + gap);
      const y = top + Math.floor(n / cols) * rowH;
      const mid = y + rowH / 2;
      let g = badge(ctx, x, mid - 17, 34, it.icon, acc[n % 3]);
      g += txt(ctx, x + 48, mid + 5.5, fit(ctx.m, it.label, 16, colW - 56, 500), 16, p.text, { weight: 500 });
      b += `<g${enter(ctx, 0.12 + n * 0.07)}>${g}</g>`;
    });
    return single(ctx, W, H, b, block.title || L(ctx, "About me"));
  },
};

// ───────────────────────── Stack
const stack = {
  label: "Tech stack",
  icon: "mdi:layers-triple",
  defaults: (login, T) => ({
    title: T("Tech stack"),
    icon: "mdi:code-braces",
    style: "chips",
    iconColor: "original",
    groupTitles: true,
    groups: [
      {
        title: T("Languages"),
        items: [
          { icon: "logos:typescript-icon", label: "TypeScript" },
          { icon: "logos:javascript", label: "JavaScript" },
          { icon: "logos:python", label: "Python" },
        ],
      },
      {
        title: T("Frameworks"),
        items: [
          { icon: "logos:react", label: "React" },
          { icon: "logos:nodejs-icon", label: "Node.js" },
          { icon: "logos:tailwindcss-icon", label: "Tailwind" },
        ],
      },
      {
        title: T("Tools"),
        items: [
          { icon: "logos:git-icon", label: "Git" },
          { icon: "logos:docker-icon", label: "Docker" },
          { icon: "logos:figma", label: "Figma" },
          { icon: "logos:visual-studio-code", label: "VS Code" },
        ],
      },
    ],
    card: true,
  }),
  fields: [
    { t: "group", l: "Content" },
    { k: "title", t: "text", l: "Title" },
    { k: "icon", t: "icon", l: "Title icon" },
    {
      k: "groups", t: "list", l: "Groups", add: { title: "New group", items: [] }, title: (x) => x.title || "Group",
      fields: [
        { k: "title", t: "text", l: "Group name" },
        { k: "items", t: "list", l: "Tech stack", add: { icon: "logos:github-icon", label: "New" }, fields: [{ k: "icon", t: "icon", l: "Icon" }, { k: "label", t: "text", l: "Name" }], title: (x) => x.label },
      ],
    },
    { t: "group", l: "Design" },
    { k: "style", t: "select", l: "Style", o: [["chips", "Pills"], ["tiles", "Named tiles"], ["icons", "Icons only"]] },
    { k: "iconColor", t: "select", l: "Icon color", o: [["original", "Original (brand)"], ["accent", "Main accent"], ["text", "Text color"]] },
    { k: "groupTitles", t: "toggle", l: "Show group names" },
  ],
  render(ctx) {
    const { p, block } = ctx;
    const W = ctx.W;
    const mono = block.iconColor !== "original";
    const icCol = block.iconColor === "text" ? p.text : p.accent;
    const acc = ACC(p);
    const rr = Math.min(14, ctx.cfg.style.radius);
    let y = block.title ? 84 : 26;
    let d = 0.1;
    let g = "";
    (block.groups || []).forEach((group, gi) => {
      const t = acc[gi % 3];
      if (block.groupTitles && group.title) {
        g += `<g${enter(ctx, d)}><circle cx="32" cy="${y + 8}" r="4" fill="${t}"/>${txt(ctx, 44, y + 12.5, group.title.toUpperCase(), 12, p.muted, { weight: 700, ls: 1.2 })}</g>`;
        y += 26;
      }
      let x = 28;
      const items = group.items || [];
      if (block.style === "chips") {
        for (const it of items) {
          const w = chip(ctx, 0, 0, it.label, { icon: it.icon, iconSize: 20, h: 40 })[1];
          if (x + w > W - 28) {
            x = 28;
            y += 48;
          }
          g += chip(ctx, x, y, it.label, { icon: it.icon, iconSize: 20, h: 40, delay: d, mono, iconColor: icCol, tint: t })[0];
          x += w + 8;
          d += 0.04;
        }
        y += 40 + 22;
      } else {
        const tiles = block.style === "tiles";
        const tile = tiles ? 92 : 56;
        const th = tiles ? 88 : 56;
        const gap = 8;
        const isz = tiles ? 34 : 28;
        const perRow = Math.max(1, Math.floor((W - 56 + gap) / (tile + gap)));
        // Without a title the grid sits centred, like the rest of a centred README
        const rowX = (n) => (block.title ? 28 : (W - Math.min(perRow, items.length - n) * (tile + gap) + gap) / 2);
        x = rowX(0);
        items.forEach((it, n) => {
          if (n && n % perRow === 0) {
            x = rowX(n);
            y += th + gap;
          }
          let s = `<rect x="${x}" y="${y}" width="${tile}" height="${th}" rx="${rr}" fill="${p.bg2}"/>`;
          if (tiles) {
            s += icon(ctx, it.icon, x + (tile - isz) / 2, y + 15, isz, icCol, mono);
            s += txt(ctx, x + tile / 2, y + 72, fit(ctx.m, it.label, 12, tile - 12, 600), 12, p.text, { weight: 600, anchor: "middle" });
          } else s += icon(ctx, it.icon, x + (tile - isz) / 2, y + (th - isz) / 2, isz, icCol, mono);
          g += `<g${enter(ctx, d)}>${s}</g>`;
          x += tile + gap;
          d += 0.04;
        });
        y += th + 24;
      }
    });
    const H = y + 4;
    let b = bgOf(ctx, W, H);
    if (block.title) b += sectionTitle(ctx, 28, 26, block.title, block.icon);
    return single(ctx, W, H, b + g, block.title || L(ctx, "Tech stack"));
  },
};

// ───────────────────────── Stats
export const METRICS = {
  stars: ["Stars", "mdi:star"],
  contributions: ["Contributions (year)", "mdi:source-commit"],
  commits: ["Commits (year)", "mdi:source-branch"],
  prs: ["Pull requests", "mdi:source-pull"],
  issues: ["Issues", "mdi:alert-circle-outline"],
  repos: ["Repositories", "mdi:book-open-variant"],
  followers: ["Followers", "mdi:account-group"],
  following: ["Following", "mdi:account-plus"],
  forks: ["Forks received", "mdi:source-fork"],
};

function languagesSvg(ctx, y, x0, width) {
  const { p, block, data } = ctx;
  const langs = (data.languages || []).slice(0, block.langCount || 6);
  const total = langs.reduce((a, [, v]) => a + v, 0) || 1;
  const theme = [p.accent, p.accent2, p.accent3, mix(p.accent, p.bg, 0.45), mix(p.accent2, p.bg, 0.45), mix(p.accent3, p.text, 0.35)];
  const colorOfLang = (name, i) => (block.langColors === "theme" ? theme[i % 6] : LANG_COLORS[name] ?? mix(p.accent, p.muted, (i % 4) / 4));
  let s = "";
  if (!langs.length) return ["", 0];
  if (block.langTitle) {
    s += `<g${enter(ctx, 0.3)}>${txt(ctx, x0, y + 14, block.langTitle, 14, p.muted, { weight: 600 })}</g>`;
    y += 28;
  }
  if (block.langStyle === "donut") {
    const R = 58;
    const cx = x0 + R + 10;
    const cy = y + R + 10;
    const C = 2 * Math.PI * R;
    let acc = 0;
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" stroke="${p.bg2}" stroke-width="20"/>`;
    langs.forEach(([name, v], i) => {
      const frac = v / total;
      const len = Math.max(0, frac * C - 3);
      const anim = smil(ctx, `<animate attributeName="stroke-dasharray" from="0 ${n1(C)}" to="${n1(len)} ${n1(C)}" dur="${(1.1 / sp(ctx)).toFixed(2)}s" begin="${((0.3 + i * 0.12) / sp(ctx)).toFixed(2)}s" fill="freeze" calcMode="spline" keySplines=".16 1 .3 1" keyTimes="0;1"/>`, false);
      const da = ctx.mo.on ? `0 ${n1(C)}` : `${n1(len)} ${n1(C)}`;
      s += `<circle cx="${cx}" cy="${cy}" r="${R}" stroke="${colorOfLang(name, i)}" stroke-width="20" stroke-dasharray="${da}" stroke-dashoffset="${n1(-acc * C)}" transform="rotate(-90 ${cx} ${cy})">${anim}</circle>`;
      acc += frac;
    });
    s += txt(ctx, cx, cy + 8, String(langs.length), 24, p.text, { role: "h", anchor: "middle" });
    const lx = x0 + 2 * R + 52;
    const colW = (width - (lx - x0)) / 2;
    langs.forEach(([name, v], i) => {
      const lxx = lx + (i % 2) * colW;
      const ly = y + 22 + Math.floor(i / 2) * 34;
      s += `<g${enter(ctx, 0.4 + i * 0.06)}><circle cx="${n1(lxx + 5)}" cy="${ly - 5}" r="5" fill="${colorOfLang(name, i)}"/>${txt(ctx, lxx + 18, ly, fit(ctx.m, name, 15, colW - 80, 600), 15, p.text, { weight: 600 })}${txt(ctx, lxx + colW - 16, ly, ((v / total) * 100).toFixed(1) + "%", 14, p.muted, { anchor: "end" })}</g>`;
    });
    const rows = Math.ceil(langs.length / 2);
    return [s, (block.langTitle ? 28 : 0) + Math.max(2 * R + 20, rows * 34 + 12)];
  }
  // Segmented bar: one rounded segment per language with a small gap between them
  const bh = 10;
  let x = x0;
  let segs = "";
  langs.forEach(([name, v], i) => {
    const w = (v / total) * width;
    const sw = Math.max(0, w - (i < langs.length - 1 ? 3 : 0));
    segs += `<rect x="${n1(x)}" y="${y}" width="${n1(sw)}" height="${bh}" rx="${n1(Math.min(bh / 2, sw / 2))}" fill="${colorOfLang(name, i)}"/>`;
    x += w;
  });
  const growCls = ctx.mo.on ? ` class="gx" style="${delayStyle(ctx, 0.3)}"` : "";
  s += `<rect x="${x0}" y="${y}" width="${n1(width)}" height="${bh}" rx="${bh / 2}" fill="${p.bg2}"/><g${growCls}>${segs}</g>`;
  let lx = x0;
  let ly = y + bh + 26;
  langs.forEach(([name, v], i) => {
    const pct = ((v / total) * 100).toFixed(1) + "%";
    const w = 18 + ctx.m(name, 14, 600) + 6 + ctx.m(pct, 14) + 22;
    if (lx + w > x0 + width) {
      lx = x0;
      ly += 26;
    }
    s += `<g${enter(ctx, 0.45 + i * 0.05)}><circle cx="${n1(lx + 5)}" cy="${ly - 5}" r="5" fill="${colorOfLang(name, i)}"/>${txt(ctx, lx + 16, ly, name, 14, p.text, { weight: 600 })}${txt(ctx, lx + 22 + ctx.m(name, 14, 600), ly, pct, 14, p.muted)}</g>`;
    lx += w;
  });
  return [s, (block.langTitle ? 28 : 0) + (ly - y) + 8];
}

const stats = {
  label: "Stats",
  icon: "mdi:chart-box",
  defaults: (login, T) => ({
    title: T("GitHub stats"),
    icon: "mdi:chart-box-outline",
    metrics: [
      { key: "stars", label: T("Stars"), icon: "mdi:star" },
      { key: "contributions", label: T("Contributions (year)"), icon: "mdi:source-commit" },
      { key: "repos", label: T("Repositories"), icon: "mdi:book-open-variant" },
      { key: "followers", label: T("Followers"), icon: "mdi:account-group" },
    ],
    roll: true,
    short: true,
    languages: true,
    langTitle: T("Most used languages"),
    langStyle: "bar",
    langColors: "github",
    langCount: 6,
    card: true,
  }),
  fields: [
    { t: "group", l: "Metrics" },
    { k: "title", t: "text", l: "Title" },
    { k: "icon", t: "icon", l: "Title icon" },
    {
      k: "metrics", t: "list", l: "Metrics", add: { key: "forks", label: "Forks received", icon: "mdi:source-fork" }, title: (x) => x.label,
      fields: [
        { k: "key", t: "select", l: "Data", o: Object.entries(METRICS).map(([k, [l]]) => [k, l]) },
        { k: "label", t: "text", l: "Label" },
        { k: "icon", t: "icon", l: "Icon" },
      ],
    },
    { k: "roll", t: "toggle", l: "Numbers with counter effect" },
    { k: "short", t: "toggle", l: "Shorten big numbers (12.3k)" },
    { t: "group", l: "Languages" },
    { k: "languages", t: "toggle", l: "Show languages" },
    { k: "langTitle", t: "text", l: "Languages title" },
    { k: "langStyle", t: "select", l: "Chart", o: [["bar", "Segmented bar"], ["donut", "Donut"]] },
    { k: "langColors", t: "select", l: "Colors", o: [["github", "GitHub colors"], ["theme", "Theme colors"]] },
    { k: "langCount", t: "range", l: "Number of languages", min: 2, max: 10, step: 1 },
  ],
  render(ctx) {
    const { p, block, data } = ctx;
    const W = ctx.W;
    const metrics = block.metrics || [];
    const perRow = Math.min(4, Math.max(1, metrics.length));
    const gap = 10;
    const colW = (W - 56 - gap * (perRow - 1)) / perRow;
    const tileH = 126;
    const rr = Math.min(14, ctx.cfg.style.radius);
    const acc = ACC(p);
    let y = block.title ? 84 : 24;
    let b = "";
    metrics.forEach((mt, i) => {
      const x = 28 + (i % perRow) * (colW + gap);
      const yy = y + Math.floor(i / perRow) * (tileH + gap);
      const raw = (mt.key === "repos" ? data.repoCount : data[mt.key]) ?? 0;
      const val = block.short ? shortNum(raw) : String(raw);
      let t = `<rect x="${n1(x)}" y="${yy}" width="${n1(colW)}" height="${tileH}" rx="${rr}" fill="${p.bg2}"/>`;
      t += badge(ctx, x + 16, yy + 16, 34, mt.icon || METRICS[mt.key]?.[1], acc[i % 3]);
      t += txt(ctx, x + 16, yy + 110, fit(ctx.m, mt.label, 13, colW - 26, 600), 13, p.muted, { weight: 600 });
      b += `<g${enter(ctx, 0.1 + i * 0.07)}>${t}</g>`;
      b += odometer(ctx, x + 16, yy + 84, val, 30, p.text, { roll: block.roll, delay: 0.25 + i * 0.07 });
    });
    y += Math.ceil(metrics.length / perRow) * (tileH + gap) + 12;
    if (block.languages && data.languages?.length) {
      const [ls, lh] = languagesSvg(ctx, y, 30, W - 60);
      b += ls;
      y += lh + 20;
    }
    const H = y + 8;
    const head = bgOf(ctx, W, H) + (block.title ? sectionTitle(ctx, 28, 26, block.title, block.icon) : "");
    return single(ctx, W, H, head + b, block.title || L(ctx, "GitHub stats"));
  },
};

// ───────────────────────── Calendar
// Dot radius per activity level, as a fraction of half a cell
const DOT = [0.18, 0.46, 0.66, 0.84, 1.04];

const calendar = {
  label: "Calendar",
  icon: "mdi:calendar-month",
  defaults: (login, T) => ({
    title: T("Contributions"),
    icon: "mdi:calendar-month-outline",
    weeks: 30,
    cell: "rounded",
    colors: "accent",
    months: true,
    total: true,
    totalLabel: T("contributions in the last year"),
    monthNames: T(MONTHS),
    card: true,
  }),
  fields: [
    { t: "group", l: "Content" },
    { k: "title", t: "text", l: "Title" },
    { k: "icon", t: "icon", l: "Title icon" },
    { k: "weeks", t: "range", l: "Visible weeks", min: 8, max: 53, step: 1 },
    { k: "months", t: "toggle", l: "Show months" },
    { k: "monthNames", t: "text", l: "Month names (comma separated)" },
    { k: "total", t: "toggle", l: "Show total" },
    { k: "totalLabel", t: "text", l: "Total text" },
    { t: "group", l: "Style" },
    { k: "cell", t: "select", l: "Cells", o: [["rounded", "Rounded"], ["square", "Square"], ["circle", "Circles"], ["halftone", "Dots (size by activity)"]] },
    { k: "colors", t: "select", l: "Color", o: [["accent", "Main accent"], ["accent2", "Accent 2"], ["accent3", "Accent 3"], ["green", "GitHub green"]] },
  ],
  render(ctx) {
    const { p, block, data } = ctx;
    const W = ctx.W;
    const weeks = Math.max(4, Math.min(53, block.weeks || 30));
    const days = data.calendar || [];
    const byDate = new Map(days.map((d) => [d.date, d.count]));
    const today = data.today ? new Date(data.today + "T12:00:00Z") : new Date();
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - end.getUTCDay() - (weeks - 1) * 7);
    const gap = 4;
    const leftPad = 30;
    const cs = Math.min(18, (W - leftPad * 2 - gap * (weeks - 1)) / weeks);
    const gridW = weeks * cs + (weeks - 1) * gap;
    const x0 = (W - gridW) / 2;
    const y0 = (block.title ? 86 : 28) + (block.months ? 22 : 0);
    const counts = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      if (d > end) break;
      counts.push(byDate.get(d.toISOString().slice(0, 10)) ?? 0);
    }
    const nz = counts.filter((c) => c > 0).sort((a, b) => a - b);
    const q = (f) => nz[Math.floor(f * (nz.length - 1))] ?? 1;
    const th = [q(0.25), q(0.5), q(0.75)];
    const level = (c) => (c <= 0 ? 0 : c <= th[0] ? 1 : c <= th[1] ? 2 : c <= th[2] ? 3 : 4);
    const base = block.colors === "green" ? (p.dark ? "#39d353" : "#216e39") : p[block.colors] ?? p.accent;
    const dots = block.cell === "halftone";
    const scale = [p.bg2, mix(p.bg2, base, 0.35), mix(p.bg2, base, 0.6), mix(p.bg2, base, 0.82), base];
    const rx = block.cell === "circle" ? cs / 2 : block.cell === "square" ? 1.5 : cs * 0.28;
    const anim = ctx.mo.on && ctx.mo.entrance !== "none";
    const cell = (x, y, lv, delay) => {
      if (dots) {
        const r = (cs / 2) * DOT[lv];
        const cls = anim ? ` class="dg" style="${delayStyle(ctx, delay)}"` : "";
        return lv ? `<circle${cls} cx="${n1(x + cs / 2)}" cy="${n1(y + cs / 2)}" r="${n1(r)}" fill="${base}"/>` : `<circle cx="${n1(x + cs / 2)}" cy="${n1(y + cs / 2)}" r="${n1(r)}" fill="${p.muted}" opacity=".45"/>`;
      }
      const e = anim ? ` class="e" style="${delayStyle(ctx, delay)}"` : "";
      return `<rect${e} x="${n1(x)}" y="${n1(y)}" width="${n1(cs)}" height="${n1(cs)}" rx="${n1(rx)}" fill="${scale[lv]}"/>`;
    };
    let grid = "";
    let labels = "";
    const fallback = L(ctx, MONTHS).split(",");
    const names = String(block.monthNames || fallback.join(",")).split(",").map((s) => s.trim());
    let lastMonth = -1;
    for (let w = 0; w < weeks; w++) {
      for (let dd = 0; dd < 7; dd++) {
        const i = w * 7 + dd;
        if (i >= counts.length) break;
        const date = new Date(start);
        date.setUTCDate(start.getUTCDate() + i);
        if (dd === 0 && block.months && date.getUTCMonth() !== lastMonth && date.getUTCDate() <= 7 && w < weeks - 1) {
          lastMonth = date.getUTCMonth();
          labels += txt(ctx, x0 + w * (cs + gap), y0 - 10, names[lastMonth] ?? fallback[lastMonth], 12, p.muted, { weight: 600 });
        }
        grid += cell(x0 + w * (cs + gap), y0 + dd * (cs + gap), level(counts[i]), 0.1 + (w + dd) * 0.016);
      }
    }
    let b = labels + grid;
    let H = y0 + 7 * (cs + gap) + 18;
    if (block.total) {
      const sum = counts.reduce((a, c) => a + c, 0);
      const total = data.calendarTotal ?? sum;
      b += `<g${enter(ctx, 0.4)}>${txt(ctx, x0, H + 8, `${total.toLocaleString(locale(langOf(ctx)))} ${block.totalLabel}`, 14, p.muted, { weight: 600 })}</g>`;
      // Legend uses the same marks as the grid
      const lx = x0 + gridW - 5 * 16;
      for (let i = 0; i < 5; i++) {
        if (dots) b += `<circle cx="${n1(lx + i * 16 + 6)}" cy="${H + 3}" r="${n1(6 * DOT[i])}" fill="${i ? base : p.muted}"${i ? "" : ' opacity=".45"'}/>`;
        else b += `<rect x="${n1(lx + i * 16)}" y="${H - 3}" width="12" height="12" rx="${block.cell === "circle" ? 6 : 3}" fill="${scale[i]}"/>`;
      }
      H += 30;
    }
    const head = bgOf(ctx, W, H) + (block.title ? sectionTitle(ctx, 28, 26, block.title, block.icon) : "");
    return single(ctx, W, H, head + b, block.title || L(ctx, "Contributions"));
  },
};

// ───────────────────────── Streak
const streak = {
  label: "Streak",
  icon: "mdi:fire",
  defaults: (login, T) => ({
    title: "",
    icon: "mdi:fire",
    total: T("Total contributions"),
    current: T("Current streak"),
    longest: T("Longest streak"),
    days: T("days"),
    strip: true,
    card: true,
  }),
  fields: [
    { t: "group", l: "Texts" },
    { k: "title", t: "text", l: "Title (optional)" },
    { k: "icon", t: "icon", l: "Title icon" },
    { k: "total", t: "text", l: "Total label" },
    { k: "current", t: "text", l: "Current streak label" },
    { k: "longest", t: "text", l: "Longest streak label" },
    { k: "days", t: "text", l: "Word for 'days'" },
    { t: "group", l: "Design" },
    { k: "strip", t: "toggle", l: "Bars for recent days with the streak highlighted" },
  ],
  render(ctx) {
    const { p, block, data } = ctx;
    const W = ctx.W;
    const top = block.title ? 80 : 24;
    const st = data.streak || { current: 0, longest: 0 };
    const gap = 10;
    const colW = (W - 56 - gap * 2) / 3;
    const tileH = 148;
    const rr = Math.min(14, ctx.cfg.style.radius);
    const cols = [
      [shortNum(data.contributions ?? 0), block.total, data.rangeLabel ?? "", "mdi:source-commit", p.accent],
      [String(st.current), block.current, block.days, block.icon || "mdi:fire", p.accent2],
      [String(st.longest), block.longest, block.days, "mdi:trophy-outline", p.accent3],
    ];
    let b = "";
    cols.forEach(([val, label, sub, ic, col], i) => {
      const x = 28 + i * (colW + gap);
      const big = i === 1;
      // The current streak is the hero: tinted tile with a gradient edge and gradient digits
      let t = `<rect x="${n1(x + 0.75)}" y="${top + 0.75}" width="${n1(colW - 1.5)}" height="${tileH - 1.5}" rx="${rr}" fill="${big ? tint(p, p.accent2) : p.bg2}"${big ? ` stroke="${grad(ctx)}" stroke-width="1.5"` : ""}/>`;
      t += badge(ctx, x + 18, top + 18, 34, ic, col);
      t += txt(ctx, x + 18, top + 116, fit(ctx.m, label, 14, colW - 30, 600), 14, big ? p.text : p.muted, { weight: big ? 700 : 600 });
      if (sub) t += txt(ctx, x + 18, top + 134, fit(ctx.m, sub, 12.5, colW - 30), 12.5, p.muted, { opacity: 0.85 });
      b += `<g${enter(ctx, 0.1 + i * 0.1)}>${t}</g>`;
      const size = big ? 46 : 34;
      const fill = big ? gradSpan(ctx, x + 18, x + 18 + ctx.m(val, size, ctx.cfg.font.headingWeight, "h")) : p.text;
      b += odometer(ctx, x + 18, top + 92, val, size, fill, { roll: true, delay: 0.25 + i * 0.1 });
    });
    let H = top + tileH + 18;
    // Activity bars for the last weeks; the run of the current streak lights up in the accent gradient
    const days = [...(data.calendar || [])].sort((a, z) => (a.date < z.date ? -1 : 1));
    if (block.strip !== false && days.length) {
      const pitch = 10;
      const n = Math.min(days.length, Math.floor((W - 56) / pitch));
      const shown = days.slice(-n);
      const max = Math.max(1, ...shown.map((d) => d.count));
      let endI = shown.length - 1;
      if (shown[endI]?.count === 0) endI--;
      const runStart = Math.max(0, endI - st.current + 1);
      const base = H + 34;
      const x0 = (W - n * pitch) / 2;
      const hot = gradSpan(ctx, x0 + runStart * pitch, x0 + (endI + 1) * pitch);
      let bars = "";
      shown.forEach((d, i) => {
        const bh = d.count ? 6 + 26 * Math.sqrt(d.count / max) : 3;
        const inRun = st.current > 0 && i >= runStart && i <= endI;
        const fill = inRun ? hot : d.count ? p.muted : p.border;
        const op = inRun ? "" : d.count ? ' opacity=".45"' : "";
        const cls = ctx.mo.on && ctx.mo.entrance !== "none" ? ` class="gy" style="${delayStyle(ctx, 0.4 + i * 0.01)}"` : "";
        bars += `<rect${cls} x="${n1(x0 + i * pitch + 2)}" y="${n1(base - bh)}" width="6" height="${n1(bh)}" rx="3" fill="${fill}"${op}/>`;
      });
      b += bars;
      H = base + 20;
    }
    const head = bgOf(ctx, W, H) + (block.title ? sectionTitle(ctx, 28, 26, block.title, block.icon) : "");
    return single(ctx, W, H, head + b, block.current);
  },
};

// ───────────────────────── Projects (one svg per card)
function projectIcon(ctx, repo, override) {
  if (override) return override;
  const name = LANG_ICONS[repo.language];
  if (name && ctx.env.icons?.[name] !== null) return name;
  return "mdi:folder-star";
}

export function projectList(block, data) {
  // The profile repo (named like the user) holds this README, it is not a project
  const own = (r) => r.name.toLowerCase() !== String(data.login).toLowerCase();
  const all = (data.repos || []).filter(own);
  const count = block.count || 4;
  if (block.source === "manual") {
    return (block.items || [])
      .map((it) => {
        const r = all.find((x) => x.name.toLowerCase() === String(it.name).toLowerCase());
        const base = r ?? { name: it.name, url: it.url || "#", desc: "", stars: 0, forks: 0, language: null, fork: false };
        return { ...base, desc: it.desc || base.desc, icon: it.icon || null, url: it.url || base.url };
      })
      .filter((r) => r.name);
  }
  if (block.source === "pinned" && data.pinned?.length) return data.pinned.filter(own).slice(0, count);
  if (block.source === "recent") return all.filter((r) => !r.fork).sort((a, b) => String(b.pushed ?? "").localeCompare(String(a.pushed ?? ""))).slice(0, count);
  return all.filter((r) => !r.fork).sort((a, b) => b.stars - a.stars).slice(0, count);
}

const projects = {
  label: "Projects",
  icon: "mdi:folder-star",
  defaults: (login, T) => ({
    source: "top",
    count: 4,
    items: [],
    columns: 2,
    showDesc: true,
    showLang: true,
    showStars: true,
    showForks: true,
    decor: true,
    empty: T("No description yet."),
    card: true,
  }),
  fields: [
    { t: "group", l: "Repositories" },
    { k: "source", t: "select", l: "Source", o: [["top", "Most stars"], ["recent", "Recently updated"], ["pinned", "Pinned (needs a token)"], ["manual", "Pick manually"]] },
    { k: "count", t: "range", l: "Count", min: 1, max: 10, step: 1, if: (b) => b.source !== "manual" },
    {
      k: "items", t: "list", l: "Chosen repos", add: { name: "", desc: "", icon: "" }, title: (x) => x.name || "(no name)", if: (b) => b.source === "manual",
      fields: [
        { k: "name", t: "repo", l: "Repository" },
        { k: "desc", t: "text", l: "Custom description (optional)" },
        { k: "icon", t: "icon", l: "Icon (optional)" },
      ],
    },
    { k: "empty", t: "text", l: "Text when there is no description" },
    { t: "group", l: "Card" },
    { k: "columns", t: "select", l: "Columns", o: [[2, "2 per row"], [1, "1 per row"]] },
    { k: "showDesc", t: "toggle", l: "Description" },
    { k: "showLang", t: "toggle", l: "Language" },
    { k: "showStars", t: "toggle", l: "Stars" },
    { k: "showForks", t: "toggle", l: "Forks" },
    { k: "decor", t: "toggle", l: "Color light and big background icon" },
  ],
  render(ctx) {
    const { p, block, data } = ctx;
    const cols = Number(block.columns) || 2;
    const w = cols === 2 ? (ctx.W - 12) / 2 : ctx.W;
    const h = cols === 2 ? 180 : 152;
    const list = projectList(block, data);
    const acc = ACC(p);
    return list.map((r, i) => {
      const c = ctx.fork(i);
      let b = bgOf(c, w, h);
      const t = acc[i % 3];
      const ic = projectIcon(c, r, r.icon);
      // A soft light in the corner and the repo's icon, large and faint, running off the edge
      if (block.decor) {
        const [dg, fg] = glow(c, w, 0, h * 1.1, t, p.dark ? 0.3 : 0.18);
        b += clipCard(c, w, h, `${dg}<rect width="${n1(w)}" height="${h}" fill="${fg}"/><g opacity="${p.dark ? 0.08 : 0.06}">${icon(c, ic, w - 124, -26, 160, t, true)}</g>`);
      }
      const logo = ic.startsWith("logos:");
      b += `<g${enter(c, 0.05)}>${logo ? `<rect x="22" y="22" width="34" height="34" rx="10" fill="${p.bg2}"/>${icon(c, ic, 29, 29, 20, p.accent)}` : badge(c, 22, 22, 34, ic, t)}</g>`;
      const nameMax = w - 96 - (r.fork ? 60 : 0);
      b += `<g${enter(c, 0.12)}>${txt(c, 68, 45, fit(c.m, r.name, 18, nameMax, c.cfg.font.headingWeight, "h"), 18, p.text, { role: "h" })}`;
      if (r.fork) {
        const fx = 68 + Math.min(nameMax, c.m(r.name, 18, c.cfg.font.headingWeight, "h")) + 10;
        b += `<rect x="${n1(fx)}" y="30" width="46" height="20" rx="10" fill="none" stroke="${p.border}" stroke-width="1.5"/>${txt(c, fx + 23, 44, "fork", 12, p.muted, { anchor: "middle", weight: 600 })}`;
      }
      b += "</g>";
      if (block.showDesc) {
        const lines = wrap(c.m, r.desc || block.empty, 14.5, w - 52, 400, "b", 2);
        lines.forEach((l, k) => (b += `<g${enter(c, 0.2 + k * 0.05)}>${txt(c, 24, 88 + k * 22, l, 14.5, r.desc ? p.text : p.muted)}</g>`));
      }
      const fy = h - 24;
      let fx = 24;
      let foot = "";
      if (block.showLang && r.language) {
        foot += `<circle cx="${fx + 5}" cy="${fy - 5}" r="5" fill="${LANG_COLORS[r.language] ?? t}"/>` + txt(c, fx + 16, fy, r.language, 13.5, p.text, { weight: 600 });
        fx += 32 + c.m(r.language, 13.5, 600);
      }
      if (block.showStars) {
        foot += icon(c, "mdi:star-outline", fx, fy - 14, 17, p.muted) + txt(c, fx + 21, fy, shortNum(r.stars), 13.5, p.text, { weight: 600 });
        fx += 36 + c.m(shortNum(r.stars), 13.5, 600);
      }
      if (block.showForks) foot += icon(c, "mdi:source-fork", fx, fy - 14, 17, p.muted) + txt(c, fx + 21, fy, shortNum(r.forks ?? 0), 13.5, p.text, { weight: 600 });
      b += `<g${enter(c, 0.3)}>${foot}</g>`;
      return { svg: svgDoc(c, w, h, b, r.name), alt: r.name, link: r.url, width: cols === 2 ? "49%" : "100%", suffix: r.name, row: cols };
    });
  },
};

// ───────────────────────── Socials (one svg per link)
const socials = {
  label: "Social links",
  icon: "mdi:share-variant",
  defaults: (login, T) => ({
    items: [
      { icon: "mdi:github", label: "GitHub", url: `https://github.com/${login || ""}` },
      { icon: "mdi:linkedin", label: "LinkedIn", url: "https://linkedin.com/in/" },
      { icon: "ri:twitter-x-fill", label: "X", url: "https://x.com/" },
      { icon: "ic:baseline-discord", label: "Discord", url: "https://discord.com/" },
      { icon: "mdi:email", label: T("Email"), url: T("mailto:you@email.com") },
    ],
    style: "chip",
    color: "brand",
    size: 42,
    card: true,
  }),
  fields: [
    { t: "group", l: "Links" },
    { k: "items", t: "list", l: "Profiles", add: { icon: "mdi:web", label: "Web", url: "https://" }, title: (x) => x.label || x.url, fields: [{ k: "icon", t: "icon", l: "Icon" }, { k: "label", t: "text", l: "Text" }, { k: "url", t: "text", l: "URL" }] },
    { t: "group", l: "Style" },
    { k: "style", t: "select", l: "Shape", o: [["chip", "Pill with text"], ["ticket", "Ticket with text"], ["icon", "Square icon"], ["circle", "Round icon"]] },
    { k: "color", t: "select", l: "Color", o: [["brand", "Brand colors"], ["accent", "Main accent"], ["tonal", "Soft"], ["outline", "Outline"]] },
    { k: "size", t: "range", l: "Size", min: 32, max: 72, step: 2 },
  ],
  render(ctx) {
    const { p, block } = ctx;
    const size = block.size || 42;
    return (block.items || []).map((it, i) => {
      const c = ctx.fork(i);
      const brand = brandColor(it.icon) || p.accent;
      const bgCol = block.color === "brand" ? brand : block.color === "accent" ? p.accent : null;
      const variant = bgCol ? "filled" : block.color === "outline" ? "outline" : "tonal";
      let w;
      let svgBody;
      const isz = Math.round(size * 0.48);
      if (block.style === "chip" || block.style === "ticket") {
        const [g, cw] = chip(c, 1, 1, it.label, { icon: it.icon, h: size - 2, size: Math.round(size * 0.34), iconSize: isz, variant, bg: bgCol, pad: Math.round(size * 0.38), mono: true, delay: i * 0.08, ticket: block.style === "ticket" });
        w = cw + 2;
        svgBody = g;
      } else {
        w = size;
        const fill = bgCol ?? (variant === "outline" ? "none" : tint(p, p.accent));
        const fg = bgCol ? readableOn(bgCol) : p.text;
        const stroke = variant === "outline" ? ` stroke="${p.border}" stroke-width="1.5"` : "";
        const shape = block.style === "circle" ? `<circle cx="${size / 2}" cy="${size / 2}" r="${n1(size / 2 - 1)}" fill="${fill}"${stroke}/>` : `<rect x="1" y="1" width="${size - 2}" height="${size - 2}" rx="${n1(Math.min(size * 0.3, c.cfg.style.chipRadius ?? 10))}" fill="${fill}"${stroke}/>`;
        svgBody = `<g${enter(c, i * 0.08)}>${shape}${icon(c, it.icon, (size - isz) / 2, (size - isz) / 2, isz, fg, true)}</g>`;
      }
      const doc = svgDoc(c, w, size, svgBody, it.label || "link");
      return { svg: doc, alt: it.label || it.icon, link: it.url, height: size, suffix: String(i + 1), inline: true };
    });
  },
};

// ───────────────────────── Buttons
const buttons = {
  label: "Buttons",
  icon: "mdi:gesture-tap-button",
  defaults: (login, T) => ({
    items: [
      { icon: "mdi:web", label: T("My portfolio"), url: "https://example.com", variant: "gradient" },
      { icon: "mdi:book-open-page-variant", label: T("View repositories"), url: `https://github.com/${login || ""}?tab=repositories`, variant: "tonal" },
    ],
    size: 48,
    card: true,
  }),
  fields: [
    { k: "items", t: "list", l: "Buttons", add: { icon: "mdi:link", label: "New button", url: "https://", variant: "tonal" }, title: (x) => x.label, fields: [
      { k: "icon", t: "icon", l: "Icon" }, { k: "label", t: "text", l: "Text" }, { k: "url", t: "text", l: "URL" },
      { k: "variant", t: "select", l: "Style", o: [["gradient", "Gradient"], ["filled", "Solid"], ["tonal", "Soft"], ["outline", "Outline"]] },
    ] },
    { k: "size", t: "range", l: "Height", min: 36, max: 64, step: 2 },
  ],
  render(ctx) {
    const { block } = ctx;
    const h = block.size || 48;
    return (block.items || []).map((it, i) => {
      const c = ctx.fork(i);
      const g = it.variant === "gradient";
      const opts = { icon: it.icon, h: h - 2, size: Math.round(h * 0.34), iconSize: Math.round(h * 0.42), pad: Math.round(h * 0.42), variant: g ? "filled" : it.variant, mono: true, delay: i * 0.08 };
      if (g) Object.assign(opts, { bg: grad(c), fg: "#ffffff", iconColor: "#ffffff" });
      const [body, w] = chip(c, 1, 1, it.label, opts);
      return { svg: svgDoc(c, w + 2, h, body, it.label), alt: it.label, link: it.url, height: h, suffix: String(i + 1), inline: true };
    });
  },
};

// ───────────────────────── Divider
const divider = {
  label: "Divider",
  icon: "mdi:minus",
  defaults: (login, T) => ({ style: "glow", height: 40, color: "gradient", thickness: 2, card: false }),
  fields: [
    { k: "style", t: "select", l: "Style", o: [["glow", "Light line"], ["line", "Line"], ["dots", "Pulsing dots"], ["wave", "Wave"], ["zigzag", "Zigzag"], ["halftone", "Dot wave"], ["perforation", "Cut here (scissors)"]] },
    { k: "color", t: "select", l: "Color", o: COLOR_OPTS },
    { k: "height", t: "range", l: "Height", min: 16, max: 120, step: 2 },
    { k: "thickness", t: "range", l: "Thickness", min: 1, max: 8, step: 0.5 },
  ],
  render(ctx) {
    const { p, block } = ctx;
    const W = ctx.W;
    const H = block.height;
    const style = DIVIDER_ALIAS[block.style] ?? block.style;
    const two = block.color === "gradient";
    const col = two ? p.accent : p[block.color] ?? p.accent;
    const sw = block.thickness;
    const mid = H / 2;
    let b = bgOf(ctx, W, H);
    if (style === "glow") {
      // A line that fades out at both ends, with a highlight travelling along it
      const id = ctx.uid("dl");
      const c2 = two ? p.accent2 : col;
      b += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="${W - 40}" y2="0"><stop offset="0" stop-color="${col}" stop-opacity="0"/><stop offset=".25" stop-color="${col}"/><stop offset=".75" stop-color="${c2}"/><stop offset="1" stop-color="${c2}" stop-opacity="0"/></linearGradient>`;
      b += `<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.text}" stop-opacity="0"/><stop offset=".5" stop-color="${p.text}" stop-opacity=".85"/><stop offset="1" stop-color="${p.text}" stop-opacity="0"/></linearGradient>`;
      b += `<rect x="40" y="${n1(mid - sw / 2)}" width="${W - 80}" height="${sw}" rx="${sw / 2}" fill="url(#${id})"/>`;
      b += `<rect x="40" y="${n1(mid - sw * 3)}" width="${W - 80}" height="${sw * 6}" rx="${sw * 3}" fill="url(#${id})" opacity=".18"/>`;
      const run = smil(ctx, `<animateTransform attributeName="transform" type="translate" values="0 0;${W - 200} 0" dur="${(4 / sp(ctx)).toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1"/>`);
      if (run) b += `<g><rect x="60" y="${n1(mid - sw / 2)}" width="80" height="${sw}" fill="url(#${id}s)"/>${run}</g>`;
    } else if (style === "dots") {
      const gap = Math.max(12, sw * 6);
      const n = Math.floor((W - 80) / gap);
      const x0 = (W - (n - 1) * gap) / 2;
      const fill = two ? gradSpan(ctx, x0, x0 + (n - 1) * gap) : col;
      for (let i = 0; i < n; i++) {
        const cls = ctx.mo.on && ctx.mo.decor ? ` class="tw" style="${delayStyle(ctx, -(n - i) * 0.06)}"` : "";
        b += `<circle${cls} cx="${n1(x0 + i * gap)}" cy="${mid}" r="${n1(sw * 1.2)}" fill="${fill}"/>`;
      }
    } else if (style === "perforation") {
      const cut = smil(ctx, `<animateTransform attributeName="transform" type="translate" values="0 0;${W - 120} 0;0 0" dur="${(16 / sp(ctx)).toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>`);
      b += `<path d="M64 ${mid}H${W - 40}" stroke="${p.muted}" stroke-width="${sw}" stroke-dasharray="${n1(sw * 3.5)} ${n1(sw * 3)}" stroke-linecap="round" opacity=".7"/>`;
      b += `<g><g transform="rotate(90 45 ${mid})">${icon(ctx, "mdi:content-cut", 32, mid - 13, 26, col, true)}</g>${cut}</g>`;
    } else if (style === "halftone") {
      // A swell travelling along a dot screen
      const len = 260;
      const anim = smil(ctx, `<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="${len * 2} 0" dur="${(6 / sp(ctx)).toFixed(1)}s" repeatCount="indefinite"/>`);
      const [def, fill] = density(ctx, "linear", `x1="0" y1="0" x2="${len}" y2="0" spreadMethod="reflect"`, [[0, 0.05], [1, 0.82]], anim);
      const mid2 = ctx.uid("hm");
      b += def + `<linearGradient id="${mid2}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>`;
      b += `<mask id="${mid2}"><rect width="${W}" height="${H}" fill="url(#${mid2}g)"/></mask>`;
      b += screen(ctx, { x: 0, y: 0, w: W, h: H, color: col, pitch: Math.max(5, sw * 2.6), angle: 45, field: `<rect width="${W}" height="${H}" fill="${fill}" mask="url(#${mid2})"/>` });
    } else if (style === "wave" || style === "zigzag") {
      const len = style === "wave" ? 64 : 28;
      const amp = Math.min(H / 2 - sw, 10);
      let d = `M${-len * 2} ${mid}`;
      for (let x = -len * 2; x < W + len * 2; x += len) {
        if (style === "wave") d += `q${len / 4} ${-amp} ${len / 2} 0t${len / 2} 0`;
        else d += `l${len / 2} ${-amp}l${len / 2} ${amp}`;
      }
      const anim = smil(ctx, `<animateTransform attributeName="transform" type="translate" from="0 0" to="${len} 0" dur="${(2.4 / sp(ctx)).toFixed(2)}s" repeatCount="indefinite"/>`);
      const cid = ctx.uid("dc");
      const stroke = two ? gradSpan(ctx, 40, W - 40) : col;
      b += `<clipPath id="${cid}"><rect x="40" width="${W - 80}" height="${H}"/></clipPath>`;
      b += `<g clip-path="url(#${cid})"><path d="${d}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">${anim}</path></g>`;
    } else {
      b += bar(ctx, 40, mid - sw / 2, W - 80, sw, two ? gradSpan(ctx, 40, W - 40) : col, 0.05);
    }
    return single(ctx, W, H, b, "");
  },
};

// ───────────────────────── Marquee
const marquee = {
  label: "Marquee",
  icon: "mdi:format-text-wrapping-overflow",
  defaults: (login, T) => ({
    items: [{ text: T("Design") }, { text: T("Code") }, { text: "Open Source" }, { text: T("Coffee") }, { text: T("Music") }],
    sep: "mdi:star-four-points",
    size: 24,
    font: "h",
    color: "gradient",
    speed: 50,
    direction: "left",
    height: 64,
    card: true,
  }),
  fields: [
    { k: "items", t: "list", l: "Texts", add: { text: "New" }, title: (x) => x.text, fields: [{ k: "text", t: "text", l: "Text" }] },
    { k: "sep", t: "icon", l: "Separator icon" },
    { k: "size", t: "range", l: "Size", min: 12, max: 56, step: 1 },
    { k: "font", t: "select", l: "Font", o: FONT_OPTS },
    { k: "color", t: "select", l: "Color", o: COLOR_OPTS },
    { k: "speed", t: "range", l: "Speed (px/sec)", min: 10, max: 200, step: 5 },
    { k: "direction", t: "select", l: "Direction", o: [["left", "To the left"], ["right", "To the right"]] },
    { k: "height", t: "range", l: "Height", min: 32, max: 140, step: 2 },
  ],
  render(ctx) {
    const { p, block } = ctx;
    const W = ctx.W;
    const H = Math.max(block.height, block.size * 1.6);
    const role = block.font || "h";
    const weight = role === "h" ? ctx.cfg.font.headingWeight : 600;
    const size = block.size;
    const y = H / 2 + size * 0.35;
    const isz = size * 0.62;
    const gap = size * 0.9;
    const texts = (block.items || []).map((i) => i.text).filter(Boolean);
    if (!texts.length) texts.push(" ");
    const sepCol = block.color === "gradient" ? p.accent2 : p.muted;
    const once = (ox) => {
      let s = "";
      let xx = ox;
      for (const t of texts) {
        s += inkText(ctx, block.color, xx, y, t, size, { role, weight });
        xx += ctx.m(t, size, weight, role) + gap;
        s += icon(ctx, block.sep, xx - isz / 2, H / 2 - isz / 2, isz, sepCol, true);
        xx += isz + gap;
      }
      return [s, xx - ox];
    };
    const [, unit] = once(0);
    const reps = Math.ceil(W / unit) + 1;
    let row = "";
    let x = 0;
    for (let i = 0; i < reps; i++) {
      row += once(x)[0];
      x += unit;
    }
    const speed = Math.max(5, block.speed);
    const dur = unit / speed;
    const [from, to] = block.direction === "right" ? [`${-unit} 0`, "0 0"] : ["0 0", `${-unit} 0`];
    const anim = smil(ctx, `<animateTransform attributeName="transform" type="translate" from="${from}" to="${to}" dur="${(dur / sp(ctx)).toFixed(2)}s" repeatCount="indefinite"/>`, false);
    let b = bgOf(ctx, W, H);
    b += clipCard(ctx, W, H, `<g>${row}${anim}</g>`);
    return single(ctx, W, H, b, texts.join(" · "));
  },
};

// ───────────────────────── Section title
const title = {
  label: "Section title",
  icon: "mdi:format-title",
  defaults: (login, T) => ({ text: T("My projects"), icon: "mdi:rocket-launch", align: "left", size: 26, underline: true, color: "text", card: false }),
  fields: [
    { k: "text", t: "text", l: "Text" },
    { k: "icon", t: "icon", l: "Icon" },
    { k: "align", t: "select", l: "Alignment", o: [["left", "Left"], ["center", "Center"]] },
    { k: "size", t: "range", l: "Size", min: 16, max: 56, step: 1 },
    { k: "color", t: "select", l: "Color", o: COLOR_OPTS },
    { k: "underline", t: "toggle", l: "Gradient bar under the text" },
  ],
  render(ctx) {
    const { p, block } = ctx;
    const W = ctx.W;
    const size = block.size;
    const H = Math.round(size * 2.3);
    const hw = ctx.cfg.font.headingWeight;
    const tw = ctx.m(block.text, size, hw, "h");
    const isz = block.icon ? size * 1.5 : 0;
    const total = tw + (isz ? isz + 14 : 0);
    const x0 = block.align === "center" ? (W - total) / 2 : 20;
    const y = H / 2 + size * 0.36;
    let b = bgOf(ctx, W, H);
    const tx = x0 + (isz ? isz + 14 : 0);
    if (block.icon) b += `<g${enter(ctx, 0)}>${badge(ctx, x0, y - size * 0.36 - isz / 2, isz, block.icon)}</g>`;
    b += `<g${enter(ctx, 0.08)}>${inkText(ctx, block.color, tx, y, block.text, size, { role: "h" })}</g>`;
    if (block.underline) {
      const bw = Math.min(tw, Math.max(48, tw * 0.35));
      b += bar(ctx, block.align === "center" ? tx + (tw - bw) / 2 : tx, y + size * 0.3, bw, Math.max(3, size * 0.13), grad(ctx), 0.25);
    }
    return single(ctx, W, H, b, block.text);
  },
};

// ───────────────────────── Quote
const quote = {
  label: "Quote",
  icon: "mdi:format-quote-open",
  defaults: (login, T) => ({ text: T("Simplicity is the ultimate sophistication."), author: T("Leonardo da Vinci"), size: 22, card: true }),
  fields: [
    { k: "text", t: "textarea", l: "Phrase" },
    { k: "author", t: "text", l: "Author" },
    { k: "size", t: "range", l: "Size", min: 14, max: 36, step: 1 },
  ],
  render(ctx) {
    const { p, block } = ctx;
    const W = ctx.W;
    const size = block.size;
    const lines = wrap(ctx.m, block.text, size, W - 170, 600, "b", 4);
    const lh = size * 1.42;
    const H = Math.round(60 + lines.length * lh + (block.author ? 42 : 0) + 28);
    let b = bgOf(ctx, W, H);
    // An oversized opening quote in the accent gradient
    b += `<g${enter(ctx, 0)}>${txt(ctx, 26, 108, "“", 112, grad(ctx), { role: "h" })}</g>`;
    lines.forEach((l, i) => (b += `<g${enter(ctx, 0.1 + i * 0.08)}>${txt(ctx, 92, 58 + size * 0.8 + i * lh, l, size, p.text, { weight: 600 })}</g>`));
    if (block.author) b += `<g${enter(ctx, 0.2 + lines.length * 0.08)}>${bar(ctx, 92, H - 52, 24, 3, grad(ctx), 0.4)}${txt(ctx, 126, H - 44, block.author, 15, p.muted, { weight: 600 })}</g>`;
    return single(ctx, W, H, b, block.text);
  },
};

// ───────────────────────── Markdown (no svg)
const markdown = {
  label: "Free Markdown",
  icon: "mdi:language-markdown",
  raw: true,
  defaults: (login, T) => ({ content: T("<!-- Write Markdown or HTML here: badges, GIFs, tables... -->\n**Thanks for visiting my profile!**") }),
  fields: [{ k: "content", t: "code", l: "Markdown / HTML content" }],
};

export const BLOCKS = { header, typing: typingBlock, about, stack, stats, calendar, streak, projects, socials, buttons, divider, marquee, title, quote, markdown };

export const COMMON_FIELDS = common;
