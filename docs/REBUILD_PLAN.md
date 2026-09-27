# Fury Fence modernization — audit and implementation plan

Audited 27 September 2026. Baseline repository: `0174fc7`.

## Verified baseline

- Six public HTML pages: `/`, `/services`, `/projects`, `/about`, `/contact`, `/quote`. Netlify serves the frontend. HTML is immediately readable without client rendering.
- Plain HTML, duplicated embedded CSS and inline scripts; no frontend framework required.
- Main pages return HTTP 200. Each has one H1 but no meta description, canonical, social metadata or JSON-LD. Homepage title and H1 omit Edmonton. The services page has only three brief descriptions.
- `/robots.txt` and `/sitemap.xml` return HTTP 404. Unknown pages return a genuine Netlify 404, which must remain a 404 after adding a branded page. `/index.html` and `/services.html` remain accessible as duplicate URL variants.
- Eleven original project images are used in the homepage slideshow and gallery. Most are 2048 × 1536 JPEGs; the originals total approximately 8 MB. Descriptions are generic, and there are no individual project pages.
- Existing estimate contract: POST `/api/quote`, JSON keys `name`, `email`, `phone`, `address`, `fenceType`, `linearFootage`, `fenceHeight`, `corners`, `endpoints`, `singleGates`, `doubleGates`, `cantileverGates`, `description`.
- Existing contact contract: POST `/api/contact`, JSON keys `name`, `email`, `message`.
- `_redirects` proxies `/api/*` to the existing Railway app. `server.js` appends leads to local JSON files and uses SendGrid. Do not replace the backend or alter its environment variables in this redesign.
- Backend already returns success even when email sending fails or is unconfigured. Railway persistent storage, mail delivery, and backup configuration are not established by repository inspection. Keep this limitation explicit; frontend testing cannot prove email delivery.
- No analytics or Search Console verification tags found in the six public HTML pages. Account-level analytics/indexing and actual Core Web Vitals remain unverified.
- Public contact information: 825-967-0979 and info@furyfence.com. No residential address will be published.
- Current site logo is the red/black shield; the attached older logo is readable but will not silently replace the site's current identity.

## Implementation order

1. Isolated branch `codex/fury-modernization`; preserve backend and proxy contracts. No production deployment or branch merge.
2. Shared static page generator and reusable design system: charcoal, warm white, red accent, strong typography, restrained motion, accessible navigation, persistent mobile call/estimate actions.
3. Homepage: Edmonton chain-link positioning, six linked services, commercial/industrial scope, existing work, service area, process and estimate CTA. Use real existing photos, no synthetic project imagery.
4. Six distinct service pages: chain-link installation, commercial, industrial, repair, gates and security. Natural customer-oriented content, materials/options, scoping considerations, FAQs, related services and photos. No automatic-gate/electrical claims or unverified industrial credentials.
5. Quote/contact redesign with visible labels, optional measurements, collapsible detailed takeoff fields, submission lock, truthful success/error handling and retained entries on error. Encode new company/property type/work type/schedule details inside the existing `description` key so the unchanged backend includes them in email and stored leads.
6. Project gallery retains all 11 existing photos. Structured project data supports future case studies. Publish only image-supported observations; unknown location/dimensions/customer/challenge are omitted. Recent gate-job case study waits for its actual photo mapping and confirmed location.
7. About and service-area pages, visible useful FAQs, private credential/review content slots that render only when verified. Northern regions remain future content plans, with an inquiry option rather than claims of offices, deployments or established mine contracts.
8. Technical SEO: unique metadata, canonical URLs, Organization/Service/Breadcrumb schema, responsive WebP images, dimensions and lazy loading, sitemap, robots, clean URL redirects, custom 404. Google retired FAQ rich results in May 2026, so visible FAQs do not need FAQ rich-result markup. Do not invent an address to meet LocalBusiness rich-result requirements.
9. Validation: page/link/metadata/image checks; desktop/mobile visual inspection; quote/contact success, failure and payload tests using local mocks; confirm unchanged `server.js` and Railway proxy. Build a static publish directory so source and lead files are excluded from Netlify uploads.
10. Commit and open a draft PR if repository write access is available. Production release follows review of the finished branch and confirmation of the actual Netlify build settings. After release: owner-approved delivery test, Search Console sitemap submission and index coverage monitoring.

## Business inputs still needed before publishing corresponding claims

- Insurance, WCB, certifications, safety/prequalification documents, company legal name and verified Métis/Indigenous business wording.
- Confirmed travel/service territory beyond Edmonton and surrounding communities.
- Photo-to-project mapping, general locations, scope/dimensions, dates, permissions and recent gate-job photos.
- Genuine reviews and a verified review destination. No public empty review or credential placeholders.
- Confirmation of standalone material supply and exact sliding/cantilever/automation capability before expanding advertised services.

## Sources

- https://furyfence.com/ and the five linked main pages, plus robots/sitemap and URL-variant HTTP checks.
- https://github.com/theblackjesus95/fury-fence at baseline commit above.
- https://developers.google.com/search/updates (FAQ rich result retirement, May/June 2026 entries).
- https://developers.google.com/search/docs/appearance/structured-data/local-business (required address properties; privacy takes precedence over rich-result eligibility).

This is a source/HTTP audit, not a claim of measured search rankings, real-user Core Web Vitals, verified credentials or successful email delivery.
