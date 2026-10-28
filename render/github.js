// GitHub data. Works in the browser and in Node 18+ (global fetch).
// Without a token: REST only, contributions are estimated from public events.
// With a token: GraphQL gives the real contribution calendar, pinned repos and language sizes.
import { tr } from "./lang.js";

export class GhError extends Error {
  constructor(code, reset) {
    super(code);
    this.code = code;
    this.reset = reset;
  }
}

async function rest(path, token) {
  const headers = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`https://api.github.com/${path}`, { headers });
  if (r.status === 404) throw new GhError("notFound");
  if (r.status === 401) throw new GhError("badToken");
  if (r.status === 403 || r.status === 429) {
    const reset = Number(r.headers.get("x-ratelimit-reset"));
    throw new GhError("limit", reset ? new Date(reset * 1000) : null);
  }
  if (!r.ok) throw new GhError("failed");
  return r.json();
}

async function graphql(query, variables, token) {
  const r = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (r.status === 401) throw new GhError("badToken");
  const j = await r.json();
  if (j.errors?.length) throw new GhError(j.errors[0].type === "NOT_FOUND" ? "notFound" : "failed");
  return j.data;
}

const iso = (d) => d.toISOString().slice(0, 10);

export function streakOf(calendar, today) {
  const counts = calendar.map((d) => d.count);
  let longest = 0;
  let run = 0;
  for (const c of counts) {
    run = c > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let i = counts.length - 1;
  // Today without contributions does not break the streak yet
  if (i >= 0 && counts[i] === 0 && calendar[i].date === today) i--;
  let current = 0;
  for (; i >= 0 && counts[i] > 0; i--) current++;
  return { current, longest };
}

function calendarFromEvents(events, today) {
  const counts = {};
  for (const e of events) {
    const key = e.created_at.slice(0, 10);
    let n = 0;
    if (e.type === "PushEvent") n = e.payload?.distinct_size ?? e.payload?.size ?? 1;
    else if (["PullRequestEvent", "IssuesEvent"].includes(e.type) && e.payload?.action === "opened") n = 1;
    else if (["CreateEvent", "PullRequestReviewEvent", "IssueCommentEvent"].includes(e.type)) n = 1;
    counts[key] = (counts[key] ?? 0) + n;
  }
  const out = [];
  const end = new Date(today + "T00:00:00Z");
  for (let back = 370; back >= 0; back--) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - back);
    out.push({ date: iso(d), count: counts[iso(d)] ?? 0 });
  }
  return out;
}

const QUERY = `query($login:String!){user(login:$login){
  name login avatarUrl bio
  followers{totalCount} following{totalCount}
  pinnedItems(first:6,types:REPOSITORY){nodes{... on Repository{name url description stargazerCount forkCount isFork pushedAt primaryLanguage{name}}}}
  contributionsCollection{totalCommitContributions totalPullRequestContributions totalIssueContributions
    contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}
  repositories(first:100,ownerAffiliations:OWNER,orderBy:{field:STARGAZERS,direction:DESC}){totalCount nodes{
    name url description stargazerCount forkCount isFork pushedAt primaryLanguage{name}
    languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}}
}}`;

const mapRepo = (r) => ({
  name: r.name,
  url: r.url ?? r.html_url,
  desc: (r.description ?? "").trim(),
  stars: r.stargazerCount ?? r.stargazers_count ?? 0,
  forks: r.forkCount ?? r.forks_count ?? 0,
  fork: r.isFork ?? r.fork ?? false,
  language: r.primaryLanguage?.name ?? r.language ?? null,
  pushed: r.pushedAt ?? r.pushed_at ?? null,
});

export async function fetchData(login, token) {
  const today = iso(new Date());
  if (token) {
    const g = await graphql(QUERY, { login }, token);
    const u = g.user;
    if (!u) throw new GhError("notFound");
    const cc = u.contributionsCollection;
    const calendar = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })));
    const repos = u.repositories.nodes.map(mapRepo);
    const langs = {};
    for (const r of u.repositories.nodes) {
      if (r.isFork) continue;
      for (const e of r.languages.edges) langs[e.node.name] = (langs[e.node.name] ?? 0) + e.size;
    }
    const own = repos.filter((r) => !r.fork);
    return {
      login: u.login,
      name: u.name || u.login,
      bio: u.bio ?? "",
      avatarUrl: u.avatarUrl,
      followers: u.followers.totalCount,
      following: u.following.totalCount,
      repos: u.repositories.totalCount,
      stars: own.reduce((a, r) => a + r.stars, 0),
      forks: own.reduce((a, r) => a + r.forks, 0),
      contributions: cc.contributionCalendar.totalContributions,
      commits: cc.totalCommitContributions,
      prs: cc.totalPullRequestContributions,
      issues: cc.totalIssueContributions,
      languages: Object.entries(langs).sort((a, b) => b[1] - a[1]),
      pinned: u.pinnedItems.nodes.map(mapRepo),
      calendar,
      calendarTotal: cc.contributionCalendar.totalContributions,
      streak: streakOf(calendar, today),
      today,
      exact: true,
      __repos: repos,
    };
  }
  const u = await rest(`users/${encodeURIComponent(login)}`);
  const [raw, events] = await Promise.all([
    rest(`users/${encodeURIComponent(login)}/repos?per_page=100&type=owner&sort=pushed`),
    rest(`users/${encodeURIComponent(login)}/events/public?per_page=100`).catch(() => []),
  ]);
  const repos = raw.map(mapRepo);
  const langs = {};
  for (const r of raw) if (!r.fork && r.language) langs[r.language] = (langs[r.language] ?? 0) + Math.max(1, r.size);
  const own = repos.filter((r) => !r.fork);
  const calendar = calendarFromEvents(events, today);
  const year = today.slice(0, 4);
  const yearSum = calendar.filter((d) => d.date.startsWith(year)).reduce((a, d) => a + d.count, 0);
  const pushes = events.filter((e) => e.type === "PushEvent").reduce((a, e) => a + (e.payload?.distinct_size ?? e.payload?.size ?? 1), 0);
  return {
    login: u.login,
    name: u.name || u.login,
    bio: u.bio ?? "",
    avatarUrl: u.avatar_url,
    followers: u.followers,
    following: u.following,
    repos: u.public_repos,
    stars: own.reduce((a, r) => a + r.stars, 0),
    forks: own.reduce((a, r) => a + r.forks, 0),
    contributions: yearSum,
    commits: pushes,
    prs: events.filter((e) => e.type === "PullRequestEvent" && e.payload?.action === "opened").length,
    issues: events.filter((e) => e.type === "IssuesEvent" && e.payload?.action === "opened").length,
    languages: Object.entries(langs).sort((a, b) => b[1] - a[1]),
    pinned: [],
    calendar,
    calendarTotal: calendar.reduce((a, d) => a + d.count, 0),
    streak: streakOf(calendar, today),
    today,
    exact: false,
    __repos: repos,
  };
}

// Normalizes the result so blocks read data.repos as a list and data.repoCount as the number
export async function loadData(login, token) {
  const d = await fetchData(login, token);
  const repoList = d.__repos;
  const out = { ...d, repoCount: d.repos, repos: repoList };
  delete out.__repos;
  return out;
}

export async function toDataUrl(url, mime) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("image " + r.status);
  const type = mime ?? r.headers.get("content-type") ?? "image/png";
  const buf = new Uint8Array(await r.arrayBuffer());
  return `data:${type};base64,${b64(buf)}`;
}

export function b64(buf) {
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return btoa(s);
}

export function demoData(login = "", lang = "en") {
  const T = (s) => tr(lang, s);
  const today = iso(new Date());
  const end = new Date(today + "T00:00:00Z");
  const calendar = [];
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let back = 370; back >= 0; back--) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - back);
    const r = rand();
    calendar.push({ date: iso(d), count: back < 6 ? 2 + Math.floor(r * 6) : r < 0.3 ? 0 : Math.floor(r * r * 14) });
  }
  const repos = [
    { name: "pixel-studio", url: "#", desc: T("Pixel art editor that runs in the browser, with layers and animation."), stars: 342, forks: 41, fork: false, language: "TypeScript" },
    { name: "rusty-cli", url: "#", desc: T("Blazing fast terminal tools written in Rust."), stars: 128, forks: 12, fork: false, language: "Rust" },
    { name: "ml-playground", url: "#", desc: T("Machine learning experiments explained step by step."), stars: 76, forks: 9, fork: false, language: "Python" },
    { name: "dotfiles", url: "#", desc: T("My Neovim, terminal and desktop setup."), stars: 31, forks: 4, fork: false, language: "Shell" },
    { name: "awesome-ui", url: "#", desc: "", stars: 12, forks: 1, fork: true, language: "CSS" },
  ];
  return {
    login: login || T("your-username"),
    name: login || T("Your Name"),
    bio: "",
    avatarUrl: null,
    followers: 1280,
    following: 87,
    repos,
    repoCount: 42,
    stars: 589,
    forks: 67,
    contributions: 1874,
    commits: 1320,
    prs: 96,
    issues: 41,
    languages: [["TypeScript", 48], ["Rust", 21], ["Python", 14], ["CSS", 8], ["Shell", 5], ["HTML", 4]],
    pinned: repos.slice(0, 4),
    calendar,
    calendarTotal: calendar.reduce((a, d) => a + d.count, 0),
    streak: streakOf(calendar, today),
    today,
    exact: false,
    demo: true,
  };
}
