// Collects only the files a visitor's browser needs into public/, ready to upload.
// Usage (from the website-temptations folder):  node tools/package.js
// Used by the GitHub deploy workflow; you can also run it locally and upload public/ by hand.
// Left out on purpose: src/, tools/, .claude/, .github/, README.md and anything else not listed.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "public");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);

const copy = rel => fs.cpSync(path.join(root, rel), path.join(out, rel), { recursive: true });

// every built page in the site root, plus the server settings file
for (const f of fs.readdirSync(root)) {
  if (f.endsWith(".html") || f === ".htaccess" || f === "robots.txt") copy(f);
}
copy("assets");

let count = 0;
const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => e.isDirectory() ? walk(path.join(d, e.name)) : count++);
walk(out);
console.log(`public/ ready: ${count} files`);
