// Local preview server for Website Temptations.
// Usage (from the website-temptations folder):  node tools/dev-server.js   → http://localhost:5173
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const PORT = Number(process.env.PORT) || 5173;
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);

  // Local stand-in for send-request.php (there is no PHP here): prints the submission instead of emailing it.
  if (urlPath === "/send-request.php" && req.method === "POST") {
    let body = "";
    req.on("data", c => (body += c)).on("end", () => {
      console.log("\n[form submission, not emailed locally]\n" + body + "\n");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, local: true }));
    });
    return;
  }
  const file = path.join(root, urlPath === "/" ? "index.html" : urlPath);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) {  // same as Hostinger: show the branded 404 page
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      return fs.createReadStream(path.join(root, "404.html")).on("error", () => res.end("Not found")).pipe(res);
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Website Temptations running at http://localhost:${PORT}`));
