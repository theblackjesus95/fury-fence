// Structural release checks using only Node; run after npm run build.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../public");
const pages = JSON.parse(
  fs.readFileSync(path.join(root, "page-manifest.json"), "utf8"),
);
const titles = new Set(),
  descriptions = new Set();
let images = 0,
  links = 0;
const fileFor = (slug) => path.join(root, slug ? slug + ".html" : "index.html");
for (const p of pages) {
  const html = fs.readFileSync(fileFor(p.slug), "utf8");
  const name = p.slug || "/";
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${name}: one H1`);
  assert(!titles.has(p.title), `${name}: duplicate title`);
  titles.add(p.title);
  assert(!descriptions.has(p.description), `${name}: duplicate description`);
  descriptions.add(p.description);
  assert(
    html.includes(
      `rel="canonical" href="https://furyfence.com${p.slug ? "/" + p.slug : "/"}"`,
    ),
    `${name}: canonical`,
  );
  assert(html.includes('name="description"'), `${name}: meta description`);
  assert(html.includes('href="/quote"'), `${name}: conversion path`);
  for (const [, body] of html.matchAll(
    /<script type="application\/ld\+json">(.*?)<\/script>/gs,
  )) {
    const schema = JSON.parse(body);
    assert.equal(schema["@context"], "https://schema.org");
    assert(!body.includes("AggregateRating"), "No invented aggregate ratings");
    assert(!body.includes("streetAddress"), "No residential address");
  }
  for (const [, src] of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
    if (src.startsWith("/api/")) continue;
    const target = path.join(root, src === "/" ? "index.html" : src);
    assert(
      fs.existsSync(target) || fs.existsSync(target + ".html"),
      `${name}: broken resource ${src}`,
    );
    links++;
  }
  for (const [, tag] of html.matchAll(/(<img\b[^>]*>)/g)) {
    assert(/\balt="/.test(tag), `${name}: image alt`);
    assert(
      /\bwidth="\d+"/.test(tag) && /\bheight="\d+"/.test(tag),
      `${name}: image dimensions`,
    );
    images++;
    for (const [, set] of tag.matchAll(/srcset="([^"]+)"/g))
      for (const entry of set.split(","))
        assert(
          fs.existsSync(path.join(root, entry.trim().split(" ")[0])),
          `${name}: srcset resource`,
        );
  }
  for (const [, id] of html.matchAll(
    /<(?:input|select|textarea)\b[^>]*id="([^"]+)"/g,
  ))
    assert(html.includes(`for="${id}"`), `${name}: unlabeled ${id}`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size, `${name}: duplicate ids`);
}
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
for (const p of pages)
  assert.equal(
    sitemap.includes(
      `<loc>https://furyfence.com${p.slug ? "/" + p.slug : "/"}</loc>`,
    ),
    !p.noindex,
    `${p.slug}: sitemap inclusion`,
  );
assert(
  !fs.existsSync(path.join(root, "server.js")),
  "Backend source excluded from publish output",
);
assert(
  !fs.existsSync(path.join(root, "node_modules")),
  "Dependencies excluded from publish output",
);
assert(
  fs
    .readFileSync(path.join(root, "_redirects"), "utf8")
    .startsWith(
      fs.readFileSync(path.resolve(__dirname, "../_redirects"), "utf8").trim(),
    ),
  "Original API proxy preserved",
);
const quote = fs.readFileSync(fileFor("quote"), "utf8");
for (const key of [
  "name",
  "email",
  "phone",
  "address",
  "fenceType",
  "linearFootage",
  "fenceHeight",
  "corners",
  "endpoints",
  "singleGates",
  "doubleGates",
  "cantileverGates",
  "description",
])
  assert(quote.includes(`name="${key}"`), `Original quote field ${key}`);
console.log(
  `Passed: ${pages.length} pages; ${links} local links/assets; ${images} images; metadata, schema, sitemap, form labels and original API proxy.`,
);
