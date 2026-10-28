// Uploads the generated files to <login>/<login> in a single commit using the Git Data API.
import { t } from "./i18n.js";

const API = "https://api.github.com";

function client(token) {
  return async (path, opts = {}) => {
    const r = await fetch(`${API}/${path}`, {
      ...opts,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (r.status === 204) return null;
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = new Error(j.message || `HTTP ${r.status}`);
      e.status = r.status;
      throw e;
    }
    return j;
  };
}

export async function inspectRepo(token, login) {
  const api = client(token);
  const me = await api("user");
  const repo = await api(`repos/${me.login}/${me.login}`).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
  let readme = false;
  let ours = false;
  if (repo) {
    const file = await api(`repos/${me.login}/${me.login}/contents/README.md`).catch(() => null);
    readme = !!file;
    ours = !!(await api(`repos/${me.login}/${me.login}/contents/.readme/config.json`).catch(() => null));
  }
  return { user: me.login, matches: me.login.toLowerCase() === String(login).toLowerCase(), repo: !!repo, readme, ours };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function installFiles(token, files, log) {
  const api = client(token);
  const me = await api("user");
  const owner = me.login;
  const name = me.login;
  let repo = await api(`repos/${owner}/${name}`).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
  if (!repo) {
    log(t("Creating the repository {repo}…", { repo: `${owner}/${name}` }));
    repo = await api("user/repos", { method: "POST", body: { name, description: t("My GitHub profile ✨"), auto_init: true } });
    await sleep(1500);
  }
  const branch = repo.default_branch || "main";
  let ref;
  for (let i = 0; i < 8; i++) {
    ref = await api(`repos/${owner}/${name}/git/ref/heads/${branch}`).catch(() => null);
    if (ref) break;
    await sleep(1000);
  }
  if (!ref) throw new Error(t("The repository's main branch was not found"));
  const base = await api(`repos/${owner}/${name}/git/commits/${ref.object.sha}`);

  // Files produced by a previous install that are gone now
  const stale = [];
  const prev = await api(`repos/${owner}/${name}/contents/.readme/manifest.json?ref=${branch}`).catch(() => null);
  if (prev?.content) {
    try {
      const list = JSON.parse(decodeURIComponent(escape(atob(prev.content.replace(/\n/g, "")))));
      for (const f of list) if (!(f in files)) stale.push(f);
    } catch {}
  }

  const entries = Object.entries(files);
  const tree = [];
  let done = 0;
  const queue = [...entries];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const [path, content] = queue.shift();
        const blob = await api(`repos/${owner}/${name}/git/blobs`, { method: "POST", body: { content, encoding: "utf-8" } });
        tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
        log(t("Uploading files… {d}/{n}", { d: ++done, n: entries.length }), true);
      }
    }),
  );
  for (const path of stale) tree.push({ path, mode: "100644", type: "blob", sha: null });
  const newTree = await api(`repos/${owner}/${name}/git/trees`, { method: "POST", body: { base_tree: base.tree.sha, tree } });
  const commit = await api(`repos/${owner}/${name}/git/commits`, {
    method: "POST",
    body: { message: "Update profile with Readmefy", tree: newTree.sha, parents: [base.sha] },
  });
  try {
    await api(`repos/${owner}/${name}/git/refs/heads/${branch}`, { method: "PATCH", body: { sha: commit.sha } });
  } catch (e) {
    if (/workflow/i.test(e.message)) throw new Error(t("The token lacks the “workflow” permission. Create it with the public_repo and workflow permissions, or turn off the Action."));
    throw e;
  }
  return { url: `https://github.com/${owner}`, repo: `https://github.com/${owner}/${name}` };
}
