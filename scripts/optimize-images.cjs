// Responsive image generation from the original, versioned project photos.
// Runs during the Netlify build; no image processing runs in customer browsers.
const sharp = require("sharp");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const photos = require("../site/projects.json");
(async () => {
  fs.mkdirSync(path.join(root, "assets"), { recursive: true });
  for (const photo of photos) {
    for (const width of [640, 1280, 1920]) {
      await sharp(path.join(root, photo.source))
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 70 })
        .toFile(path.join(root, `assets/${photo.image}-${width}.webp`));
    }
  }
  await sharp(path.join(root, "logo.png"))
    .resize(200, 200)
    .webp({ quality: 90 })
    .toFile(path.join(root, "assets/fury-fence-logo.webp"));
  await sharp(path.join(root, "logo.png"))
    .resize(64, 64)
    .png()
    .toFile(path.join(root, "assets/favicon.png"));
  console.log(
    "Optimized existing project images and logo. Original files retained.",
  );
})();
