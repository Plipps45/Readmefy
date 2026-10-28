// Final render for export: every svg embeds only the glyphs it draws.
import { renderProfile } from "./index.js";
import { fetchIcons, loadFont } from "./assets.js";

async function pool(tasks, size = 6) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < tasks.length) {
        const n = i++;
        out[n] = await tasks[n]();
      }
    }),
  );
  return out;
}

export async function renderFinal(cfg, data, env, onProgress) {
  env = { ...env, icons: { ...env.icons } };
  const collect = {};
  let out = renderProfile(cfg, data, { ...env, collect });
  for (let round = 0; out.missing.size && round < 3; round++) {
    Object.assign(env.icons, await fetchIcons([...out.missing]));
    for (const k of Object.keys(collect)) delete collect[k];
    out = renderProfile(cfg, data, { ...env, collect });
  }
  const fonts = {};
  const keys = Object.keys(collect);
  let done = 0;
  await pool(
    keys.map((key) => async () => {
      const slot = collect[key];
      const one = async (role, family) => {
        const s = slot[role];
        if (!s.chars.size || family === "system") return null;
        const chars = [...s.chars].filter((c) => c.codePointAt(0) <= 0xffff && c !== "\n").sort().join("");
        const weights = s.weights.size ? [...s.weights] : [400];
        return loadFont(family, weights, chars).catch(() => env.fonts?.[role] ?? null);
      };
      const [b, h] = await Promise.all([one("b", cfg.font.body), one("h", cfg.font.heading)]);
      fonts[key] = { b, h };
      onProgress?.(++done, keys.length);
    }),
  );
  return { ...renderProfile(cfg, data, { ...env, fontsFor: (k) => fonts[k] }), icons: env.icons };
}
