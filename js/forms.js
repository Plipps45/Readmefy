// Schema-driven form builder. Every field reads/writes obj[field.k] directly.
import { fetchIcons, iconPreviewUrl } from "../render/assets.js";
import { ui } from "./ui-icons.js";
import { t } from "./i18n.js";

export const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
};

// Previews come from the batched JSON endpoint: one <img> per icon against /{prefix}/{icon}.svg
// trips Iconify's rate limit (429) when a search returns a full grid.
const iconCache = new Map();
let iconQueue = new Map();

function iconDataUrl(icon, color) {
  const body = icon.palette ? icon.body : icon.body.replace(/currentColor/g, color);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.w} ${icon.h}">${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function flushIcons() {
  const queue = iconQueue;
  iconQueue = new Map();
  const found = await fetchIcons([...queue.keys()]).catch(() => ({}));
  for (const [name, imgs] of queue) {
    const icon = found[name] ?? null;
    if (icon) iconCache.set(name, icon);
    for (const [img, color] of imgs) img.src = icon ? iconDataUrl(icon, color) : iconPreviewUrl(name, color);
  }
}

export const iconImg = (name, size = 18, color = "#b5bac1") => {
  if (!name) return h("span", { class: "ico ico-empty" });
  const img = h("img", { class: "ico", width: size, height: size, alt: "" });
  if (iconCache.has(name)) img.src = iconDataUrl(iconCache.get(name), color);
  else {
    if (!iconQueue.size) queueMicrotask(flushIcons);
    if (!iconQueue.has(name)) iconQueue.set(name, []);
    iconQueue.get(name).push([img, color]);
  }
  return img;
};

// ctx: { onChange(structural), pickIcon(current) -> Promise<name|undefined>, repoNames() -> string[], fonts: string[] }
export function buildForm(root, fields, obj, ctx) {
  root.innerHTML = "";
  const rebuild = () => buildForm(root, fields, obj, ctx);
  for (const f of fields) {
    if (f.if && !f.if(obj)) continue;
    const el = field(f, obj, ctx, rebuild);
    if (el) root.append(el);
  }
}

function row(label, control, cls = "") {
  return h("label", { class: `field ${cls}` }, h("span", { class: "field-label" }, t(label)), control);
}

function field(f, obj, ctx, rebuild) {
  const set = (v, structural = false) => {
    obj[f.k] = v;
    ctx.onChange(structural);
    // Fields with conditions on other fields need a redraw
    if (structural) rebuild();
  };
  const hasDeps = true;
  switch (f.t) {
    case "group":
      return h("div", { class: "form-group" }, t(f.l));
    case "info":
      return h("p", { class: "form-info", html: t(f.l) });
    case "text": {
      const inp = h("input", { type: "text", value: obj[f.k] ?? "", placeholder: f.ph ?? "", oninput: (e) => set(e.target.value) });
      return row(f.l, inp);
    }
    case "repo": {
      const id = "dl" + Math.random().toString(36).slice(2);
      const dl = h("datalist", { id }, ...ctx.repoNames().map((n) => h("option", { value: n })));
      const inp = h("input", { type: "text", list: id, value: obj[f.k] ?? "", placeholder: t("repo-name"), oninput: (e) => set(e.target.value) });
      return row(f.l, h("div", {}, inp, dl));
    }
    case "textarea":
    case "code": {
      const ta = h("textarea", { rows: f.t === "code" ? 10 : 3, class: f.t === "code" ? "mono" : "", oninput: (e) => set(e.target.value) });
      ta.value = obj[f.k] ?? "";
      return row(f.l, ta);
    }
    case "number":
    case "range": {
      const out = h("output", {}, fmt(obj[f.k]));
      const inp = h("input", {
        type: f.t,
        min: f.min,
        max: f.max,
        step: f.step ?? 1,
        value: obj[f.k] ?? f.min ?? 0,
        oninput: (e) => {
          const v = parseFloat(e.target.value);
          out.textContent = fmt(v);
          set(Number.isFinite(v) ? v : 0);
        },
      });
      return row(f.l, h("div", { class: "range" }, inp, f.t === "range" ? out : null));
    }
    case "color": {
      const txt = h("input", { type: "text", class: "hex", value: obj[f.k] ?? "#000000", maxlength: 7 });
      const pick = h("input", { type: "color", value: obj[f.k] ?? "#000000" });
      pick.addEventListener("input", () => {
        txt.value = pick.value;
        set(pick.value);
      });
      txt.addEventListener("change", () => {
        if (/^#[0-9a-f]{6}$/i.test(txt.value)) {
          pick.value = txt.value;
          set(txt.value.toLowerCase());
        } else txt.value = obj[f.k];
      });
      return row(f.l, h("div", { class: "color" }, pick, txt));
    }
    case "select": {
      // f.g: [[group label, options], ...] renders the options in <optgroup>s
      const flat = f.g ? f.g.flatMap(([, o]) => o) : f.o;
      const opt = ([v, l]) => h("option", { value: v, selected: String(obj[f.k]) === String(v) }, t(l));
      const sel = h(
        "select",
        { onchange: (e) => set(typeof flat[0][0] === "number" ? Number(e.target.value) : e.target.value, hasDeps) },
        ...(f.g ? f.g.map(([gl, o]) => h("optgroup", { label: t(gl) }, ...o.map(opt))) : f.o.map(opt)),
      );
      return row(f.l, sel);
    }
    case "font": {
      const list = ctx.fonts;
      const cur = obj[f.k];
      const known = cur === "system" || list.includes(cur);
      const custom = h("input", { type: "text", value: known ? "" : cur, placeholder: t("Another Google Fonts font"), class: known ? "hidden" : "" });
      const sel = h(
        "select",
        {
          onchange: (e) => {
            if (e.target.value === "__custom") {
              custom.classList.remove("hidden");
              custom.focus();
              return;
            }
            custom.classList.add("hidden");
            set(e.target.value);
          },
        },
        h("option", { value: "system", selected: cur === "system" }, t("System font (not embedded)")),
        ...list.map((n) => h("option", { value: n, selected: cur === n }, n)),
        h("option", { value: "__custom", selected: !known }, t("Other (type the name)…")),
      );
      custom.addEventListener("change", () => custom.value.trim() && set(custom.value.trim()));
      return row(f.l, h("div", { class: "stack" }, sel, custom));
    }
    case "toggle": {
      const inp = h("input", { type: "checkbox", checked: !!obj[f.k], onchange: (e) => set(e.target.checked, hasDeps) });
      return h("label", { class: "field toggle" }, inp, h("span", { class: "switch" }), h("span", { class: "field-label" }, t(f.l)));
    }
    case "icon": {
      const btn = h("button", { type: "button", class: "icon-btn" });
      const paint = () => {
        btn.innerHTML = "";
        btn.append(iconImg(obj[f.k], 20), h("span", {}, obj[f.k] || t("Choose icon")));
      };
      paint();
      btn.addEventListener("click", async () => {
        const name = await ctx.pickIcon(obj[f.k]);
        if (name === undefined) return;
        obj[f.k] = name;
        paint();
        ctx.onChange(false);
      });
      return row(f.l, btn);
    }
    case "list":
      return listField(f, obj, ctx, rebuild);
  }
  return null;
}

function fmt(v) {
  return typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, "")) : String(v ?? "");
}

function listField(f, obj, ctx, rebuild) {
  const arr = (obj[f.k] ??= []);
  const wrap = h("div", { class: "list" }, h("div", { class: "list-head" }, h("span", {}, t(f.l)), h("span", { class: "count" }, String(arr.length))));
  arr.forEach((item, i) => {
    const body = h("div", { class: "list-body" });
    const title = h("span", { class: "list-title" }, t(f.title?.(item) || `#${i + 1}`).slice(0, 48));
    const open = f.k === "groups" ? true : arr.length <= 3;
    const det = h("details", { class: "list-item", open });
    const move = (d) => {
      const j = i + d;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      ctx.onChange(true);
      rebuild();
    };
    const tools = h(
      "span",
      { class: "list-tools" },
      h("button", { type: "button", title: t("Move up"), "aria-label": t("Move up"), html: ui("up", 15), onclick: (e) => (e.preventDefault(), move(-1)) }),
      h("button", { type: "button", title: t("Move down"), "aria-label": t("Move down"), html: ui("down", 15), onclick: (e) => (e.preventDefault(), move(1)) }),
      h("button", {
        type: "button",
        title: t("Duplicate"),
        "aria-label": t("Duplicate"),
        html: ui("copy", 15),
        onclick: (e) => {
          e.preventDefault();
          arr.splice(i + 1, 0, structuredClone(item));
          ctx.onChange(true);
          rebuild();
        },
      }),
      h("button", {
        type: "button",
        title: t("Delete"),
        "aria-label": t("Delete"),
        html: ui("trash", 15),
        class: "danger",
        onclick: (e) => {
          e.preventDefault();
          arr.splice(i, 1);
          ctx.onChange(true);
          rebuild();
        },
      }),
    );
    const sumIcon = item.icon !== undefined ? iconImg(item.icon, 16) : null;
    det.append(h("summary", {}, sumIcon, title, tools), body);
    const sub = { ...ctx, onChange: (s) => {
      title.textContent = t(f.title?.(item) || `#${i + 1}`).slice(0, 48);
      ctx.onChange(s);
    } };
    buildForm(body, f.fields, item, sub);
    wrap.append(det);
  });
  wrap.append(
    h("button", {
      type: "button",
      class: "add",
      onclick: () => {
        arr.push(ctx.localize ? ctx.localize(structuredClone(f.add ?? {})) : structuredClone(f.add ?? {}));
        ctx.onChange(true);
        rebuild();
      },
      html: ui("plus", 16) + t("Add"),
    }),
  );
  return wrap;
}
