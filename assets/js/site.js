(() => {
  "use strict";

  const storage = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (_) { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch (_) { /* Storage can be disabled. */ }
    }
  };

  // The address is reconstructed only after a visitor intentionally clicks a
  // contact button. This deters simple address harvesters without placing a
  // plain-text email address in the page markup or content data.
  const CONTACT_KEY = 73;
  const CONTACT_BYTES = [
    40, 59, 44, 47, 103, 57, 40, 59, 32, 51,
    9, 60, 61, 58, 38, 60, 61, 33, 62, 44,
    58, 61, 44, 59, 39, 103, 44, 45, 60
  ];

  function decodeContactAddress() {
    return CONTACT_BYTES
      .map((value) => String.fromCharCode(value ^ CONTACT_KEY))
      .join("");
  }

  function setupContactButtons() {
    document.querySelectorAll("[data-contact-button]").forEach((button) => {
      button.addEventListener("click", () => {
        window.location.href = `mailto:${decodeContactAddress()}`;
      });
    });
  }
  
  const content = window.NEUROFOLIO_CONTENT;
  if (!content) {
    console.error("NEUROFOLIO_CONTENT is missing. Load content.js before site.js.");
    return;
  }

  const ICONS = {
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.3A8.5 8.5 0 0 1 8.7 4 8.5 8.5 0 1 0 20 15.3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    activity: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2-6 4 12 2-6h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    calm: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9c2-2 4-2 6 0s4 2 6 0 3-1 4 0M4 15c2-2 4-2 6 0s4 2 6 0 3-1 4 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    burst: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    nodes: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="7" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="18" cy="6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="18" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m8 8 3 8M16 7l-3 9M8 7h8" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    model: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18V8l4-3 4 3 4-3 4 3v10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 18h16M8 5v13M12 8v10M16 5v13" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    layers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3V6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  const navItems = [
    { page: "home", label: "About", href: "./index.html" },
    { page: "publications", label: "Publications", href: "./publications.html" },
    { page: "ideas", label: "Ideas & posts", href: "./ideas.html" },
    { page: "concepts", label: "Concept atlas", href: "./concepts.html" }
  ];

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeHref(value = "") {
    const text = String(value).trim();
    if (!text) return "";
    if (/^(\.\/|\.\.\/|\/|#)/.test(text)) return text;
    try {
      const url = new URL(text, window.location.href);
      if (["http:", "https:", "mailto:"].includes(url.protocol)) return url.href;
    } catch (_) {
      return "";
    }
    return "";
  }

  function formatDate(value) {
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.valueOf())) return value;
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(date);
  }

  function pageName() {
    const page = document.body.dataset.page || "home";
    return page === "publication" ? "publications" : page;
  }

  function linkAttributes(url) {
    const href = safeHref(url);
    if (!href) return "";
    const external = /^(https?:)/i.test(href);
    return `href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}`;
  }

  function injectShell() {
    const current = pageName();
    const header = document.querySelector("#site-header");
    const footer = document.querySelector("#site-footer");

    if (header) {
      header.className = "site-header";
      header.innerHTML = `
        <a class="skip-link" href="#main-content">Skip to content</a>
        <div class="nav-shell">
          <a class="brand" href="./index.html" aria-label="${escapeHtml(content.profile.shortName)} home">
            <span class="brand-mark">${escapeHtml(content.profile.initials)}</span>
            <span class="brand-copy">
              <strong>${escapeHtml(content.profile.shortName)}</strong>
              <span>Computational neuroscience</span>
            </span>
          </a>
          <nav class="nav-links" id="primary-navigation" aria-label="Primary navigation">
            ${navItems.map((item) => `
              <a class="nav-link" href="${item.href}" ${item.page === current ? 'aria-current="page"' : ""}>${item.label}</a>
            `).join("")}
          </nav>
          <div class="nav-actions">
            <button class="icon-button" id="theme-toggle" type="button" aria-label="Switch color theme"></button>
            <button class="icon-button" id="motion-toggle" type="button" aria-label="Pause background activity"></button>
            <button class="icon-button" id="burst-trigger" type="button" aria-label="Trigger a neural burst">${ICONS.burst}</button>
            <button class="menu-button" id="menu-toggle" type="button" aria-label="Open navigation" aria-controls="primary-navigation" aria-expanded="false">${ICONS.menu}</button>
          </div>
        </div>`;
    }

    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML = `
        <div class="page-shell">
          <div class="footer-rango-grid">
            <figure class="tms-scene" aria-label="Rango, dressed as a cowboy, delivering TMS to a seated researcher in a cactus-filled desert scene">
              <img class="tms-scene__art" src="./assets/images/rango-tms-hero.png" alt="Rango holds a figure-eight TMS coil above a seated researcher, surrounded by desert cactuses">
              <span class="coil-pulse" aria-hidden="true"></span>
              <span class="dust" style="--x:23%;--y:13%;--s:5px;--d:4.8s;--delay:.2s" aria-hidden="true"></span>
              <span class="dust" style="--x:31%;--y:10%;--s:8px;--d:5.7s;--delay:1.4s" aria-hidden="true"></span>
              <span class="dust" style="--x:43%;--y:8%;--s:4px;--d:4.2s;--delay:2.1s" aria-hidden="true"></span>
            </figure>
            <div class="footer-meta">
              <strong>${escapeHtml(content.profile.shortName)}</strong>
              <span>${escapeHtml(content.profile.currentRole)}</span>
              <span>${escapeHtml(content.profile.location)}</span>
              <button
                class="button ghost footer-contact"
                type="button"
                data-contact-button
                aria-label="Contact ${escapeHtml(content.profile.shortName)} by email"
              >
                ${ICONS.mail}
                <span>Contact me</span>
              </button>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} ${escapeHtml(content.profile.shortName)}</span>
            <span>Scroll maps to cortical depth · every click evokes a population burst</span>
          </div>
        </div>`;
    }

    document.body.insertAdjacentHTML(
      "afterbegin",
      '<div class="page-progress" aria-hidden="true"></div><div class="cortex-vignette" aria-hidden="true"></div>'
    );

    const layers = [
      ["L1", "Molecular"],
      ["L2", "External granular"],
      ["L3", "External pyramidal"],
      ["L4", "Internal granular"],
      ["L5", "Internal pyramidal"],
      ["L6", "Multiform"]
    ];
    document.body.insertAdjacentHTML(
      "beforeend",
      `<aside class="cortical-rail" aria-label="Cortical depth">
        ${layers.map(([code, name], index) => `<div class="layer-indicator${index === 0 ? " is-active" : ""}" data-layer="${index}"><span>${code} ${name}</span></div>`).join("")}
      </aside>
      <div class="layer-readout" aria-live="polite">Cortical depth<strong id="layer-readout-value">L1 · Molecular</strong></div>`
    );
  }

  function setupHeader() {
    const header = document.querySelector("#site-header");
    const menu = document.querySelector("#menu-toggle");
    const nav = document.querySelector("#primary-navigation");
    const themeButton = document.querySelector("#theme-toggle");
    const motionButton = document.querySelector("#motion-toggle");
    const burstButton = document.querySelector("#burst-trigger");

    const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 16);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    menu?.addEventListener("click", () => {
      const open = nav?.classList.toggle("is-open") || false;
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      menu.innerHTML = open ? ICONS.close : ICONS.menu;
    });

    nav?.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        nav.classList.remove("is-open");
        menu?.setAttribute("aria-expanded", "false");
        if (menu) menu.innerHTML = ICONS.menu;
      }
    });

    const updateThemeButton = () => {
      const light = document.documentElement.dataset.theme === "light";
      if (themeButton) {
        themeButton.innerHTML = light ? ICONS.moon : ICONS.sun;
        themeButton.setAttribute("aria-label", light ? "Use dark theme" : "Use light theme");
      }
    };
    updateThemeButton();

    themeButton?.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      storage.set("neurofolio-theme", next);
      updateThemeButton();
      window.dispatchEvent(new CustomEvent("neurofolio:themechange", { detail: { theme: next } }));
    });

    const updateMotionButton = () => {
      const calm = storage.get("neurofolio-motion") === "calm";
      document.documentElement.dataset.motion = calm ? "calm" : "active";
      if (motionButton) {
        motionButton.innerHTML = calm ? ICONS.play : ICONS.pause;
        motionButton.setAttribute("aria-label", calm ? "Resume background activity" : "Pause background activity");
        motionButton.setAttribute("title", calm ? "Resume background activity" : "Pause background activity");
        motionButton.setAttribute("aria-pressed", String(calm));
      }
    };
    updateMotionButton();

    motionButton?.addEventListener("click", () => {
      const next = storage.get("neurofolio-motion") === "calm" ? "active" : "calm";
      storage.set("neurofolio-motion", next);
      updateMotionButton();
      window.dispatchEvent(new CustomEvent("neurofolio:motionchange", { detail: { mode: next } }));
    });

    burstButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      window.dispatchEvent(new CustomEvent("neurofolio:burst", {
        detail: { x: window.innerWidth * 0.78, y: 90, intensity: 1.3 }
      }));
    });
  }

  function setupScrollProgress() {
    const bar = document.querySelector(".page-progress");
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      if (bar) bar.style.transform = `scaleX(${progress})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("load", update, { once: true });
  }

  function setupReveal() {
    const elements = [...document.querySelectorAll(".reveal:not([data-reveal-ready])")];
    if (!elements.length) return;
    elements.forEach((item) => { item.dataset.revealReady = "true"; });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -6%" }
    );
    elements.forEach((item) => observer.observe(item));
  }

  function profileLink(label, url) {
    const href = safeHref(url);
    if (!href) return "";
    const external = /^https?:/i.test(href);
    return `<a class="profile-link" href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(label)} ${ICONS.arrow}</a>`;
  }

  function publicationMapItem(publication, index, destination = "") {
    const href = destination || `#pub-${encodeURIComponent(publication.slug)}`;
    return `
      <a class="paper-map-item" href="${href}" data-publication-slug="${escapeHtml(publication.slug)}" data-publication-type="${escapeHtml(publication.type)}">
        <span class="paper-map-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="paper-map-copy">
          <strong>${escapeHtml(publication.title)}</strong>
          <small>${escapeHtml(publication.year)} · ${escapeHtml(publication.venue)}</small>
        </span>
        <span class="paper-map-arrow" aria-hidden="true">${ICONS.arrow}</span>
      </a>`;
  }

  function publicationCard(publication) {
    return `
      <a class="publication-card reveal" href="./publications.html#pub-${encodeURIComponent(publication.slug)}">
        <div class="publication-year">${escapeHtml(publication.year)}</div>
        <div>
          <p class="publication-type">${escapeHtml(publication.type)}</p>
          <h2 class="publication-title">${escapeHtml(publication.title)}</h2>
          <p class="publication-venue">${escapeHtml(publication.simpleSummary)}</p>
        </div>
        <span class="card-arrow" aria-hidden="true">${ICONS.arrow}</span>
      </a>`;
  }

  function renderHome() {
    const profile = content.profile;
    const focus = content.currentFocus || {};
    const bindings = {
      "profile-eyebrow": profile.eyebrow,
      "profile-name": profile.name,
      "profile-headline": profile.headline,
      "profile-role": profile.currentRole,
      "profile-introduction": profile.introduction,
      "profile-location": profile.location,
      "current-focus-label": focus.label,
      "current-focus-title": focus.title
    };
    Object.entries(bindings).forEach(([id, value]) => {
      const node = document.getElementById(id);
      if (node && value) node.textContent = value;
    });

    const linkRow = document.getElementById("profile-link-row");
    if (linkRow) {
      linkRow.innerHTML = [
        profileLink("Faculty profile", profile.links.faculty),
        profileLink("Google Scholar", profile.links.scholar),
        profileLink("ORCID", profile.links.orcid),
        profileLink("GitHub", profile.links.github),
        profileLink("Research statement", profile.links.researchStatement)
      ].filter(Boolean).join("");
    }

    const focusTags = document.getElementById("current-focus-tags");
    if (focusTags) {
      focusTags.innerHTML = (focus.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
    }

    const themes = document.getElementById("theme-grid");
    const themeIcons = [ICONS.nodes, ICONS.activity, ICONS.layers, ICONS.model];
    if (themes) {
      themes.innerHTML = content.researchThemes.map((theme, index) => {
        const paperLinks = (theme.papers || [])
          .map((slug) => content.publications.find((publication) => publication.slug === slug))
          .filter(Boolean)
          .map((publication) => `<a href="./publications.html#pub-${encodeURIComponent(publication.slug)}">${escapeHtml(publication.title)} ${ICONS.arrow}</a>`)
          .join("");
        return `
          <article class="theme-card reveal" data-number="${escapeHtml(theme.number)}">
            <div class="theme-card-heading"><div class="card-icon">${themeIcons[index % themeIcons.length]}</div><h3>${escapeHtml(theme.title)}</h3></div>
            <p>${escapeHtml(theme.text)}</p>
            <div class="tag-list">${theme.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
            <div class="theme-paper-links"><span>Related papers</span>${paperLinks}</div>
          </article>`;
      }).join("");
    }

    const program = document.getElementById("research-program");
    if (program) {
      program.innerHTML = content.researchProgram.map((item, index) => `
        <article class="principle reveal">
          <span class="principle-index">${String(index + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
        </article>
      `).join("");
    }

    const protocols = document.getElementById("clinical-protocols");
    if (protocols) {
      protocols.innerHTML = (content.clinicalProtocols || []).map((item) => {
        const url = safeHref(item.url);
        return `<article class="protocol-card reveal">
          <span class="protocol-status">${escapeHtml(item.status)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
          ${url ? `<a class="protocol-link" ${linkAttributes(item.url)}>Open ClinicalTrials.gov record ${ICONS.arrow}</a>` : '<span class="protocol-link muted">Registry link will be added here</span>'}
        </article>`;
      }).join("");
    }

    const timeline = document.getElementById("research-timeline");
    if (timeline) {
      timeline.innerHTML = content.timeline.map((item, index) => `
        <article class="timeline-item reveal">
          <div class="timeline-node" aria-hidden="true"><span>${String(index + 1).padStart(2, "0")}</span></div>
          <div class="timeline-period">${escapeHtml(item.period)}</div>
          <div class="timeline-content">
            <h3>${escapeHtml(item.role)}</h3>
            <p class="timeline-place">${escapeHtml(item.place)}</p>
            <p>${escapeHtml(item.focus)}</p>
          </div>
        </article>
      `).join("");
    }

    const selected = document.getElementById("selected-publications");
    if (selected) {
      const featuredSlugs = [
        "selective-control-synaptic-plasticity-tacs",
        "delays-detuning-information-flow",
        "amplifying-post-stimulation-oscillations"
      ];
      const featured = featuredSlugs
        .map((slug) => content.publications.find((item) => item.slug === slug))
        .filter(Boolean);
      selected.innerHTML = featured.map(publicationCard).join("");
    }
  }

  function renderPublicationFigure(publication, compact = false) {
    if (!publication.figure) return "";
    const source = safeHref(publication.figure.source);
    return `
      <figure class="paper-figure${compact ? " compact-figure" : ""}">
        <a class="paper-figure-link" ${linkAttributes(publication.figure.source)} aria-label="Open source paper for this figure">
          <img src="${escapeHtml(publication.figure.src)}" alt="${escapeHtml(publication.figure.alt)}" loading="lazy" decoding="async">
        </a>
        <figcaption>
          <strong>${escapeHtml(publication.figure.caption)}</strong>
          <span>${escapeHtml(publication.figure.credit)}</span>
          ${source ? `<a ${linkAttributes(publication.figure.source)}>Open source paper</a>` : ""}
        </figcaption>
      </figure>`;
  }

  function publicationLinks(publication) {
    const labels = {
      doi: "Open paper",
      code: "View code",
      data: "View data",
      pdf: "Open PDF",
      manuscript: "Open manuscript",
      record: "Open record"
    };
    const entries = Object.entries(publication.links || {}).filter(([, value]) => safeHref(value));
    if (!entries.length) return "";
    return `<div class="article-links">${entries.map(([key, value]) => `<a class="button${key === "doi" ? " primary" : ""}" ${linkAttributes(value)}>${escapeHtml(labels[key] || key)} ${ICONS.arrow}</a>`).join("")}</div>`;
  }

  function publicationStory(publication, index) {
    const searchText = [
      publication.title,
      publication.venue,
      publication.year,
      publication.type,
      publication.authors,
      publication.simpleSummary,
      publication.question,
      publication.approach,
      publication.result,
      ...(publication.methods || [])
    ].join(" ").toLowerCase();

    return `
      <article class="publication-story reveal" id="pub-${escapeHtml(publication.slug)}" data-publication-slug="${escapeHtml(publication.slug)}" data-publication-type="${escapeHtml(publication.type)}" data-search="${escapeHtml(searchText)}" aria-labelledby="pub-title-${escapeHtml(publication.slug)}">
        <header class="publication-story-header">
          <div class="story-number"><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(publication.year)}</strong></div>
          <div class="story-heading">
            <p class="publication-type">${escapeHtml(publication.type)} · ${escapeHtml(publication.venue)}</p>
            <h2 id="pub-title-${escapeHtml(publication.slug)}">${escapeHtml(publication.title)}</h2>
            <p class="story-authors">${escapeHtml(publication.authors)}</p>
          </div>
        </header>

        <div class="plain-summary">
          <span>In one sentence</span>
          <p>${escapeHtml(publication.simpleSummary)}</p>
        </div>

        ${renderPublicationFigure(publication)}

        <div class="story-explainer-grid">
          <section class="explainer-card">
            <span class="explainer-label">Question</span>
            <p>${escapeHtml(publication.question)}</p>
          </section>
          <section class="explainer-card">
            <span class="explainer-label">What we did</span>
            <p>${escapeHtml(publication.approach)}</p>
          </section>
          <section class="explainer-card result-card">
            <span class="explainer-label">What we found</span>
            <p>${escapeHtml(publication.result)}</p>
          </section>
        </div>

        <div class="story-lower-grid">
          <section>
            <p class="story-subheading">Why this paper matters</p>
            <ul class="contribution-list">${publication.contributions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </section>
          <aside class="story-methods">
            <p class="story-subheading">Methods & concepts</p>
            <div class="tag-list">${publication.methods.map((method) => `<span class="tag">${escapeHtml(method)}</span>`).join("")}</div>
            ${publicationLinks(publication)}
          </aside>
        </div>

        <footer class="story-footer">
          <a href="#publication-map-title">Back to paper list</a>
          <a href="./publication.html?slug=${encodeURIComponent(publication.slug)}">Open focused view ${ICONS.arrow}</a>
        </footer>
      </article>`;
  }

  function renderPublications() {
    const list = document.getElementById("publication-list");
    const map = document.getElementById("publication-map");
    const search = document.getElementById("publication-search");
    const filters = document.getElementById("publication-filters");
    const count = document.getElementById("publication-count");
    const works = document.getElementById("works-in-progress");
    if (!list || !map || !filters) return;

    map.innerHTML = content.publications.map((publication, index) => publicationMapItem(publication, index)).join("");
    list.innerHTML = content.publications.map(publicationStory).join("") + '<div class="empty-state publication-empty" hidden>No publications match this filter.</div>';

    const types = ["All", ...new Set(content.publications.map((item) => item.type))];
    let activeType = "All";
    let query = "";
    filters.innerHTML = types.map((type) => `<button class="filter-pill" type="button" data-type="${escapeHtml(type)}" aria-pressed="${type === "All"}">${escapeHtml(type)}</button>`).join("");

    const update = () => {
      const normalized = query.trim().toLowerCase();
      let visibleCount = 0;
      content.publications.forEach((publication) => {
        const story = list.querySelector(`[data-publication-slug="${CSS.escape(publication.slug)}"]`);
        const mapItem = map.querySelector(`[data-publication-slug="${CSS.escape(publication.slug)}"]`);
        const matchesType = activeType === "All" || publication.type === activeType;
        const haystack = story?.dataset.search || "";
        const visible = matchesType && (!normalized || haystack.includes(normalized));
        if (story) story.hidden = !visible;
        if (mapItem) mapItem.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      const empty = list.querySelector(".publication-empty");
      if (empty) empty.hidden = visibleCount !== 0;
      if (count) count.textContent = `${visibleCount} record${visibleCount === 1 ? "" : "s"}`;
    };

    filters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-type]");
      if (!button) return;
      activeType = button.dataset.type;
      filters.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      update();
    });

    search?.addEventListener("input", () => {
      query = search.value;
      update();
    });

    if (works) {
      works.innerHTML = content.worksInProgress.map((item) => {
        const url = safeHref(item.url);
        const tag = url ? "a" : "article";
        const attributes = url ? `${linkAttributes(item.url)}` : "";
        return `
          <${tag} class="work-card reveal" ${attributes}>
            <span class="work-status">${escapeHtml(item.status)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.note)}</p>
            ${url ? `<span class="work-link">Open record ${ICONS.arrow}</span>` : '<span class="work-link muted">Public abstract not yet available</span>'}
          </${tag}>`;
      }).join("");
    }

    const highlightHash = () => {
      list.querySelectorAll(".publication-story.is-targeted").forEach((item) => item.classList.remove("is-targeted"));
      const hash = decodeURIComponent(window.location.hash || "");
      if (!hash.startsWith("#pub-")) return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      target.classList.add("is-targeted");
      window.setTimeout(() => target.classList.remove("is-targeted"), 2200);
    };

    window.addEventListener("hashchange", highlightHash);
    update();
    setupReveal();

    if (window.location.hash.startsWith("#pub-")) {
      window.setTimeout(() => {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        highlightHash();
      }, 180);
    }
  }

  async function getSyncedPosts() {
    try {
      const response = await fetch("./assets/data/posts-feed.json", { cache: "no-store" });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data.posts) ? data.posts : [];
    } catch (_) {
      return [];
    }
  }

  function postCard(post) {
    const url = safeHref(post.url);
    const cardTag = url ? "a" : "article";
    const attributes = url ? linkAttributes(post.url) : "";
    return `
      <${cardTag} class="post-card reveal" ${attributes}>
        <div class="post-meta">
          <span>${escapeHtml(formatDate(post.date))}</span>
          <span>${escapeHtml(post.kind || (post.sample ? "Sample idea" : "Public post"))}</span>
        </div>
        ${post.sample ? '<span class="sample-ribbon">Draft note</span>' : ""}
        <h2>${escapeHtml(post.title)}</h2>
        <p>${escapeHtml(post.excerpt)}</p>
        ${post.prompt ? `<div class="idea-prompt"><strong>How this could grow</strong><span>${escapeHtml(post.prompt)}</span></div>` : ""}
        <div class="post-footer">
          <div class="tag-list">${(post.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
          ${url ? `<span class="card-arrow" aria-hidden="true">${ICONS.arrow}</span>` : ""}
        </div>
      </${cardTag}>`;
  }

  async function renderIdeas() {
    const grid = document.getElementById("post-grid");
    const search = document.getElementById("post-search");
    if (!grid) return;

    const synced = await getSyncedPosts();
    const posts = [...synced, ...content.posts]
      .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const update = () => {
      const query = (search?.value || "").trim().toLowerCase();
      const visible = posts.filter((post) => `${post.title} ${post.excerpt} ${post.prompt || ""} ${post.kind || ""} ${(post.tags || []).join(" ")}`.toLowerCase().includes(query));
      grid.innerHTML = visible.length ? visible.map(postCard).join("") : '<div class="empty-state">No ideas match this search.</div>';
      setupReveal();
    };

    search?.addEventListener("input", update);
    update();
  }

  function renderConcepts() {
    const grid = document.getElementById("concept-grid");
    const filters = document.getElementById("concept-filters");
    const search = document.getElementById("concept-search");
    const detail = document.getElementById("concept-detail");
    if (!grid || !filters || !detail) return;

    const categories = ["All", ...new Set(content.concepts.map((item) => item.category))];
    let active = "All";
    let query = "";

    filters.innerHTML = categories.map((category) => `<button class="filter-pill" type="button" data-category="${escapeHtml(category)}" aria-pressed="${category === "All"}">${escapeHtml(category)}</button>`).join("");

    const card = (concept, index) => `
      <button class="concept-card reveal" type="button" data-concept-index="${index}">
        <span class="concept-category">${escapeHtml(concept.category)}</span>
        <h2>${escapeHtml(concept.term)}</h2>
        <p>${escapeHtml(concept.short)}</p>
        <div class="tag-list">${concept.connections.slice(0, 2).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div>
        <span class="concept-open">Open note ${ICONS.arrow}</span>
      </button>`;

    const update = () => {
      const normalized = query.trim().toLowerCase();
      const visible = content.concepts
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => {
          const inCategory = active === "All" || item.category === active;
          const haystack = `${item.term} ${item.short} ${item.why} ${item.example || ""} ${item.connections.join(" ")}`.toLowerCase();
          return inCategory && (!normalized || haystack.includes(normalized));
        });
      grid.innerHTML = visible.length ? visible.map(({ item, index }) => card(item, index)).join("") : '<div class="empty-state">No concepts match this filter.</div>';
      setupReveal();
    };

    let previousFocus = null;
    const closeDetail = () => {
      detail.classList.remove("is-open");
      detail.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      previousFocus?.focus();
    };

    const openDetail = (index, trigger) => {
      const concept = content.concepts[index];
      if (!concept) return;
      previousFocus = trigger || null;
      detail.innerHTML = `
        <div class="concept-dialog" role="dialog" aria-modal="true" aria-labelledby="concept-dialog-title">
          <button class="icon-button dialog-close" type="button" aria-label="Close concept">${ICONS.close}</button>
          <span class="concept-category">${escapeHtml(concept.category)}</span>
          <h2 id="concept-dialog-title">${escapeHtml(concept.term)}</h2>
          <p class="concept-definition"><strong>${escapeHtml(concept.short)}</strong></p>
          <h3>Why it matters</h3>
          <p>${escapeHtml(concept.why)}</p>
          ${concept.example ? `<div class="concept-example"><span>Concrete example</span><p>${escapeHtml(concept.example)}</p></div>` : ""}
          <h3>Connected ideas</h3>
          <div class="tag-list">${concept.connections.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div>
        </div>`;
      detail.classList.add("is-open");
      detail.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      detail.querySelector(".dialog-close")?.focus();
    };

    filters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-category]");
      if (!button) return;
      active = button.dataset.category;
      filters.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      update();
    });

    search?.addEventListener("input", () => {
      query = search.value;
      update();
    });

    grid.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-concept-index]");
      if (button) openDetail(Number(button.dataset.conceptIndex), button);
    });

    detail.addEventListener("click", (event) => {
      if (event.target === detail || event.target.closest(".dialog-close")) closeDetail();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && detail.classList.contains("is-open")) closeDetail();
    });

    update();
  }

  function renderPublication() {
    const root = document.getElementById("publication-root");
    if (!root) return;
    const slug = new URLSearchParams(window.location.search).get("slug");
    const publication = content.publications.find((item) => item.slug === slug);

    if (!publication) {
      root.innerHTML = `
        <div class="not-found">
          <div>
            <div class="code">?</div>
            <h1>Publication not found.</h1>
            <p class="page-intro">The requested record is not in <code>assets/js/content.js</code>.</p>
            <div class="hero-actions" style="justify-content:center"><a class="button primary" href="./publications.html">Return to publications</a></div>
          </div>
        </div>`;
      return;
    }

    document.title = `${publication.title} — Aref Pariz`;
    const visual = `
      <div class="article-visual">
        <span class="visual-label">${escapeHtml(publication.visual?.label || "Research model")}</span>
        <canvas id="publication-visual" data-kind="${escapeHtml(publication.visual?.kind || "network")}" aria-label="Animated schematic inspired by ${escapeHtml(publication.title)}"></canvas>
      </div>
      ${publication.figure ? renderPublicationFigure(publication, true) : ""}`;

    root.innerHTML = `
      <div class="article-shell">
        <header class="article-header">
          <div>
            <div class="breadcrumbs"><span><a href="./publications.html">Publications</a></span><span>${escapeHtml(publication.year)}</span></div>
            <p class="eyebrow">${escapeHtml(publication.type)}</p>
            <h1 class="article-title">${escapeHtml(publication.title)}</h1>
            <p class="article-citation">${escapeHtml(publication.authors)} · ${escapeHtml(publication.citation)}</p>
          </div>
          <div class="article-meta">
            <div class="article-meta-item"><span>Year</span><strong>${escapeHtml(publication.year)}</strong></div>
            <div class="article-meta-item"><span>Venue</span><strong>${escapeHtml(publication.venue)}</strong></div>
            <div class="article-meta-item"><span>Format</span><strong>Plain-language research story</strong></div>
          </div>
        </header>

        <div class="article-layout">
          <div class="article-main">
            ${visual}
            <section class="content-panel" id="overview"><p class="section-kicker">In one sentence</p><p class="article-summary">${escapeHtml(publication.simpleSummary)}</p>${publicationLinks(publication)}</section>
            <section class="content-panel" id="question"><p class="section-kicker">Research question</p><h2>${escapeHtml(publication.question)}</h2></section>
            <section class="content-panel" id="approach"><p class="section-kicker">Approach</p><h2>How the question was tested</h2><p>${escapeHtml(publication.approach)}</p><div class="tag-list">${publication.methods.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div></section>
            <section class="content-panel" id="result"><p class="section-kicker">Main result</p><h2>${escapeHtml(publication.result)}</h2></section>
            <section class="content-panel" id="contributions"><p class="section-kicker">Contribution</p><h2>What becomes possible because of this work</h2><ul>${publication.contributions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
          </div>
          <aside class="article-sidebar">
            <div class="glass-card">
              <h3>On this page</h3>
              <a href="#overview">Overview</a>
              <a href="#question">Research question</a>
              <a href="#approach">Approach</a>
              <a href="#result">Result</a>
              <a href="#contributions">Contributions</a>
              <a href="./publications.html#pub-${encodeURIComponent(publication.slug)}">Return to full paper map</a>
            </div>
          </aside>
        </div>
      </div>`;

    setupPublicationVisual(document.getElementById("publication-visual"));
  }

  function setupPublicationVisual(canvas) {
    if (!canvas) return;
    const parent = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    const kind = canvas.dataset.kind || "network";
    let animationId = 0;
    let visible = true;

    const seedRandom = (seed) => {
      let value = seed % 2147483647;
      if (value <= 0) value += 2147483646;
      return () => (value = (value * 16807) % 2147483647) / 2147483647;
    };
    const random = seedRandom([...kind].reduce((sum, char) => sum + char.charCodeAt(0), 1));
    const points = Array.from({ length: 62 }, () => ({ x: random(), y: random(), c: random() > 0.52 ? 1 : 0, p: random() * Math.PI * 2 }));
    const nodes = Array.from({ length: 22 }, () => ({ x: random(), y: random(), r: 2 + random() * 4, p: random() * Math.PI * 2 }));

    const palette = () => {
      const style = getComputedStyle(document.documentElement);
      return {
        accent: style.getPropertyValue("--accent").trim(),
        accent2: style.getPropertyValue("--accent-2").trim(),
        accent3: style.getPropertyValue("--accent-3").trim(),
        line: style.getPropertyValue("--line-strong").trim()
      };
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const grid = (width, height, colors) => {
      ctx.save();
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = 0.26;
      for (let x = 0; x <= width; x += Math.max(44, width / 12)) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y <= height; y += Math.max(44, height / 8)) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      ctx.restore();
    };

    const drawNetwork = (width, height, colors, time) => {
      grid(width, height, colors);
      const positions = nodes.map((node) => ({
        x: width * (0.1 + node.x * 0.8) + Math.sin(time * 0.00025 + node.p) * 8,
        y: height * (0.12 + node.y * 0.76) + Math.cos(time * 0.0003 + node.p) * 7,
        ...node
      }));
      positions.forEach((a, index) => {
        positions.slice(index + 1).forEach((b) => {
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < Math.min(width, height) * 0.3) {
            ctx.globalAlpha = Math.max(0, 0.26 - distance / Math.min(width, height));
            ctx.strokeStyle = colors.accent2;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        });
      });
      positions.forEach((node, index) => {
        ctx.globalAlpha = 0.76;
        ctx.fillStyle = index % 4 === 0 ? colors.accent3 : colors.accent;
        ctx.beginPath(); ctx.arc(node.x, node.y, node.r + Math.sin(time * 0.001 + node.p), 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const drawScores = (width, height, colors, time) => {
      grid(width, height, colors);
      points.forEach((point) => {
        const clusterX = point.c ? width * 0.66 : width * 0.34;
        const clusterY = point.c ? height * 0.4 : height * 0.61;
        const x = clusterX + (point.x - 0.5) * width * 0.35 + Math.sin(time * 0.0006 + point.p) * 5;
        const y = clusterY + (point.y - 0.5) * height * 0.44 + Math.cos(time * 0.0007 + point.p) * 4;
        ctx.beginPath();
        ctx.arc(x, y, 2.1 + point.y * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = point.c ? colors.accent2 : colors.accent;
        ctx.globalAlpha = 0.52 + Math.sin(time * 0.001 + point.p) * 0.18;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const drawClassification = (width, height, colors, time) => {
      grid(width, height, colors);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-0.28);
      ctx.strokeStyle = colors.accent3;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 7]);
      ctx.beginPath(); ctx.moveTo(0, -height); ctx.lineTo(0, height); ctx.stroke();
      ctx.restore();
      points.forEach((point) => {
        const side = point.c ? 1 : -1;
        const x = width / 2 + side * (30 + point.x * width * 0.33) + Math.sin(point.p + time * 0.0005) * 7;
        const y = height * (0.18 + point.y * 0.64);
        ctx.fillStyle = point.c ? colors.accent2 : colors.accent;
        ctx.globalAlpha = 0.65;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const drawSpectra = (width, height, colors, time) => {
      grid(width, height, colors);
      [colors.accent, colors.accent2, colors.accent3].forEach((color, lineIndex) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = 0.66;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 3) {
          const nx = x / width;
          const peak = (center, spread, value) => value * Math.exp(-Math.pow((nx - center) / spread, 2));
          const signal = peak(0.18 + lineIndex * 0.018, 0.045, 0.45)
            + peak(0.45 - lineIndex * 0.025, 0.07, 0.72)
            + peak(0.72 + lineIndex * 0.012, 0.035, 0.56)
            + Math.sin(nx * 38 + lineIndex * 1.5 + time * 0.00035) * 0.018;
          const y = height * (0.82 - signal * (0.78 - lineIndex * 0.09)) + lineIndex * 8;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    };

    const drawField = (width, height, colors, time) => {
      grid(width, height, colors);
      ctx.save();
      ctx.translate(width * 0.52, height * 0.54);
      [0.18, 0.3, 0.42].forEach((scale, index) => {
        ctx.strokeStyle = index === 1 ? colors.accent2 : colors.line;
        ctx.globalAlpha = 0.34 + index * 0.14;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, width * scale, height * scale * 0.78, -0.08, Math.PI * 0.14, Math.PI * 1.86);
        ctx.stroke();
      });
      ctx.restore();
      for (let index = 0; index < 9; index += 1) {
        const x = width * (0.16 + index * 0.085);
        const base = height * 0.78;
        const heightFactor = 0.24 + (index % 3) * 0.05;
        ctx.strokeStyle = index % 2 ? colors.accent : colors.accent3;
        ctx.globalAlpha = 0.54;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.quadraticCurveTo(x + Math.sin(time * 0.0007 + index) * 10, height * 0.52, x + (index % 2 ? 10 : -10), height * heightFactor);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, base, 3 + (index % 3), 0, Math.PI * 2);
        ctx.fillStyle = colors.accent2;
        ctx.fill();
      }
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = colors.accent2;
      ctx.lineWidth = 1.4;
      for (let y = height * 0.2; y < height * 0.78; y += height * 0.13) {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 5) {
          const wave = Math.sin(x * 0.025 + time * 0.0012 + y) * 5;
          if (x === 0) ctx.moveTo(x, y + wave); else ctx.lineTo(x, y + wave);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const drawPlasticity = (width, height, colors, time) => {
      grid(width, height, colors);
      const leftX = width * 0.28;
      const rightX = width * 0.72;
      const pulse = (Math.sin(time * 0.002) + 1) / 2;
      [[leftX, colors.accent], [rightX, colors.accent2]].forEach(([x, color], groupIndex) => {
        for (let index = 0; index < 7; index += 1) {
          const y = height * (0.18 + index * 0.105);
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.55 + 0.35 * Math.sin(time * 0.0015 + index + groupIndex);
          ctx.beginPath(); ctx.arc(x + Math.sin(index) * 24, y, 3.4, 0, Math.PI * 2); ctx.fill();
        }
      });
      ctx.strokeStyle = colors.accent3;
      ctx.lineWidth = 1 + pulse * 4;
      ctx.globalAlpha = 0.35 + pulse * 0.55;
      ctx.beginPath(); ctx.moveTo(leftX + 28, height * 0.48); ctx.lineTo(rightX - 28, height * 0.48); ctx.stroke();
      ctx.fillStyle = colors.accent3;
      ctx.beginPath(); ctx.arc(leftX + 28 + (rightX - leftX - 56) * pulse, height * 0.48, 5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawRelay = (width, height, colors, time) => {
      grid(width, height, colors);
      const relay = { x: width * 0.5, y: height * 0.72 };
      const nodesView = [{ x: width * 0.2, y: height * 0.28 }, { x: width * 0.8, y: height * 0.28 }, relay];
      const edges = [[nodesView[0], relay], [relay, nodesView[1]], [nodesView[0], nodesView[1]]];
      edges.forEach(([a, b], index) => {
        ctx.strokeStyle = index === 2 ? colors.line : colors.accent2;
        ctx.globalAlpha = index === 2 ? 0.25 : 0.58;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        const progress = (time * 0.00025 + index * 0.31) % 1;
        ctx.fillStyle = index === 2 ? colors.accent3 : colors.accent;
        ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * progress, a.y + (b.y - a.y) * progress, 4, 0, Math.PI * 2); ctx.fill();
      });
      nodesView.forEach((node, index) => {
        ctx.fillStyle = index === 2 ? colors.accent3 : colors.accent2;
        ctx.globalAlpha = 0.78;
        ctx.beginPath(); ctx.arc(node.x, node.y, Math.min(width, height) * 0.075, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const drawDelay = (width, height, colors, time) => {
      grid(width, height, colors);
      [
        { color: colors.accent, phase: time * 0.0012, base: height * 0.38 },
        { color: colors.accent2, phase: time * 0.0012 - 1.4, base: height * 0.64 }
      ].forEach((wave) => {
        ctx.strokeStyle = wave.color;
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 4) {
          const y = wave.base + Math.sin(x * 0.035 + wave.phase) * height * 0.12;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      const progress = (time * 0.00022) % 1;
      ctx.strokeStyle = colors.accent3;
      ctx.globalAlpha = 0.7;
      ctx.setLineDash([8, 7]);
      ctx.beginPath(); ctx.moveTo(width * 0.18, height * 0.5); ctx.lineTo(width * 0.82, height * 0.5); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.accent3;
      ctx.beginPath(); ctx.arc(width * (0.18 + 0.64 * progress), height * 0.5, 5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawRouting = (width, height, colors, time) => {
      grid(width, height, colors);
      const hub = { x: width * 0.38, y: height * 0.48 };
      nodes.slice(0, 10).forEach((node, index) => {
        const angle = (index / 10) * Math.PI * 2;
        const target = { x: width * 0.5 + Math.cos(angle) * width * 0.32, y: height * 0.5 + Math.sin(angle) * height * 0.31 };
        ctx.strokeStyle = colors.accent2;
        ctx.globalAlpha = 0.2 + 0.35 * ((Math.sin(time * 0.0014 + index) + 1) / 2);
        ctx.beginPath(); ctx.moveTo(hub.x, hub.y); ctx.lineTo(target.x, target.y); ctx.stroke();
        ctx.fillStyle = colors.accent;
        ctx.beginPath(); ctx.arc(target.x, target.y, 3.4, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = colors.accent3;
      ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(hub.x, hub.y, 9 + Math.sin(time * 0.003) * 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawLattice = (width, height, colors, time) => {
      grid(width, height, colors);
      for (let row = 0; row < 5; row += 1) {
        for (let column = 0; column < 8; column += 1) {
          const x = width * (0.12 + column * 0.11);
          const y = height * (0.2 + row * 0.15);
          const pulse = (Math.sin(time * 0.0017 + row + column) + 1) / 2;
          ctx.strokeStyle = colors.accent2;
          ctx.globalAlpha = 0.25 + pulse * 0.45;
          ctx.beginPath(); ctx.arc(x, y, 5 + pulse * 6, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = colors.accent3;
          ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const drawAi = (width, height, colors, time) => {
      grid(width, height, colors);
      const columns = [0.16, 0.38, 0.62, 0.84];
      columns.forEach((column, columnIndex) => {
        const count = columnIndex === 0 || columnIndex === 3 ? 4 : 6;
        for (let index = 0; index < count; index += 1) {
          const x = width * column;
          const y = height * ((index + 1) / (count + 1));
          if (columnIndex < columns.length - 1) {
            const nextCount = columnIndex === 2 ? 4 : 6;
            for (let next = 0; next < nextCount; next += 1) {
              ctx.strokeStyle = colors.line;
              ctx.globalAlpha = 0.12;
              ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(width * columns[columnIndex + 1], height * ((next + 1) / (nextCount + 1))); ctx.stroke();
            }
          }
          ctx.fillStyle = columnIndex === 3 ? colors.accent3 : columnIndex % 2 ? colors.accent2 : colors.accent;
          ctx.globalAlpha = 0.72;
          ctx.beginPath(); ctx.arc(x, y, 3.5 + Math.sin(time * 0.001 + index + columnIndex) * 1.2, 0, Math.PI * 2); ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    };

    const drawPipeline = (width, height, colors, time) => {
      grid(width, height, colors);
      const steps = 5;
      for (let index = 0; index < steps; index += 1) {
        const x = width * (0.09 + index * 0.19);
        const y = height * (0.42 + (index % 2) * 0.16);
        const boxWidth = width * 0.14;
        const boxHeight = height * 0.2;
        ctx.strokeStyle = index % 2 ? colors.accent2 : colors.accent;
        ctx.globalAlpha = 0.7;
        ctx.strokeRect(x, y, boxWidth, boxHeight);
        if (index < steps - 1) {
          ctx.strokeStyle = colors.line;
          ctx.beginPath(); ctx.moveTo(x + boxWidth, y + boxHeight / 2); ctx.lineTo(width * (0.09 + (index + 1) * 0.19), height * (0.42 + ((index + 1) % 2) * 0.16) + boxHeight / 2); ctx.stroke();
        }
      }
      const progress = (time * 0.00018) % 1;
      ctx.fillStyle = colors.accent3;
      ctx.globalAlpha = 0.95;
      ctx.beginPath(); ctx.arc(width * (0.1 + progress * 0.79), height * (0.52 + Math.sin(progress * Math.PI * 4) * 0.08), 5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    };

    const draw = (time = 0) => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / ratio;
      const height = canvas.height / ratio;
      ctx.clearRect(0, 0, width, height);
      const colors = palette();
      if (kind === "field") drawField(width, height, colors, time);
      else if (kind === "plasticity") drawPlasticity(width, height, colors, time);
      else if (kind === "relay") drawRelay(width, height, colors, time);
      else if (kind === "delay") drawDelay(width, height, colors, time);
      else if (kind === "routing") drawRouting(width, height, colors, time);
      else if (kind === "lattice") drawLattice(width, height, colors, time);
      else if (kind === "ai") drawAi(width, height, colors, time);
      else if (kind === "pipeline") drawPipeline(width, height, colors, time);
      else if (kind === "classification") drawClassification(width, height, colors, time);
      else if (kind === "spectra") drawSpectra(width, height, colors, time);
      else if (kind === "scores") drawScores(width, height, colors, time);
      else drawNetwork(width, height, colors, time);
      if (visible && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) animationId = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible && !animationId) animationId = requestAnimationFrame(draw);
      if (!visible && animationId) {
        cancelAnimationFrame(animationId);
        animationId = 0;
      }
    });
    observer.observe(parent);

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("neurofolio:themechange", () => draw(performance.now()));
  }

  function setupLayerReadout() {
    const layerNames = ["L1 · Molecular", "L2 · External granular", "L3 · External pyramidal", "L4 · Internal granular", "L5 · Internal pyramidal", "L6 · Multiform"];
    const indicators = [...document.querySelectorAll(".layer-indicator")];
    const output = document.getElementById("layer-readout-value");
    let previous = -1;

    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const depth = Math.min(5, Math.max(0, (window.scrollY / max) * 5));
      const active = Math.min(5, Math.max(0, Math.round(depth)));
      document.documentElement.style.setProperty("--cortical-depth", depth.toFixed(3));
      if (active !== previous) {
        indicators.forEach((item, index) => item.classList.toggle("is-active", index === active));
        if (output) output.textContent = layerNames[active];
        previous = active;
      }
      window.dispatchEvent(new CustomEvent("neurofolio:depth", { detail: { depth, active } }));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("load", update, { once: true });
  }

  function initializePage() {
    injectShell();
    setupHeader();
    setupScrollProgress();
    setupLayerReadout();

    switch (document.body.dataset.page) {
      case "home": renderHome(); break;
      case "publications": renderPublications(); break;
      case "ideas": renderIdeas(); break;
      case "concepts": renderConcepts(); break;
      case "publication": renderPublication(); break;
      default: break;
    }

    setupContactButtons();
    setupReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage, { once: true });
  } else {
    initializePage();
  }
})();
