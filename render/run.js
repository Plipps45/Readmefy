// GitHub Action entry: node .readme/run.js
// Reads .readme/config.json, pulls fresh data from GitHub and rewrites README.md and assets/*.svg.
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { renderFinal } from "./pipeline.js";
import { loadData, toDataUrl } from "./github.js";

const root = process.cwd();
const here = dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const cfg = JSON.parse(await readFile(join(here, "config.json"), "utf8"));
const token = process.env.GITHUB_TOKEN || "";

let data;
try {
  data = await loadData(cfg.login, token);
} catch (e) {
  console.warn(`GraphQL/REST with token failed (${e.message}), retrying without token`);
  data = await loadData(cfg.login, "");
}

const header = cfg.blocks.find((b) => b.type === "header" && !b.hidden);
let avatar = null;
if (header && header.avatar !== false) {
  const url = header.avatarUrl || `${data.avatarUrl}${data.avatarUrl.includes("?") ? "&" : "?"}s=256`;
  avatar = await toDataUrl(url).catch(() => null);
}

const out = await renderFinal(cfg, data, { icons: { ...cfg.icons }, avatar });

// Remove svgs from the previous run that are no longer produced
const manifestPath = join(here, "manifest.json");
const before = JSON.parse(await readFile(manifestPath, "utf8").catch(() => "[]"));
const now = Object.keys(out.files);
for (const f of before) if (!now.includes(f)) await rm(join(root, f), { force: true });

for (const [path, content] of Object.entries(out.files)) {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), content);
}
await writeFile(join(root, "README.md"), out.readme);
await writeFile(manifestPath, JSON.stringify(now, null, 1) + "\n");
console.log(`Rendered ${now.length} files for ${cfg.login} (${data.exact ? "exact" : "estimated"} contributions)`);
