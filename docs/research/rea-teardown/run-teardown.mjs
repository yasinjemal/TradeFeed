// Cold-cache page teardown with REA.
//
// For one URL: starts a separate Chrome with a brand-new throwaway profile and a
// loopback-only debug port, has REA navigate to the URL while recording network
// events (capture-browser-scenario, connect mode), then takes REA's passive page
// inspection (DOM, scripts, resources, storage key names) of the loaded page.
// Chrome and its profile are removed afterwards.
//
// Usage: node run-teardown.mjs <label> <url> <outDir> <origin[,origin...]>
//
// REA is expected in ~/.rea-agents (override with REA_HOME) and Chrome at its
// default Windows path (override with CHROME_PATH).
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, createWriteStream, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir, tmpdir } from "node:os";

const NODE = process.execPath;
const REA_HOME = process.env.REA_HOME ?? join(homedir(), ".rea-agents");
const REA = join(REA_HOME, "node_modules", "rea-agents", "scripts", "rea.mjs");
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9222;
const ENDPOINT = `http://127.0.0.1:${PORT}`;
const VIEWPORT = { width: 1440, height: 900, device_scale_factor: 1 };
const SETTLE_MS = 8000;

const [label, url, outDir, originsArg] = process.argv.slice(2);
if (!label || !url || !outDir || !originsArg) {
  console.error("usage: node run-teardown.mjs <label> <url> <outDir> <origin[,origin...]>");
  process.exit(2);
}
const origins = originsArg.split(",");
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rea = (args, outFile) =>
  new Promise((resolve) => {
    const child = spawn(NODE, [REA, ...args, "--format", "json"], {
      cwd: REA_HOME,
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    const sink = outFile ? createWriteStream(outFile) : null;
    child.stdout.on("data", (d) => (sink ? sink.write(d) : (out += d)));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      if (sink) sink.end(() => resolve({ code, out, err }));
      else resolve({ code, out, err });
    });
  });

const profile = join(tmpdir(), `rea-chrome-${label}-${Date.now()}`);
mkdirSync(profile, { recursive: true });
const chrome = spawn(
  CHROME,
  [
    `--remote-debugging-port=${PORT}`,
    "--remote-debugging-address=127.0.0.1",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
    "about:blank",
  ],
  { detached: true, stdio: "ignore" },
);
chrome.unref();

const cleanup = async () => {
  try {
    execFileSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" });
  } catch {
    /* already gone */
  }
  await sleep(1500);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
  } catch (e) {
    console.log("note: could not remove temp profile:", profile, e.code);
  }
};

try {
  let up = false;
  for (let i = 0; i < 40 && !up; i++) {
    try {
      up = (await fetch(`${ENDPOINT}/json/version`)).ok;
    } catch {
      await sleep(250);
    }
  }
  if (!up) throw new Error("Chrome debug endpoint did not come up");
  await sleep(1000);
  const pages = (await (await fetch(`${ENDPOINT}/json/list`)).json()).filter((t) => t.type === "page");
  const blank = pages.find((t) => t.url === "about:blank") ?? pages[0];
  if (!blank) throw new Error("no page target found");

  // 1) REA-driven navigation with network events (cold cache: new profile).
  const scenario = {
    browser: { mode: "connect", cdp_endpoint: ENDPOINT, target_id: blank.id },
    start_url: { url },
    environment: { viewport: VIEWPORT, service_workers: "allow" },
    capture: {
      events: ["network", "console"],
      at_end: ["url"],
      network: { request_body: false, response_body: false, header_values: false },
    },
    actions: [{ step_id: "settle", action: "wait_for_timeout", duration_ms: SETTLE_MS }],
  };
  const scenarioIn = join(outDir, `${label}-load-scenario-input.json`);
  writeFileSync(scenarioIn, JSON.stringify(scenario, null, 2));
  const loadOut = join(outDir, `${label}-load.json`);
  const s = await rea(["capture-browser-scenario", scenarioIn], loadOut);
  console.log(`[${label}] scenario exit=${s.code}`, s.err.slice(0, 300));
  try {
    const j = JSON.parse(readFileSync(loadOut, "utf8"));
    if (j.code || j.error) console.log(`[${label}] scenario error:`, JSON.stringify(j).slice(0, 900));
    else {
      const n = j.normalized_result;
      console.log(`[${label}] evidence ${j.evidence_id}`);
      console.log(`[${label}] steps:`, n.steps.map((x) => `${x.step_id}=${x.status}(${x.elapsed_ms}ms)`).join(" "), "| events retained", n.events.retained, "dropped", n.events.dropped, "| completeness", n.completeness.status, JSON.stringify(n.completeness.missing_sections));
    }
  } catch (e) {
    console.log(`[${label}] could not parse scenario output:`, e.message);
  }

  // Widen the passive inspection to every origin the load actually contacted,
  // so resource sizes cover third parties too (REA defaults to the page origin only).
  try {
    const seen = new Set(origins);
    for (const ev of JSON.parse(readFileSync(loadOut, "utf8")).normalized_result.events.items) {
      const o = ev.url?.origin;
      if (o && /^https?:\/\//.test(o)) seen.add(o);
    }
    origins.splice(0, origins.length, ...seen);
    console.log(`[${label}] origins contacted during load: ${origins.length}`);
  } catch {
    /* keep the supplied origins */
  }

  // 2) Passive inspection of the loaded page.
  const t = await rea(["list-browser-targets", ENDPOINT, "--allowed-origins", new URL(url).origin]);
  let targetId = null;
  try {
    const tj = JSON.parse(t.out);
    const hit = tj.normalized_result.targets.find((x) => x.target_id === blank.id) ?? tj.normalized_result.targets[0];
    targetId = hit?.target_id ?? null;
    console.log(`[${label}] page now at:`, hit?.url);
  } catch {
    console.log(`[${label}] list-browser-targets failed:`, t.out.slice(0, 400));
  }
  if (targetId) {
    const pageOut = join(outDir, `${label}-page.json`);
    const p = await rea(
      ["inspect-web-page", ENDPOINT, targetId, "--observation-ms", "2000", "--include-storage-keys", ...origins.flatMap((o) => ["--allowed-origins", o])],
      pageOut,
    );
    console.log(`[${label}] inspect exit=${p.code}`, p.err.slice(0, 300));
  }
} catch (e) {
  console.log(`[${label}] FAILED:`, e.message);
} finally {
  await cleanup();
  console.log(`[${label}] chrome closed, temp profile removed`);
}
