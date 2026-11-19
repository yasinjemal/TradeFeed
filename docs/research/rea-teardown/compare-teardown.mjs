// Builds a side-by-side digest from run-teardown.mjs output.
// Usage: node compare-teardown.mjs <evidenceDir> <label:firstPartyDomain> [...]
// Example: node compare-teardown.mjs ./evidence takealot-home:takealot.com tradefeed-home:tradefeed.co.za
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [dir, ...specs] = process.argv.slice(2);
const kb = (b) => Math.round(b / 1024);
const inc = (m, k, by = 1) => m.set(k, (m.get(k) ?? 0) + by);
const top = (m, k = 10) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
const hostOf = (u) => {
  try {
    return new URL(u).host;
  } catch {
    return "";
  }
};

const all = {};
for (const spec of specs) {
  const [label, fp] = spec.split(":");
  const isFP = (h) => h === fp || h.endsWith("." + fp);
  const load = JSON.parse(readFileSync(join(dir, `${label}-load.json`), "utf8")).normalized_result;
  const page = JSON.parse(readFileSync(join(dir, `${label}-page.json`), "utf8")).normalized_result;
  const m = { label };

  // ---- load recording ----
  const ev = load.events.items;
  const reqs = ev.filter((e) => e.kind === "request");
  const resp = ev.filter((e) => e.kind === "response");
  const fin = ev.filter((e) => e.kind === "request-finished");
  const byType = new Map();
  const tpOrigins = new Map();
  let fpReq = 0;
  for (const r of reqs) {
    inc(byType, r.resource_type);
    const h = hostOf(r.url.url);
    if (isFP(h)) fpReq++;
    else inc(tpOrigins, h);
  }
  const status = new Map();
  for (const r of resp) inc(status, String(r.status));
  const t0 = Date.parse(reqs[0].observed_at);
  const lastStart = Math.max(...reqs.map((r) => Date.parse(r.observed_at)));
  const doc = fin.find((e) => e.resource_type === "document");
  const docResp = resp.find((e) => e.resource_type === "document");
  m.requests = reqs.length;
  m.requests_first_party = fpReq;
  m.requests_third_party = reqs.length - fpReq;
  m.third_party_hosts = tpOrigins.size;
  m.requests_by_type = Object.fromEntries(top(byType, 12));
  m.top_third_party_hosts = top(tpOrigins, 14).map(([h, c]) => `${h} x${c}`);
  m.statuses = Object.fromEntries(top(status, 8));
  m.unfinished = ev.filter((e) => e.kind === "request-unfinished").length;
  m.failed = ev.filter((e) => e.failure).length;
  m.navigation_step_ms = load.steps[0].elapsed_ms;
  m.document_ms = doc ? Math.round(doc.elapsed_ms) : null;
  m.last_request_started_after_ms = lastStart - t0;
  m.document_header_names = docResp?.header_names ?? [];
  const cons = new Map();
  for (const c of ev.filter((e) => e.kind === "console")) inc(cons, c.level);
  m.console = Object.fromEntries(cons);

  // ---- passive page inspection ----
  const bytesByType = new Map();
  const countByType = new Map();
  let fpBytes = 0;
  let tpBytes = 0;
  const imgMime = new Map();
  for (const r of page.resources) {
    const s = r.content_size ?? 0;
    inc(bytesByType, r.type, s);
    inc(countByType, r.type);
    if (isFP(hostOf(r.url))) fpBytes += s;
    else tpBytes += s;
    if (r.type === "Image") inc(imgMime, r.mime_type);
  }
  const imgs = page.resources.filter((r) => r.type === "Image").map((r) => r.content_size ?? 0).sort((a, b) => a - b);
  m.resources = page.resources.length;
  m.resources_excluded = page.completeness.excluded.filter((e) => e.section === "resources").map((e) => `${e.reason}=${e.count}`).join(", ") || "none";
  m.total_kb = kb(fpBytes + tpBytes);
  m.first_party_kb = kb(fpBytes);
  m.third_party_kb = kb(tpBytes);
  m.script_kb = kb(bytesByType.get("Script") ?? 0);
  m.script_files = countByType.get("Script") ?? 0;
  m.css_kb = kb(bytesByType.get("Stylesheet") ?? 0);
  m.image_kb = kb(bytesByType.get("Image") ?? 0);
  m.image_files = imgs.length;
  m.image_median_kb = imgs.length ? kb(imgs[Math.floor(imgs.length / 2)]) : 0;
  m.image_max_kb = imgs.length ? kb(imgs[imgs.length - 1]) : 0;
  m.image_formats = Object.fromEntries(top(imgMime, 6));
  m.font_kb = kb(bytesByType.get("Font") ?? 0);
  m.other_types = Object.fromEntries([...bytesByType.entries()].filter(([t]) => !["Script", "Stylesheet", "Image", "Font"].includes(t)).map(([t, b]) => [t, `${countByType.get(t)} files ${kb(b)} KB`]));
  m.largest = [...page.resources].sort((a, b) => (b.content_size ?? 0) - (a.content_size ?? 0)).slice(0, 6).map((r) => `${kb(r.content_size ?? 0)} KB ${r.type} ${hostOf(r.url)}${new URL(r.url).pathname.replace(/\/[0-9a-f]{40}\//, "/<build>/").slice(0, 70)}`);
  let tpScript = 0;
  for (const r of page.resources) if (r.type === "Script" && !isFP(hostOf(r.url))) tpScript += r.content_size ?? 0;
  m.third_party_script_kb = kb(tpScript);

  const els = page.dom.nodes.filter((x) => x.node_type === 1);
  const tags = new Map();
  for (const e of els) inc(tags, e.node_name.toUpperCase());
  const depth = new Map();
  let maxDepth = 0;
  for (const x of page.dom.nodes) {
    const d = x.parent_index >= 0 ? (depth.get(x.parent_index) ?? 0) + 1 : 0;
    depth.set(x.index, d);
    if (d > maxDepth) maxDepth = d;
  }
  const img = els.filter((e) => e.node_name === "IMG");
  const has = (list, a) => list.filter((e) => e.attribute_names.includes(a)).length;
  m.dom_nodes = page.dom.total_nodes;
  m.dom_elements = els.length;
  m.dom_depth = maxDepth;
  m.h1 = tags.get("H1") ?? 0;
  m.headings = ["H1", "H2", "H3", "H4"].map((t) => `${t}:${tags.get(t) ?? 0}`).join(" ");
  m.landmarks = ["HEADER", "NAV", "MAIN", "FOOTER", "SECTION", "ARTICLE"].map((t) => `${t}:${tags.get(t) ?? 0}`).join(" ");
  m.links = tags.get("A") ?? 0;
  m.buttons = tags.get("BUTTON") ?? 0;
  m.inputs = tags.get("INPUT") ?? 0;
  m.img_tags = img.length;
  m.img_with_dimensions = has(img, "width");
  m.img_with_loading_attr = has(img, "loading");
  m.img_with_srcset = has(img, "srcset");
  m.img_with_sizes = has(img, "sizes");
  m.img_with_fetchpriority = has(img, "fetchpriority");
  m.img_with_alt = has(img, "alt");
  m.inline_style_tags = tags.get("STYLE") ?? 0;
  m.script_tags = tags.get("SCRIPT") ?? 0;
  m.iframes = tags.get("IFRAME") ?? 0;
  m.aria_labels = els.filter((e) => e.attribute_names.includes("aria-label")).length;
  m.scripts_with_source_map_url = page.scripts.items.filter((s) => s.source_map_url).length;
  m.local_storage_keys = page.storage.local_storage_keys;
  m.session_storage_keys = page.storage.session_storage_keys;
  m.indexed_db = page.storage.indexed_db_names;
  m.cache_names = page.storage.cache_names;
  m.storage_kb = kb(page.storage.usage_bytes ?? 0);
  all[label] = m;
}

const labels = Object.keys(all);
const row = (name, f) => console.log(name.padEnd(34) + labels.map((l) => String(f(all[l])).padStart(22)).join(""));
console.log("".padEnd(34) + labels.map((l) => l.padStart(22)).join(""));
row("requests (8s, no scroll)", (m) => m.requests);
row("  first-party / third-party", (m) => `${m.requests_first_party} / ${m.requests_third_party}`);
row("third-party hosts", (m) => m.third_party_hosts);
row("navigation step ms", (m) => m.navigation_step_ms);
row("document request ms", (m) => m.document_ms);
row("last request started +ms", (m) => m.last_request_started_after_ms);
row("unfinished / failed", (m) => `${m.unfinished} / ${m.failed}`);
row("resources in page tree", (m) => m.resources);
row("total uncompressed KB", (m) => m.total_kb);
row("  first-party KB", (m) => m.first_party_kb);
row("  third-party KB", (m) => m.third_party_kb);
row("script KB (files)", (m) => `${m.script_kb} (${m.script_files})`);
row("  third-party script KB", (m) => m.third_party_script_kb);
row("css KB", (m) => m.css_kb);
row("font KB", (m) => m.font_kb);
row("image KB (files)", (m) => `${m.image_kb} (${m.image_files})`);
row("  image median / max KB", (m) => `${m.image_median_kb} / ${m.image_max_kb}`);
row("DOM nodes", (m) => m.dom_nodes);
row("DOM depth", (m) => m.dom_depth);
row("h1 count", (m) => m.h1);
row("img tags", (m) => m.img_tags);
row("  with width/height", (m) => m.img_with_dimensions);
row("  with loading attr", (m) => m.img_with_loading_attr);
row("  with srcset", (m) => m.img_with_srcset);
row("  with fetchpriority", (m) => m.img_with_fetchpriority);
row("  with alt", (m) => m.img_with_alt);
row("links / buttons / inputs", (m) => `${m.links} / ${m.buttons} / ${m.inputs}`);
row("aria-label count", (m) => m.aria_labels);
row("inline <style> tags", (m) => m.inline_style_tags);
row("iframes", (m) => m.iframes);
row("scripts w/ source map URL", (m) => m.scripts_with_source_map_url);
row("storage KB", (m) => m.storage_kb);

for (const l of labels) {
  const m = all[l];
  console.log(`\n--- ${l} ---`);
  console.log("requests by type:", JSON.stringify(m.requests_by_type));
  console.log("statuses:", JSON.stringify(m.statuses), "| console:", JSON.stringify(m.console));
  console.log("resources excluded:", m.resources_excluded, "| other types:", JSON.stringify(m.other_types));
  console.log("image formats:", JSON.stringify(m.image_formats));
  console.log("headings:", m.headings, "| landmarks:", m.landmarks);
  console.log("third-party hosts:", m.top_third_party_hosts.join(", "));
  console.log("document header names:", m.document_header_names.join(", "));
  console.log("largest:", m.largest.join(" | "));
  console.log("localStorage keys:", m.local_storage_keys.map((k) => k.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/, "<id>")).join(", ").slice(0, 700));
  console.log("sessionStorage:", m.session_storage_keys.join(", ").slice(0, 200), "| indexedDB:", JSON.stringify(m.indexed_db), "| caches:", JSON.stringify(m.cache_names));
}
writeFileSync(join(dir, "metrics.json"), JSON.stringify(all, null, 2));
console.log(`\nwrote ${join(dir, "metrics.json")}`);
