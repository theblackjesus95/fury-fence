const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../public");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".json": "application/json",
};
http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
    } catch {
      res.writeHead(400);
      return res.end();
    }
    if (pathname.startsWith("/api/")) {
      res.writeHead(503, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          success: false,
          message: "Local preview does not submit leads.",
        }),
      );
    }
    if (
      pathname === "/index.html" ||
      (pathname.endsWith(".html") && pathname != "/404.html")
    ) {
      res.writeHead(301, {
        Location: pathname === "/index.html" ? "/" : pathname.slice(0, -5),
      });
      return res.end();
    }
    const filename = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!filename.startsWith(root + path.sep)) {
      res.writeHead(403);
      return res.end();
    }
    let file =
      fs.existsSync(filename) && fs.statSync(filename).isFile()
        ? filename
        : filename + ".html";
    const found = fs.existsSync(file) && fs.statSync(file).isFile();
    if (!found) file = path.join(root, "404.html");
    res.writeHead(found ? 200 : 404, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(process.env.PREVIEW_PORT || 4173, "0.0.0.0", () =>
    console.log(
      "Fury Fence preview: http://localhost:" +
        (process.env.PREVIEW_PORT || 4173),
    ),
  );
