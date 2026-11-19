// Summarises an REA inspect-web-page Evidence JSON file into a compact digest.
import { readFileSync } from "node:fs";

const j = JSON.parse(readFileSync(process.argv[2], "utf8"));
const n = j.normalized_result;
const kb = (b) => (b / 1024).toFixed(0) + " KB";
const top = (m, k = 12) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
const inc = (m, key, by = 1) => m.set(key, (m.get(key) ?? 0) + by);
const host = (u) => {
  try {
    return new URL(u).host;
  } catch {
    return "(none)";
  }
};

console.log("== SCOPE ==");
console.log("allowed origins:", JSON.stringify(j.parameters?.allowed_origins ?? "(page origin only)"));
console.log("status:", n.completeness.status, "| excluded:", n.completeness.excluded.map((e) => `${e.section}/${e.reason}=${e.count}`).join(", "));

console.log("\n== DOM ==");
const els = n.dom.nodes.filter((x) => x.node_type === 1);
console.log("total nodes:", n.dom.total_nodes, "| elements:", els.length);
const tags = new Map();
for (const e of els) inc(tags, e.node_name);
console.log("top tags:", top(tags, 22).map(([t, c]) => `${t}:${c}`).join(" "));
const want = ["H1", "H2", "H3", "H4", "NAV", "MAIN", "HEADER", "FOOTER", "SECTION", "ARTICLE", "ASIDE", "FORM", "INPUT", "BUTTON", "A", "IMG", "PICTURE", "SOURCE", "SVG", "IFRAME", "VIDEO", "DIALOG", "LINK", "SCRIPT", "STYLE", "META", "NOSCRIPT", "TEMPLATE"];
console.log("structure:", want.map((t) => `${t}:${tags.get(t) ?? tags.get(t.toLowerCase()) ?? 0}`).join(" "));
const attrStats = (tag) => {
  const m = new Map();
  const list = els.filter((e) => e.node_name === tag);
  for (const e of list) for (const a of e.attribute_names) inc(m, a);
  return { count: list.length, attrs: top(m, 16).map(([a, c]) => `${a}:${c}`).join(" ") };
};
for (const t of ["IMG", "SCRIPT", "LINK", "A", "BUTTON", "INPUT", "SOURCE"]) {
  const s = attrStats(t);
  console.log(`${t} (${s.count}) attrs -> ${s.attrs}`);
}
// depth
const depth = new Map();
let maxDepth = 0;
for (const x of n.dom.nodes) {
  const d = x.parent_index >= 0 ? (depth.get(x.parent_index) ?? 0) + 1 : 0;
  depth.set(x.index, d);
  if (d > maxDepth) maxDepth = d;
}
console.log("max DOM depth:", maxDepth);
const dataAttrs = new Map();
for (const e of els) for (const a of e.attribute_names) if (/^data-|^aria-|^role$/.test(a)) inc(dataAttrs, a);
console.log("data-/aria- attrs:", top(dataAttrs, 24).map(([a, c]) => `${a}:${c}`).join(" "));

console.log("\n== DOM URLS ==");
const du = n.metadata.dom_urls;
const scope = new Map();
for (const u of du) inc(scope, u.destination_scope);
console.log("total:", du.length, "| by scope:", top(scope).map(([a, c]) => `${a}:${c}`).join(" "), "| excluded:", n.metadata.excluded_dom_urls);
const byAttrHost = new Map();
for (const u of du) if (u.url) inc(byAttrHost, `${u.attribute} ${host(u.url)}`);
console.log("attr+host:", top(byAttrHost, 14).map(([a, c]) => `${a} x${c}`).join(" | "));
const pathGroups = new Map();
for (const u of du) {
  if (!u.url) continue;
  const p = new URL(u.url).pathname.replace(/^\/[0-9a-f]{40}\//, "/<build>/").split("/").slice(0, 3).join("/");
  inc(pathGroups, `${u.attribute}:${p}`);
}
console.log("path groups:", top(pathGroups, 26).map(([a, c]) => `${a} x${c}`).join(" | "));
const tagOf = new Map(n.dom.nodes.map((x) => [x.index, x.node_name]));
const tagUrl = new Map();
for (const u of du) inc(tagUrl, `${tagOf.get(u.node_index)}[${u.attribute}] ${u.destination_scope}`);
console.log("tag[attr] scope:", top(tagUrl, 20).map(([a, c]) => `${a} x${c}`).join(" | "));

console.log("\n== SCRIPTS (in scope) ==");
const sc = n.scripts.items;
let totalLen = 0;
const grp = new Map();
const grpN = new Map();
let withMap = 0;
let modules = 0;
for (const s of sc) {
  totalLen += s.length ?? 0;
  const p = s.url ? new URL(s.url).pathname.replace(/^\/[0-9a-f]{40}\//, "/<build>/") : "(inline)";
  const g = p.startsWith("/<build>/_next/") ? "/<build>/_next/static" : p.startsWith("/<build>/static/js") ? "/<build>/static/js" : p.split("/").slice(0, 2).join("/");
  inc(grp, g, s.length ?? 0);
  inc(grpN, g);
  if (s.source_map_url) withMap++;
  if (s.is_module) modules++;
}
console.log("count:", n.scripts.total, "| listed:", sc.length, "| total source chars:", kb(totalLen), "| with source_map_url:", withMap, "| modules:", modules);
for (const [g, len] of top(grp, 10)) console.log(`  ${g}: ${grpN.get(g)} scripts, ${kb(len)}`);
console.log("largest:");
for (const s of [...sc].sort((a, b) => (b.length ?? 0) - (a.length ?? 0)).slice(0, 10)) console.log(`  ${kb(s.length ?? 0)}  ${(s.url ?? "(inline)").replace(/\/[0-9a-f]{40}\//, "/<build>/").slice(0, 120)}`);

console.log("\n== RESOURCES (in scope) ==");
const rt = new Map();
const rs = new Map();
const mime = new Map();
for (const r of n.resources) {
  inc(rt, r.type);
  inc(rs, r.type, r.content_size ?? 0);
  inc(mime, `${host(r.url)} ${r.mime_type}`);
}
for (const [t, c] of top(rt, 12)) console.log(`  ${t}: ${c} files, ${kb(rs.get(t))}`);
console.log("host+mime:", top(mime, 16).map(([a, c]) => `${a} x${c}`).join(" | "));
console.log("largest:");
for (const r of [...n.resources].sort((a, b) => (b.content_size ?? 0) - (a.content_size ?? 0)).slice(0, 10)) console.log(`  ${kb(r.content_size ?? 0)}  ${r.type}  ${r.url.replace(/\/[0-9a-f]{40}\//, "/<build>/").slice(0, 130)}`);
const imgs = n.resources.filter((r) => r.type === "Image");
console.log("images:", imgs.length, "| sizes (KB):", imgs.map((r) => Math.round((r.content_size ?? 0) / 1024)).sort((a, b) => b - a).slice(0, 30).join(","));
for (const r of imgs.slice(0, 8)) console.log("  img:", r.mime_type, kb(r.content_size ?? 0), r.url.slice(0, 150));

console.log("\n== ACCESSIBILITY ==");
const roles = new Map();
for (const a of n.accessibility.nodes) if (!a.ignored) inc(roles, a.role);
console.log("total:", n.accessibility.total_nodes, "| roles:", top(roles, 30).map(([a, c]) => `${a}:${c}`).join(" "));

console.log("\n== CONSOLE (no text retained) ==");
const cl = new Map();
for (const c of n.console.events) inc(cl, `${c.type ?? c.level ?? "?"}/${c.source ?? ""}`);
console.log(top(cl).map(([a, c]) => `${a} x${c}`).join(" | "));

console.log("\n== NETWORK during window ==");
console.log("requests:", n.network.requests.length, "| websockets:", n.network.websocket_connections.length);
const nh = new Map();
for (const r of n.network.requests) inc(nh, `${r.method ?? ""} ${host(r.url ?? "")} ${r.resource_type ?? r.type ?? ""}`);
console.log(top(nh, 20).map(([a, c]) => `${a} x${c}`).join(" | "));
console.log("response metadata records:", n.metadata.responses.length);

console.log("\n== STORAGE ==");
const st = n.storage;
console.log("usage:", kb(st.usage_bytes), "| localStorage keys:", st.local_storage_keys.length, "| sessionStorage keys:", st.session_storage_keys.length);
console.log("first-party localStorage keys:", st.local_storage_keys.filter((k) => /^takealot_|^tal\./.test(k)).join(", "));
console.log("other key families:", [...new Set(st.local_storage_keys.filter((k) => !/^takealot_|^tal\./.test(k)).map((k) => k.replace(/\.[0-9a-f-]{36}$/, "").split(".").slice(0, 2).join(".")))].join(", "));
console.log("indexedDB:", JSON.stringify(st.indexed_db_names), "| caches:", JSON.stringify(st.cache_names));
