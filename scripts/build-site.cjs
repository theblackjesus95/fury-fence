const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const out = path.join(root, "public");
const biz = require("../site/business.json");
const photos = require("../site/projects.json");
const services = require("../site/services.cjs");
const preview =
  process.argv.includes("--preview") ||
  ["deploy-preview", "branch-deploy"].includes(process.env.CONTEXT);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
const pages = [];
fs.mkdirSync(out, { recursive: true });
// Remove generated output only; original photos and backend files are never touched.
for (const item of fs.readdirSync(out))
  fs.rmSync(path.join(out, item), { recursive: true, force: true });
fs.cpSync(path.join(root, "assets"), path.join(out, "assets"), {
  recursive: true,
});
for (const file of ["site.css", "site.js"])
  fs.copyFileSync(
    path.join(root, "site", file),
    path.join(out, "assets", file),
  );
// Preserve old image URLs while all new layouts use responsive optimized assets.
for (const name of ["logo.png", ...photos.map((p) => p.source)])
  fs.copyFileSync(path.join(root, name), path.join(out, name));
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
const button = (text = "Request an estimate", href = "/quote", style = "") =>
  `<a class="button ${style}" href="${esc(href)}">${esc(text)}${arrow}</a>`;
const image = (
  index,
  { eager = false, sizes = "(max-width: 800px) 100vw, 50vw", cls = "" } = {},
) => {
  const p = photos[index];
  // Last original is only 960px wide; avoid lying about intrinsic srcset widths.
  const max = index === 10 ? 960 : 1920;
  return `<img class="${cls}" src="/assets/${p.image}-1280.webp" srcset="/assets/${p.image}-640.webp 640w, /assets/${p.image}-1280.webp ${Math.min(1280, max)}w${max > 1280 ? `, /assets/${p.image}-1920.webp 1920w` : ""}" sizes="${esc(sizes)}" width="${max}" height="${(max * 3) / 4}" alt="${esc(p.alt)}" ${eager ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async">`;
};
const brand = () =>
  `<a class="brand" href="/" aria-label="Fury Fence home"><img src="/assets/fury-fence-logo.webp" alt="" width="200" height="200"><span class="brand-type">FURY FENCE<small>EDMONTON · ALBERTA</small></span></a>`;
const header = (slug) =>
  `<a class="skip" href="#main">Skip to content</a><div class="topbar"><div class="wrap"><span>EDMONTON & SURROUNDING COMMUNITIES</span><a href="tel:${biz.phoneHref}"><b>LET’S TALK FENCING &nbsp; </b>${biz.phone}</a></div></div><header class="site-header"><div class="wrap header-inner">${brand()}<button class="menu-toggle" aria-controls="main-nav" aria-expanded="false" type="button">Menu</button><nav class="nav" id="main-nav" aria-label="Main navigation">${[
    ["services", "Services"],
    ["projects", "Our work"],
    ["about", "About"],
    ["service-areas", "Service areas"],
    ["contact", "Contact"],
  ]
    .map(
      ([href, label]) =>
        `<a href="/${href}" ${slug === href ? 'aria-current="page"' : ""}>${label}</a>`,
    )
    .join(
      "",
    )}<a href="/quote" class="nav-estimate">Request an estimate ↗</a></nav><div class="header-cta">${button()}</div></div></header>`;
const footer = () =>
  `<footer class="footer"><div class="wrap"><div class="footer-grid"><div>${brand()}<p>Chain-link fencing, gates and repairs.<br>For homes, businesses and work sites.</p></div><div><h2>Explore</h2><ul><li><a href="/services">Fencing services</a></li><li><a href="/projects">Our work</a></li><li><a href="/about">About Fury Fence</a></li><li><a href="/service-areas">Service areas</a></li><li><a href="/quote">Request an estimate</a></li></ul></div><div><h2>Let’s talk fencing</h2><ul><li><a href="tel:${biz.phoneHref}">${biz.phone}</a></li><li><a href="mailto:${biz.email}">${biz.email}</a></li><li><a href="/contact">Contact Fury Fence ↗</a></li></ul><p>Based in Edmonton, Alberta.<br>Serving customers at their project sites.</p></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Fury Fence. All rights reserved.</span><a href="/privacy">Privacy & inquiries</a></div></div></footer><nav class="mobile-actions" aria-label="Quick contact"><a href="tel:${biz.phoneHref}">Call Fury Fence</a><a href="/quote">Request an estimate ↗</a></nav>`;
const cta = (
  heading = "Let’s get your fence on the ground.",
  text = "Send us the location, the scope and what you have in mind.",
) =>
  `<section class="cta-band"><div class="wrap"><div><h2>${heading}</h2><p>${text}</p></div>${button("Request an estimate", "/quote", "light")}</div></section>`;
const crumbs = (label, parent) =>
  `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span>${parent ? `<a href="/${parent.slug}">${esc(parent.name)}</a><span aria-hidden="true">/</span>` : ""}<span aria-current="page">${esc(label)}</span></nav>`;
const top = (label, h1, intro, eyebrow = "Fury Fence · Edmonton") =>
  `<section class="page-top"><div class="wrap">${crumbs(label)}<span class="eyebrow">${eyebrow}</span><h1>${h1}</h1><p class="lead">${intro}</p></div></section>`;
function page(
  slug,
  title,
  description,
  body,
  {
    schema = [],
    noindex = false,
    parent = null,
    label = title.split("|")[0].trim(),
    socialImage = 0,
  } = {},
) {
  const url = biz.url + (slug ? "/" + slug : "/");
  const organization = {
    "@type": "Organization",
    "@id": biz.url + "/#organization",
    name: biz.name,
    url: biz.url,
    logo: biz.url + "/assets/fury-fence-logo.webp",
    telephone: biz.phoneHref,
    email: biz.email,
    areaServed: { "@type": "City", name: "Edmonton" },
  };
  const breadcrumb = slug
    ? [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: biz.url + "/",
            },
            ...(parent
              ? [
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: parent.name,
                    item: biz.url + "/" + parent.slug,
                  },
                ]
              : []),
            {
              "@type": "ListItem",
              position: parent ? 3 : 2,
              name: label,
              item: url,
            },
          ],
        },
      ]
    : [];
  const html = `<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${url}">${noindex || preview ? '<meta name="robots" content="noindex, follow">' : ""}<meta name="theme-color" content="#191e1c"><meta property="og:type" content="website"><meta property="og:locale" content="en_CA"><meta property="og:site_name" content="Fury Fence"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${biz.url}/assets/${photos[socialImage].image}-1280.webp"><meta property="og:image:alt" content="${esc(photos[socialImage].alt)}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/png" href="/assets/favicon.png"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/site.js" defer></script><script type="application/ld+json">${json({ "@context": "https://schema.org", "@graph": [organization, ...breadcrumb, ...schema] })}</script></head><body>${header(slug)}<main id="main">${body}</main>${footer()}</body></html>`;
  const file = path.join(out, slug ? slug + ".html" : "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  pages.push({ slug, title, description, noindex });
}
const short = [
  "Galvanized and black chain-link for yards, properties and work sites.",
  "Practical perimeters and access for businesses, facilities and contractors.",
  "Chain-link scopes for work yards, compounds and industrial properties.",
  "Damaged fabric, bent rails, leaning posts and gates that need attention.",
  "Pedestrian, vehicle and custom gate openings planned around your access.",
  "Site-specific chain-link perimeters and controlled access points.",
];
const serviceCards = () =>
  `<div class="service-grid">${services.map((s, i) => `<a class="service-card" href="/${s.slug}"><span class="number">0${i + 1} /</span>${arrow}<h3>${s.name}</h3><p>${short[i]}</p></a>`).join("")}</div>`;
const projectCard = (i) =>
  `<figure class="project-card">${image(i, { sizes: "(max-width: 480px) 100vw, (max-width: 800px) 50vw, 33vw" })}<figcaption>${esc(photos[i].caption)}</figcaption>${photos[i].service ? `<a href="/${photos[i].service}">Explore this service ↗</a>` : ""}</figure>`;
const areas = () =>
  `<ul class="area-list">${["Edmonton", "Sherwood Park", "St. Albert", "Leduc", "Nisku", "Beaumont", "Spruce Grove", "Fort Saskatchewan"].map((a) => `<li>${a}</li>`).join("")}</ul>`;
const processSteps = () =>
  `<div class="process"><div><b>01 / TELL US THE SCOPE</b><h3>Start with your project.</h3><p>Share the location, fence type, approximate length and any gates. Measurements can come later if needed.</p></div><div><b>02 / WORK THROUGH THE DETAILS</b><h3>Get a clear estimate.</h3><p>We review materials, access, site conditions and the information needed to define the work.</p></div><div><b>03 / PLAN THE INSTALLATION</b><h3>Agree on the next steps.</h3><p>Once the scope is accepted, we confirm materials, site readiness and scheduling for your project.</p></div></div>`;
const publishedProjects = biz.caseStudies.filter(p => p.published === true);
const projectCases = service => {
  const cases = publishedProjects.filter(p => !service || p.service === service);
  return cases.length ? `<section class="section white"><div class="wrap"><span class="eyebrow">Project details</span><h2 class="faq-title">A closer look at completed work.</h2><div class="projects-grid">${cases.map(p => `<a class="project-card" href="/projects/${esc(p.slug)}">${image(p.photos[0])}<h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p></a>`).join('')}</div></div></section>` : '';
};
const verifiedReviews = biz.reviews.filter((r) => r.verified === true);
const reviews = verifiedReviews.length
  ? `<section class="section white"><div class="wrap"><span class="eyebrow">Customer feedback</span><h2>From our customers.</h2><div class="process">${verifiedReviews.map((r) => `<blockquote class="review"><p>${esc(r.text)}</p><cite>${esc(r.displayName)}</cite>${r.sourceUrl ? `<p><a href="${esc(r.sourceUrl)}">Read original review</a></p>` : ""}</blockquote>`).join("")}</div>${biz.reviewUrl ? `<a href="${esc(biz.reviewUrl)}">Leave a review</a>` : ""}</div></section>`
  : "";
page(
  "",
  "Chain Link Fence Edmonton | Installation & Repair | Fury Fence",
  "Edmonton chain-link fence installation, repairs and custom gates. Residential, commercial and industrial fencing from Fury Fence. Request a project estimate.",
  `
<section class="hero"><div class="hero-grid"><div class="hero-copy"><span class="eyebrow">CHAIN-LINK FENCING. EDMONTON & AREA.</span><h1>Chain-link fence<br>contractor in<br><em>Edmonton & Alberta.</em></h1><p>Fences that define the boundary. Gates that keep things moving. Installation and repairs for businesses, work sites and homes.</p><div class="actions">${button()}<a class="call-link" href="tel:${biz.phoneHref}">Call ${biz.phone} ↗</a></div><div class="hero-index"><span></span>COMMERCIAL · INDUSTRIAL · RESIDENTIAL</div></div><div class="hero-media">${image(0, { eager: true })}<span class="photo-label">Galvanized chain-link / project portfolio</span></div></div></section>
<div class="scope-strip"><div class="wrap"><span>Chain-link specialists</span><span class="dot"></span><span>New installations & repairs</span><span class="dot"></span><span>Custom gates & access</span></div></div>
<section class="section"><div class="wrap"><div class="section-heading"><div><span class="eyebrow">01 / WHAT WE DO</span><h2>One focus.<br>A fence for your site.</h2></div><p>From a yard gate to a commercial perimeter, start with the service that fits your project.</p></div>${serviceCards()}</div></section>
<section class="section white"><div class="wrap split"><div class="split-photo">${image(2)}<span class="photo-label">Black chain-link / project portfolio</span></div><div><span class="eyebrow">02 / BUILT AROUND THE WORK</span><h2>Your site has a job to do.<br>So does your fence.</h2><p class="lead">Define the perimeter. Plan the access. Keep the scope clear from the first conversation.</p><ul class="rule-list"><li>Commercial properties, yards and construction scopes</li><li>Gates planned around people, vehicles and equipment</li><li>Materials and installation details reviewed for the site</li><li>Residential chain-link and repairs welcome</li></ul>${button("Discuss a commercial project", "/commercial-fencing-edmonton", "secondary")}</div></div></section>
<section class="section"><div class="wrap"><div class="section-heading"><div><span class="eyebrow">03 / A LOOK AT THE WORK</span><h2>Fences in the field.</h2></div><a class="text-link" href="/projects">View the project gallery ↗</a></div><div class="projects-grid featured">${[1, 3, 8].map(projectCard).join("")}</div></div></section>
<section class="section white"><div class="wrap"><span class="eyebrow">04 / FROM INQUIRY TO INSTALLATION</span><h2>Let’s make the next step straightforward.</h2>${processSteps()}</div></section>
<section class="section territory"><div class="wrap split"><div><span class="eyebrow">05 / EDMONTON IS HOME BASE</span><h2>Local work.<br>A wider conversation.</h2></div><div><p class="lead">Serving Edmonton and surrounding communities. For an Alberta or northern project farther afield, send the location and scope so we can discuss feasibility and travel.</p>${areas()}<p><a class="text-link" href="/service-areas">Service areas & project inquiries ↗</a></p></div></div></section>${reviews}${cta()}`,
);

page(
  "services",
  "Fence Services Edmonton | Chain-Link & Gates | Fury Fence",
  "Explore Edmonton chain-link installation, commercial and industrial fencing, repairs, gates and security fence services from Fury Fence.",
  top(
    "Services",
    "Fencing, with a clear purpose.",
    "Chain-link installations, gates and repairs for the way your property is used. Explore the scope that fits your project.",
  ) +
    `<section class="section"><div class="wrap">${serviceCards()}</div></section><section class="section white"><div class="wrap"><span class="eyebrow">Start with what you know</span><h2>A rough outline is a good beginning.</h2>${processSteps()}</div></section>${cta()}`,
);
for (const s of services) {
  const body = `<section class="page-top"><div class="wrap">${crumbs(s.name, { slug: "services", name: "Services" })}<div class="page-hero"><div><span class="eyebrow">${esc(s.eyebrow)}</span><h1>${esc(s.h1)}</h1><p class="lead">${esc(s.intro)}</p><div class="actions">${button()}</div></div>${image(s.image, { eager: true, sizes: "(max-width: 800px) 100vw, 40vw" })}</div></div></section><section class="section"><div class="wrap content-layout"><article>${s.sections.map(([h, ...paragraphs]) => `<section class="article-section"><h2>${esc(h)}</h2>${paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}</section>`).join("")}<section class="article-section"><h2>Talk through your Edmonton-area project.</h2><p>Start with your location and the work you have in mind. <a href="/quote">Request an estimate</a>, <a href="tel:${biz.phoneHref}">call ${biz.phone}</a> or <a href="/projects">view our project photos</a>. See our <a href="/service-areas">service-area information</a> for nearby communities and inquiries farther away.</p></section></article><aside class="sidebar"><h2>Have a project in mind?</h2><p>Send the location, approximate scope and your preferred timing. You do not need every measurement to start.</p>${button()}<div class="sidebar-links"><a href="tel:${biz.phoneHref}">${biz.phone}</a><a href="/projects">See our project gallery ↗</a>${s.related.map((slug) => `<a href="/${slug}">${services.find((t) => t.slug === slug).name} ↗</a>`).join("")}</div></aside></div></section><section class="section white"><div class="wrap"><span class="eyebrow">Useful answers</span><h2 class="faq-title">Before you request an estimate.</h2><div class="faq">${s.faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></div></section>${projectCases(s.slug)}${cta()}`;
  page(s.slug, s.title, s.description, body, {
    label: s.name,
    parent: { slug: "services", name: "Services" },
    socialImage: s.image,
    schema: [
      {
        "@type": "Service",
        name: s.name,
        serviceType: s.name,
        provider: { "@id": biz.url + "/#organization" },
        areaServed: { "@type": "City", name: "Edmonton" },
        url: biz.url + "/" + s.slug,
        description: s.description,
      },
    ],
  });
}

page(
  "projects",
  "Fence & Gate Project Gallery | Fury Fence Edmonton",
  "See fencing and gate photos from the Fury Fence portfolio: chain-link perimeters, residential yard fencing, pedestrian gates and wider access openings.",
  top(
    "Our work",
    "A closer look at the work.",
    "Chain-link perimeters. Pedestrian gates. Yard access. Explore the fencing photos in our portfolio, then tell us what your own site needs.",
  ) +
    `<section class="section"><div class="wrap"><div class="projects-grid">${photos.map((_, i) => projectCard(i)).join("")}</div></div></section>${projectCases()}${cta("Have a similar project in mind?", "Tell us which fence or gate arrangement you are considering.")}`,
);

const credentials = biz.credentials.filter((c) => c.verified === true);
page(
  "about",
  "About Fury Fence | Edmonton Chain-Link Contractor",
  "Meet Fury Fence, an Edmonton-based chain-link fence contractor focused on installation, gates and repairs for residential, commercial and industrial properties.",
  top(
    "About",
    "Straightforward work.<br>A clearly defined scope.",
    "Fury Fence is an Edmonton-based fence contractor focused on chain-link installations, gates and repairs.",
    "About Fury Fence",
  ) +
    `<section class="section white"><div class="wrap split"><div><span class="eyebrow">Chain-link is our focus</span><h2>Practical fencing.<br>Attention to the details.</h2><p class="lead">We work with customers who need a usable boundary, a dependable gate and a clear understanding of the work being quoted.</p><p>That might mean fencing a residential yard, replacing a damaged section or reviewing a commercial perimeter. The purpose stays the same: understand the site, choose a suitable system and agree on the scope before the work begins.</p><p>For commercial and industrial inquiries, send drawings, specifications and site requirements where available. Access, materials, ground conditions and scheduling all deserve a place in the conversation.</p>${button("Explore our services", "/services", "secondary")}</div><div class="split-photo">${image(8)}</div></div></section><section class="section"><div class="wrap"><span class="eyebrow">How we approach your project</span><h2>Good work starts before installation.</h2>${processSteps()}</div></section><section class="section territory"><div class="wrap split"><div><h2>Edmonton roots.<br>Room to grow.</h2></div><div><p class="lead">Fury Fence serves Edmonton and surrounding communities, with an interest in carefully scoped commercial, industrial and northern project opportunities.</p><p>Travel, availability and site qualifications are confirmed for each project. If your procurement process has specific insurance, WCB, safety or vendor requirements, include them with your inquiry.</p>${credentials.length ? `<ul class="rule-list">${credentials.map((c) => `<li>${esc(c.label)}${c.detail ? " — " + esc(c.detail) : ""}</li>`).join("")}</ul>` : ""}<p><a href="/service-areas" class="text-link">Where we work & how to inquire ↗</a></p></div></div></section>${cta()}`,
);

page(
  "service-areas",
  "Edmonton Fence Service Areas | Alberta Inquiries | Fury Fence",
  "Fury Fence serves Edmonton and nearby communities. Send the location and scope for fencing inquiries elsewhere in Alberta or for northern projects.",
  top(
    "Service areas",
    "Edmonton is our home base.",
    "Chain-link fencing, gates and repairs for Edmonton and surrounding communities. For sites farther away, start a conversation about the scope and location.",
  ) +
    `<section class="section white"><div class="wrap split"><div><span class="eyebrow">Edmonton & surrounding communities</span><h2>Your project.<br>Our starting point.</h2><p class="lead">Let us know where the work is located so access, travel and scheduling can be considered in the estimate.</p>${areas()}</div><div class="note">Fury Fence is a service-area business. We visit customer project sites. Send your community or project location with the inquiry so we can discuss access and scheduling.</div></div></section><section class="section"><div class="wrap content-layout"><div><section class="article-section"><h2>Alberta and northern project inquiries</h2><p>For work outside the Edmonton area, provide the community, approximate scope, access conditions and intended schedule. Inquiries for Grande Prairie, the Peace Region, northern Alberta, Fort Nelson / Northern Rockies and the Northwest Territories can be reviewed individually.</p><p>Travel, freight, accommodation, site requirements and availability are reviewed for each inquiry before accepting work.</p></section><section class="article-section"><h2>What helps us assess a distant project</h2><p>Include fence lengths and heights, gate openings, drawings or specifications, access and freight arrangements, ground conditions and the construction window. Tell us about any required safety documentation, orientations, insurance, WCB or vendor qualification.</p><p>Mining, environmental, utility and infrastructure projects can have additional requirements. A fencing inquiry does not establish that every site qualification is already in place; the actual project requirements need to be reviewed.</p></section></div><aside class="sidebar"><h2>Where is your project?</h2><p>Send the location and scope. We can discuss what is needed to assess the work.</p>${button("Discuss your project")}<div class="sidebar-links"><a href="/industrial-fencing-edmonton">Industrial fencing ↗</a><a href="/commercial-fencing-edmonton">Commercial fencing ↗</a></div></aside></div></section>${cta()}`,
);

function field(
  name,
  label,
  {
    type = "text",
    required = false,
    placeholder = "",
    autocomplete = "",
    options = null,
    full = false,
  } = {},
) {
  const control = options
    ? `<select id="${name}" name="${name}">${options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("")}</select>`
    : type === "textarea"
      ? `<textarea id="${name}" name="${name}" ${required ? "required" : ""} placeholder="${esc(placeholder)}"></textarea>`
      : `<input id="${name}" name="${name}" type="${type}" ${required ? "required" : ""} ${autocomplete ? `autocomplete="${autocomplete}"` : ""} ${type === "number" ? 'min="0" step="' + (["fenceHeight", "linearFootage"].includes(name) ? "0.1" : "1") + '"' : ""} placeholder="${esc(placeholder)}">`;
  return `<div class="field ${full ? "full" : ""}"><label for="${name}">${label}${required ? ' <span aria-hidden="true">*</span>' : ""}</label>${control}</div>`;
}
const formEnd = (label) =>
  `<button class="button" type="submit">${label}${arrow}</button><p class="privacy-note">Your details are used to respond to this inquiry. <a href="/privacy">Privacy & inquiries</a>.</p><div id="form-status" class="form-status" role="status" aria-live="polite" tabindex="-1"></div><noscript><p class="note">This form needs JavaScript to send. Call <a href="tel:${biz.phoneHref}">${biz.phone}</a> or email <a href="mailto:${biz.email}">${biz.email}</a>.</p></noscript>`;
const asideContact = () =>
  `<aside class="sidebar"><span class="eyebrow">Let’s talk fencing</span><h2>Prefer a conversation?</h2><div class="contact-options"><a href="tel:${biz.phoneHref}">${biz.phone}</a><a href="mailto:${biz.email}">${biz.email}</a></div><p>Edmonton & surrounding communities.</p><p>For a larger or distant project, include the location, scope and bid or installation dates.</p><p>Need to send drawings or photos? Email them with your name and project location. This form does not upload attachments.</p></aside>`;
page(
  "quote",
  "Request a Fence Estimate | Edmonton | Fury Fence",
  "Request an estimate for Edmonton chain-link fencing, repairs or gates. Share contact details, location and optional measurements with Fury Fence.",
  top(
    "Request an estimate",
    "Tell us what you’re building.",
    "A few details are enough to start. If you do not know the measurements, describe the project and we can discuss what is needed.",
    "Request an estimate",
  ) +
    `<section class="section"><div class="wrap form-layout"><form class="form-panel" data-lead-form="quote" action="/api/quote" method="post"><p class="form-intro">Fields marked * are required. Fence measurements and counts are optional.</p><fieldset><legend>01 / Your contact details</legend><div class="form-grid">${field("name", "Your name", { autocomplete: "name" })}${field("company", "Company <small>(if applicable)</small>", { autocomplete: "organization" })}${field("email", "Email", { type: "email", required: true, autocomplete: "email" })}${field("phone", "Phone", { type: "tel", required: true, autocomplete: "tel" })}</div></fieldset><fieldset><legend>02 / The project</legend><div class="form-grid">${field("address", "Project location", { full: true, placeholder: "Street address or community; exact address can follow" })}${field(
      "projectType",
      "Property / project type",
      {
        options: [
          ["", "Select if known"],
          ["Residential", "Residential"],
          ["Commercial", "Commercial"],
          ["Industrial", "Industrial"],
          ["Contractor / tender", "Contractor / tender"],
          ["Other / unsure", "Other / unsure"],
        ],
      },
    )}${field("workType", "Work requested", {
      options: [
        ["", "Select if known"],
        ["New installation", "New installation"],
        ["Repair", "Repair"],
        ["Gate", "Gate"],
        ["Replacement", "Replacement"],
        ["Other / unsure", "Other / unsure"],
      ],
    })}${field("fenceType", "Fence type / finish", { placeholder: "Galvanized chain-link, black chain-link…" })}${field("timeline", "Desired schedule", { placeholder: "Approximate dates or bid deadline" })}${field("description", "Description of the work", { type: "textarea", full: true, placeholder: "What needs fencing or repair? Include gates, access, site conditions and anything else we should know." })}</div></fieldset><details class="measurements"><summary>Have measurements? Add fence and gate details <span class="muted">(optional)</span></summary><div class="form-grid">${field("linearFootage", "Approximate length (feet)", { type: "number" })}${field("fenceHeight", "Fence height (feet)", { type: "number" })}${field("corners", "Number of corners", { type: "number" })}${field("endpoints", "Number of end points", { type: "number" })}${field("singleGates", "Single swing gates", { type: "number" })}${field("doubleGates", "Double swing gates", { type: "number" })}${field("cantileverGates", "Cantilever gates requested", { type: "number" })}</div></details>${formEnd("Send estimate request")}</form>${asideContact()}</div></section>`,
);
page(
  "contact",
  "Contact Fury Fence | Edmonton Fencing & Gates",
  "Contact Fury Fence in Edmonton at 825-967-0979 or info@furyfence.com. Ask about chain-link installation, fence repairs, gates or a commercial project.",
  top(
    "Contact",
    "Let’s talk fencing.",
    "Ask a question, describe a repair or start a conversation about your next project. For a detailed fence quote, use our estimate form.",
  ) +
    `<section class="section"><div class="wrap form-layout"><form class="form-panel" data-lead-form="contact" action="/api/contact" method="post"><p class="form-intro">All three fields are required.</p><fieldset><legend>Send a message</legend><div class="form-grid">${field("name", "Your name", { required: true, autocomplete: "name" })}${field("email", "Email", { type: "email", required: true, autocomplete: "email" })}${field("message", "How can we help?", { type: "textarea", required: true, full: true })}</div></fieldset>${formEnd("Send message")}<p class="privacy-note">Ready to describe a fence project? <a href="/quote">Request an estimate ↗</a></p></form>${asideContact()}</div></section>`,
);
page(
  "privacy",
  "Privacy & Inquiries | Fury Fence",
  "How to contact Fury Fence about information provided through a fence estimate request or contact inquiry.",
  top(
    "Privacy & inquiries",
    "Your inquiry details.",
    "Information about contacting Fury Fence through this website.",
  ) +
    `<section class="section"><div class="wrap legal"><h2>Information you provide</h2><p>The contact and estimate forms request information you choose to share, such as your name, email, phone number, project location and fencing requirements. We use those details to review and respond to your inquiry.</p><h2>Website and inquiry services</h2><p>The website is hosted on Netlify. Form submissions are processed by the Fury Fence backend hosted on Railway and may be sent to the business inbox using SendGrid. Hosting and email providers may process technical information needed to deliver these services.</p><h2>Share only what is needed</h2><p>Please do not include payment-card details, identification documents or other sensitive personal information in a general inquiry. An approximate project location is enough for an initial conversation.</p><h2>Questions about your information</h2><p>For questions about information you have submitted, or to request a correction or deletion, contact <a href="mailto:${biz.email}">${biz.email}</a> or <a href="tel:${biz.phoneHref}">${biz.phone}</a>. This page describes the website inquiry flow; it is not a promise of a particular retention period.</p></div></section>`,
);
page(
  "404",
  "Page Not Found | Fury Fence",
  "Find fencing services, project photos or contact Fury Fence in Edmonton.",
  top(
    "Page not found",
    "That page isn’t here.",
    "The address may have changed. Explore our fencing services or get in touch about your project.",
  ) +
    `<section class="section"><div class="wrap actions">${button("Explore our services", "/services")}${button("Go to homepage", "/", "secondary")}</div></section>`,
  { noindex: true },
);

// Add verified case studies without editing templates. Drafts never render.
for (const project of publishedProjects) {
  for (const key of [
    "slug",
    "title",
    "summary",
    "location",
    "scope",
    "challenge",
    "solution",
    "photos",
    "service",
  ])
    if (!project[key]) throw new Error(`Case study missing ${key}`);
  if (
    !/^[a-z0-9-]+$/.test(project.slug) ||
    !services.some((s) => s.slug === project.service) ||
    !project.photos.length ||
    project.photos.some((i) => !photos[i])
  )
    throw new Error("Invalid case study route, service or photo");
  const body =
    top(
      project.title,
      esc(project.title),
      esc(project.summary),
      "Project / " + esc(project.location),
    ) +
    `<section class="section"><div class="wrap content-layout"><article><section class="article-section"><h2>The scope</h2><p>${esc(project.scope)}</p></section><section class="article-section"><h2>The challenge</h2><p>${esc(project.challenge)}</p></section><section class="article-section"><h2>The work</h2><p>${esc(project.solution)}</p></section>${project.materials ? `<section class="article-section"><h2>Materials</h2><p>${esc(project.materials)}</p></section>` : ""}<p><a href="/${project.service}">Explore the related fencing service ↗</a></p></article><aside>${project.photos.map(projectCard).join("")}</aside></div></section>${cta()}`;
  page(
    "projects/" + project.slug,
    project.title + " | Fury Fence",
    project.summary,
    body,
    {
      label: project.title,
      parent: { slug: "projects", name: "Our work" },
      socialImage: project.photos[0],
    },
  );
}
// Index only real published pages. Northern landing pages must be authored individually.
const indexed = pages.filter((p) => !p.noindex);
fs.writeFileSync(
  path.join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexed.map((p) => `<url><loc>${biz.url}${p.slug ? "/" + p.slug : "/"}</loc></url>`).join("")}</urlset>`,
);
fs.writeFileSync(
  path.join(out, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${biz.url}/sitemap.xml\n`,
);
// Keep the existing API proxy verbatim, ahead of page redirects.
const proxy = fs.readFileSync(path.join(root, "_redirects"), "utf8").trim();
fs.writeFileSync(
  path.join(out, "_redirects"),
  proxy +
    "\n/index.html / 301!\n" +
    pages
      .filter((p) => p.slug && p.slug !== "404")
      .map((p) => `/${p.slug}.html /${p.slug} 301!`)
      .join("\n") +
    "\n",
);
if (preview)
  fs.writeFileSync(
    path.join(out, "_headers"),
    "/*\n  X-Robots-Tag: noindex, nofollow\n",
  );
fs.writeFileSync(
  path.join(out, "page-manifest.json"),
  JSON.stringify(pages, null, 2),
);
console.log(
  `Built ${pages.length} pages, ${photos.length} portfolio photos${preview ? " (noindex preview)" : ""}.`,
);
