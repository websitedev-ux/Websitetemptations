// Makes a watermarked preview picture of a website for the "Our Work" page.
//
// Usage (from the website-temptations folder):
//   node tools/make-preview.js https://example.com example
// Creates: assets/work/example.jpg  (1440×900, with the Website Temptations watermark)
//
// How it works: opens the site in an invisible Chrome/Edge window, dismisses welcome
// pop-ups and cookie banners, takes a screenshot, then stamps our logo on it.
// Needs Node 22+ and Chrome or Edge installed. No packages to install.

const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const [url, slug] = process.argv.slice(2);
if (!url || !slug) { console.error("Usage: node tools/make-preview.js <url> <name>"); process.exit(1); }

const W = 1440, H = 900, PORT = 9333;
const root = path.join(__dirname, "..");
const out = path.join(root, "assets", "work", `${slug}.jpg`);
const logoSvg = fs.readFileSync(path.join(root, "assets", "logo.svg"), "utf8");

const browsers = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium",
];
const exe = browsers.find(p => fs.existsSync(p));
if (!exe) { console.error("Couldn't find Chrome or Edge."); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "wt-preview-"));
  const chrome = spawn(exe, [
    "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    `--window-size=${W},${H}`, "--hide-scrollbars", "--mute-audio", "--no-first-run", "about:blank",
  ], { stdio: "ignore" });

  try {
    // connect to the invisible browser
    let target;
    for (let i = 0; i < 50 && !target; i++) {
      try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === "page"); }
      catch { await sleep(200); }
    }
    if (!target) throw new Error("Browser did not start");
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let id = 0; const waiting = new Map();
    ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } };
    const send = (method, params = {}) => new Promise(res => { const n = ++id; waiting.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
    const evaluate = async expr => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

    await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });

    // 1. load the site and let it settle
    console.log("Loading", url);
    await send("Page.navigate", { url });
    await sleep(4500);

    // 2. dismiss welcome pop-ups / cookie banners (prefer "desktop"/"skip"/"reject"-style buttons)
    const dismissed = await evaluate(`(() => {
      const words = /^(computer|desktop|skip|close|no thanks|reject|reject all|decline|dismiss|continue|got it|ok|×|✕)/i;
      const clicked = [];
      for (let pass = 0; pass < 3; pass++) {
        const btn = [...document.querySelectorAll("button, a, [role=button]")].find(b => {
          const r = b.getBoundingClientRect(); const t = (b.innerText || b.getAttribute("aria-label") || "").trim();
          return r.width > 0 && r.height > 0 && words.test(t) && getComputedStyle(b).visibility !== "hidden" &&
                 b.closest("[role=dialog], dialog, [class*=modal], [class*=popup], [class*=overlay], [class*=cookie], [class*=consent], [class*=welcome], [id*=modal], [id*=cookie], [id*=welcome]");
        });
        if (!btn) break;
        clicked.push((btn.innerText || btn.getAttribute("aria-label") || "").trim().split("\\n")[0]);
        btn.click();
      }
      return clicked;
    })()`);
    if (dismissed?.length) console.log("Dismissed pop-up(s):", dismissed.join(", "));
    await sleep(2500);
    await evaluate("window.scrollTo(0, 0)");
    // hide small floating corner widgets (chat bubbles, back-to-top, theme buttons) so they
    // don't peek out from behind the watermark
    await evaluate(`[...document.querySelectorAll("body *")].forEach(el => {
      const cs = getComputedStyle(el); if (cs.position !== "fixed") return;
      const r = el.getBoundingClientRect();
      if (r.width < 160 && r.height < 160 && r.bottom > ${H} - 220) el.style.visibility = "hidden";
    })`);
    await sleep(800);

    const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 90, clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
    const siteJpg = shot.result.data;

    // 3. stamp the watermark: our logo + name in the bottom-right corner
    await send("Page.navigate", { url: "about:blank" });
    await sleep(300);
    await evaluate(`new Promise(done => {
      document.documentElement.style.margin = document.body.style.margin = "0";
      document.body.innerHTML = \`
        <div style="position:relative;width:${W}px;height:${H}px;overflow:hidden;background:#000">
          <img id="shot" src="data:image/jpeg;base64,${siteJpg}" style="display:block;width:${W}px;height:${H}px">
          <div style="position:absolute;right:32px;bottom:32px;display:flex;align-items:center;gap:18px;
                      padding:14px 30px 14px 14px;border-radius:999px;opacity:.97;
                      background:rgba(14,14,16,.86);border:2px solid rgba(224,160,122,.9);
                      box-shadow:0 0 0 4px rgba(214,151,112,.18), 0 0 28px rgba(214,151,112,.35), 0 14px 36px rgba(0,0,0,.55);
                      backdrop-filter:blur(8px)">
            <div style="width:74px;height:74px">${logoSvg.replace(/\n/g, " ").replace(/`/g, "")}</div>
            <div style="font-family:Georgia,serif;color:#F6F1E7;letter-spacing:.14em;text-transform:uppercase;line-height:1.15;text-shadow:0 1px 2px rgba(0,0,0,.6)">
              <div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:.4em;color:#E8B08A;margin-bottom:6px">Designed &amp; built by</div>
              <div style="font-size:27px">Website Temptations</div>
            </div>
          </div>
        </div>\`;
      const img = document.getElementById("shot");
      img.complete ? done() : (img.onload = done);
    })`);
    await sleep(400);
    const final = await send("Page.captureScreenshot", { format: "jpeg", quality: 82, clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });

    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(final.result.data, "base64"));
    console.log("Saved", path.relative(root, out), `(${Math.round(fs.statSync(out).size / 1024)} KB)`);
    ws.close();
  } finally {
    chrome.kill();
    await sleep(500);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
})().catch(e => { console.error(e.message); process.exit(1); });
