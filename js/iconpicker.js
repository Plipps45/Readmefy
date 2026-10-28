import { searchIcons } from "../render/assets.js";
import { h, iconImg } from "./forms.js";
import { ui } from "./ui-icons.js";
import { t } from "./i18n.js";

const SETS = [
  ["All", null],
  ["Color logos", ["logos", "devicon", "skill-icons", "vscode-icons"]],
  ["Brands", ["simple-icons", "ri", "mdi", "fa6-brands", "bxl"]],
  ["Material", ["mdi", "material-symbols", "ic"]],
  ["Tabler", ["tabler"]],
  ["Lucide", ["lucide"]],
  ["Emoji", ["noto", "fluent-emoji-flat", "twemoji"]],
];

const SUGGESTED = [
  "mdi:star", "mdi:heart", "mdi:rocket-launch", "mdi:code-tags", "mdi:lightning-bolt", "mdi:fire", "mdi:map-marker",
  "mdi:briefcase-variant", "mdi:school", "mdi:coffee", "mdi:gamepad-variant", "mdi:music", "mdi:palette", "mdi:web",
  "mdi:email", "mdi:github", "mdi:linkedin", "ri:twitter-x-fill", "ic:baseline-discord", "mdi:instagram", "mdi:youtube",
  "mdi:twitch", "simple-icons:bluesky", "simple-icons:kofi", "logos:typescript-icon", "logos:javascript", "logos:python",
  "logos:react", "logos:vue", "logos:nodejs-icon", "logos:rust", "logos:go", "logos:java", "logos:docker-icon", "logos:git-icon",
  "logos:figma", "logos:tailwindcss-icon", "logos:nextjs-icon", "logos:svelte-icon", "logos:postgresql", "logos:mongodb-icon",
  "logos:aws", "logos:firebase", "logos:linux-tux", "logos:visual-studio-code", "noto:sparkles", "noto:waving-hand", "noto:fire",
];

let dlg;

export function pickIcon(current) {
  return new Promise((resolve) => {
    dlg?.remove();
    let set = null;
    let timer;
    let token = 0;
    const grid = h("div", { class: "icon-grid" });
    const status = h("div", { class: "picker-status" });
    const input = h("input", { type: "search", placeholder: t("Search icons in English: react, rocket, heart…"), autofocus: true });
    const close = (v) => {
      dlg.close();
      dlg.remove();
      dlg = null;
      resolve(v);
    };
    const show = (names) => {
      grid.innerHTML = "";
      for (const n of names) {
        grid.append(h("button", { type: "button", class: n === current ? "on" : "", title: n, onclick: () => close(n) }, iconImg(n, 28)));
      }
      status.textContent = names.length ? t("{n} icons", { n: names.length }) : t("No results");
    };
    const run = async () => {
      const q = input.value.trim();
      if (!q) {
        show(set ? SUGGESTED.filter((n) => set.includes(n.split(":")[0])) : SUGGESTED);
        return;
      }
      const my = ++token;
      status.textContent = "Buscando…";
      const names = await searchIcons(q, set, 120).catch(() => []);
      if (my === token) show(names);
    };
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(run, 250);
    });
    const chips = h(
      "div",
      { class: "chips" },
      ...SETS.map(([label, s], i) =>
        h("button", {
          type: "button",
          class: i === 0 ? "chip on" : "chip",
          onclick: (e) => {
            set = s;
            chips.querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
            e.currentTarget.classList.add("on");
            run();
          },
        }, t(label)),
      ),
    );
    const manual = h("input", { type: "text", placeholder: t("or type an exact name: prefix:name"), value: current ?? "" });
    dlg = h(
      "dialog",
      { class: "modal picker" },
      h("div", { class: "modal-head" }, h("h3", {}, t("Choose icon")), h("button", { type: "button", class: "icon", "aria-label": t("Close"), html: ui("close"), onclick: () => close(undefined) })),
      input,
      chips,
      grid,
      status,
      h(
        "div",
        { class: "picker-foot" },
        manual,
        h("button", { type: "button", onclick: () => manual.value.includes(":") && close(manual.value.trim()) }, t("Use")),
        h("button", { type: "button", class: "quiet", onclick: () => close("") }, t("No icon")),
      ),
      h("p", { class: "hint" }, t("Over 200,000 icons from Iconify. Browse them all at") + " ", h("a", { href: "https://icon-sets.iconify.design/", target: "_blank", rel: "noopener" }, "icon-sets.iconify.design"), "."),
    );
    dlg.addEventListener("cancel", (e) => {
      e.preventDefault();
      close(undefined);
    });
    document.body.append(dlg);
    dlg.showModal();
    run();
    input.focus();
  });
}
