// Assembles src/pages/*.html into finished pages in the site root, wrapped in src/template.html.
// Usage (from the website-temptations folder):  node src/build.js
// Each page starts with:  <!-- title: Page Title | desc: Meta description | nav: services -->
// {{projects}} inserts every project from src/projects.json; {{projects:3}} inserts the newest 3.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const template = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");
const pagesDir = path.join(__dirname, "pages");
const projects = JSON.parse(fs.readFileSync(path.join(__dirname, "projects.json"), "utf8"));

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const domain = url => new URL(url).hostname.replace(/^www\./, "");

function projectCards(limit) {
  return `<div class="work-grid">\n` + projects.slice(0, limit || projects.length).map((p, i) => `
  <article class="work-card reveal" style="--delay:${(i % 3) * 0.1}s">
    <a class="work-shot" href="${esc(p.url)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
      <img src="${esc(p.image)}" alt="" width="1440" height="900" loading="lazy">
    </a>
    <div class="work-body">
      <p class="work-meta">${esc(p.type)}${p.location ? ` · ${esc(p.location)}` : ""}</p>
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.summary)}</p>
      <a class="work-link" href="${esc(p.url)}" target="_blank" rel="noopener">
        Visit ${esc(domain(p.url))} <span aria-hidden="true">↗</span><span class="visually-hidden"> (opens in a new tab)</span>
      </a>
    </div>
  </article>`).join("\n") + `\n</div>`;
}

for (const file of fs.readdirSync(pagesDir).filter(f => f.endsWith(".html"))) {
  const src = fs.readFileSync(path.join(pagesDir, file), "utf8");
  const meta = {};
  const m = src.match(/^<!--([\s\S]*?)-->/);
  if (m) m[1].split("|").forEach(p => {
    const i = p.indexOf(":");
    if (i > 0) meta[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  const body = (m ? src.slice(m[0].length).trim() : src)
    .replace(/\{\{projects(?::(\d+))?\}\}/g, (_, n) => projectCards(n && Number(n)));
  const out = template
    .replace("{{title}}", meta.title || "Website Temptations")
    .replace("{{desc}}", meta.desc || "")
    .replace(/\{\{nav:(\w+)\}\}/g, (_, k) => (k === meta.nav ? ' aria-current="page"' : ""))
    .replace("{{body}}", body);
  fs.writeFileSync(path.join(root, file), out);
  console.log("built", file);
}
