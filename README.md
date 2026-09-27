# Fury Fence website

The frontend remains static HTML on Netlify; the existing Express + SendGrid backend remains on Railway. This modernization does not change `server.js`, backend environment variables, or the API proxy destination.

## Develop and build

Requires Node 22 or later.

```sh
npm ci
npm run build
npm test
npm run preview
```

Open `http://localhost:4173`. The local preview intentionally returns 503 for API requests so development does not send live customer emails. Browser tests mock the two API endpoints.

`site/` is the editable frontend source. `scripts/build-site.cjs` creates `public/`, containing only publishable static files. `netlify.toml` sets the build command and publish directory. The original root HTML files are retained as a legacy reference; they are not the current source or the deploy output. Do not point Netlify back at the repository root.

## Edit content

- `site/services.cjs`: six service pages, titles, descriptions, FAQs and related links.
- `site/projects.json`: original photo mapping, accurate alt text, display captions and service links. Locations and project specifications are not inferred from images.
- `site/business.json`: business contact details and verified reviews, credentials and case studies. Unverified entries never render. Use `Fury Fence` until legal-name wording is confirmed.
- `site/site.css`: shared responsive design system.
- `site/site.js`: navigation and contact/estimate handling.
- `scripts/build-site.cjs`: shared layout and other page content.

All pages are rendered to HTML at build time. No frontend framework, client routing or CMS subscription is required. The only new dependency is sharp, used during the build to optimize images. Existing originals remain in the repository and at their old public URLs; the new layouts use responsive WebP copies.

## Add a verified project

Add a photo to `site/projects.json`, optimize it, and add a `caseStudies` entry to `site/business.json`:

```json
{
  "published": false,
  "slug": "descriptive-project-name",
  "title": "Verified project title",
  "summary": "A concise, verified summary for metadata and the introduction.",
  "location": "General community only",
  "scope": "Confirmed height, length, gate type and other scope details.",
  "challenge": "What the customer actually needed addressed.",
  "solution": "What Fury Fence actually did.",
  "materials": "Confirmed materials, if known.",
  "photos": [1],
  "service": "chain-link-gates-edmonton"
}
```

Photo numbers are zero-based entries in `projects.json`. Confirm photo association and publication permission, then set `published` to true. The page is generated at `/projects/descriptive-project-name` with metadata, breadcrumbs, service link and estimate CTA. Published case studies are linked automatically from the gallery and their related service page. Do not invent missing scope or a project location. No completed-job case study is published until its factual details and photo mapping are confirmed.

## Verified reviews and credentials

Reviews use `verified`, `text`, `displayName`, and optional `sourceUrl`. Set `reviewUrl` only when a real review destination is available. Credentials use `verified`, `label`, and optional `detail`. Keep customer permission and verification records outside the public repository. Blank/unverified arrays create no visible placeholder, star rating or public claim.

## Images

The build regenerates WebP assets from the original versioned photos using the pinned sharp development dependency. Run `npm ci` before building. To regenerate images alone, run `node scripts/optimize-images.cjs`. Original pixels are only resized/compressed; no generated project imagery is used. The metal picket equipment enclosure is intentionally not labeled chain-link.

## Forms and deployment

The estimate submits the original 14 JSON keys. Company, project type, requested work and timeline are formatted into `description`; the existing backend already saves and emails that field. Contact retains `name`, `email`, `message`. Inputs remain on screen on failed/ambiguous responses, and repeated clicks are blocked during submission.

Netlify proxies `/api/*` to the same Railway endpoint. Keep this rule before page redirects. The build retains clean canonical URLs, adds `.html` redirects, and supplies a real 404 page without a catch-all 200 rewrite. Deploy previews and branch builds emit `noindex` metadata and `X-Robots-Tag` headers; this is indexing control, not access control. Preview forms still reach the existing API when deployed on Netlify, so do not submit casual test leads.

Before release, confirm the effective Netlify build/publish settings and verify the preview. Merge/deployment is separate from preparing the branch. Preserve rollback access to the previous deploy. After release, verify HTTPS/canonical domain redirects, real 404 status, sitemap, API routing and an explicitly authorized end-to-end email test.

## Known limits / follow-up

- The backend returns success even if SendGrid fails or is unconfigured. Its local JSON lead storage, volume persistence, backup policy and numbering durability need a separate operational review. The frontend cannot prove actual email delivery.
- No real-user Core Web Vitals or search ranking improvement is claimed from source changes. Measure the deployed site and review Search Console after release.
- Google FAQ rich results were retired in May 2026. Visible FAQs are useful content; no rich-result promise is made.
- Organization/Service/Breadcrumb markup uses only known facts; no apartment address is added to satisfy LocalBusiness eligibility.
- Northern regional landing pages are not auto-generated. Each needs confirmed service capability, distinct useful content and real project evidence.
- Credentials, Indigenous business wording, reviews, material-supply offerings and automated-gate capabilities await owner verification before being advertised.

See `docs/REBUILD_PLAN.md` for the baseline audit and implementation sequence.
