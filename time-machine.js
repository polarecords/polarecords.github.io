(function () {
  'use strict';

  /* ─── ERA METADATA ─────────────────────────────────────────── */
  const ERAS = [
    {
      id: 'v1',
      label: 'v1',
      title: 'The Beginning',
      date: 'Nov 30, 2025',
      color: '#4a9eff',
      root: '/_archive/v1/',
      pages: ['index.html'],
      changes: [
        'First version of the site ever deployed',
        'Homepage with placeholder cards: Midnight Blue, Neon City, Acoustic Sessions',
        'Early John Polar page (basic layout)',
        'Simple dark minimal theme, no persona branding',
      ],
      highlights: ['.card', '.hero', '.newsletter'],
      screenshot: '/_archive/screenshots/v1.png',
    },
    {
      id: 'v2-xp',
      label: 'v2 XP',
      title: 'Windows XP Era',
      date: 'Dec 2025',
      color: '#1d7a1d',
      root: '/_archive/v2-xp/',
      pages: ['johnpolar/index.html'],
      changes: [
        'John Polar page transformed into a Windows XP interface',
        'XP title bar, beveled window chrome, taskbar footer',
        'Green Start button in the bottom-left footer',
        'PølarAF page created for the first time',
      ],
      highlights: ['header', 'footer', 'main'],
      screenshot: '/_archive/screenshots/v2-xp.png',
    },
    {
      id: 'v3',
      label: 'v3',
      title: 'Modern Launch',
      date: 'Dec 2025',
      color: '#9b59b6',
      root: '/_archive/v3/',
      pages: [
        'index.html',
        'johnpolar/index.html',
        'polaraf/index.html',
        'polarx/index.html',
      ],
      changes: [
        'Complete dark modern redesign — XP era dropped',
        'All 3 personas launched: John Polar, PølarAF, PolarX',
        'Persona-specific CSS theme files introduced',
        'Mobile responsive layout, Instagram links on all personas',
      ],
      highlights: ['#music', '.hero', 'nav', '.grid'],
      screenshot: '/_archive/screenshots/v3.png',
    },
    {
      id: 'v4',
      label: 'v4',
      title: 'Content & Themes',
      date: 'Dec 2025',
      color: '#e67e22',
      root: '/_archive/v4/',
      pages: [
        'index.html',
        'johnpolar/index.html',
        'polaraf/index.html',
        'polarx/index.html',
      ],
      changes: [
        'Enhanced persona themes with glow animations',
        'Coming-soon sections styled with rotating backgrounds',
        'Placeholder content cleaned up across all pages',
        'John Polar bio updated based on live performance analysis',
        'Live performance video placeholder added',
      ],
      highlights: ['.coming-soon', '#bio', '#live', '#discography'],
      screenshot: '/_archive/screenshots/v4.png',
    },
    {
      id: 'v4-5',
      label: 'v4.5',
      title: 'PølarAF Goes Red',
      date: 'Dec 2025',
      color: '#e74c3c',
      root: '/_archive/v4-5/',
      pages: [
        'index.html',
        'johnpolar/index.html',
        'polaraf/index.html',
        'polarx/index.html',
      ],
      changes: [
        'PølarAF theme overhauled to aggressive red palette',
        'New sections added: Collaboration Spotlight, Social Media Hub, Latest',
        'Stream Now section with single / EP / mixtape links',
        'Red glow effects, updated borders and backgrounds',
      ],
      highlights: ['#collab', '#social', '#latest', '#tracks', '.hero'],
      screenshot: '/_archive/screenshots/v4-5.png',
    },
    {
      id: 'v5',
      label: 'v5',
      title: 'Collab Video Drop',
      date: 'Dec 2025',
      color: '#1abc9c',
      root: '/_archive/v5/',
      pages: [
        'index.html',
        'johnpolar/index.html',
        'polaraf/index.html',
        'polarx/index.html',
      ],
      changes: [
        'Polar Grey x Millennium Grey collab video embedded on PølarAF',
        'YouTube channel link added to John Polar',
        'Mobile layout optimized for dynamic viewport height',
        'All animations re-enabled on mobile devices',
      ],
      highlights: ['#collab', '#live'],
      screenshot: '/_archive/screenshots/v5.png',
    },
    {
      id: 'current',
      label: 'Now',
      title: 'Current',
      date: 'Mar 2026',
      color: '#00d9ff',
      root: '/',
      pages: [
        'index.html',
        'johnpolar/index.html',
        'polaraf/index.html',
        'polarx/index.html',
      ],
      changes: [
        'Favicon updated (favicon.ico + 32×32 PNG)',
        'Time Machine versioning system added',
        'Active development',
      ],
      highlights: [],
      screenshot: '/_archive/screenshots/current.png',
    },
  ];

  /* ─── DETECT CURRENT ERA + PAGE ────────────────────────────── */
  const path = window.location.pathname;
  let currentEra = ERAS.find(e => e.id === 'current');
  let currentPage = 'index.html';

  for (const era of ERAS) {
    if (era.id === 'current') continue;
    if (path.startsWith(era.root)) {
      currentEra = era;
      const rel = path.slice(era.root.length).replace(/^\//, '');
      currentPage = rel || 'index.html';
      break;
    }
  }
  if (currentEra.id === 'current') {
    const m = path.match(/\/(johnpolar|polaraf|polarx)\//);
    currentPage = m ? m[1] + '/index.html' : 'index.html';
  }

  /* ─── DIFF HIGHLIGHT ────────────────────────────────────────── */
  const prevEraId = sessionStorage.getItem('tm-prev-era');
  if (prevEraId && prevEraId !== currentEra.id) {
    sessionStorage.removeItem('tm-prev-era');
    window.addEventListener('DOMContentLoaded', () => {
      currentEra.highlights.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.classList.add('tm-highlight-pulse');
          setTimeout(() => el.classList.remove('tm-highlight-pulse'), 2200);
        });
      });
    });
  }

  /* ─── STYLES ────────────────────────────────────────────────── */
  const css = `
    /* --- Bar --- */
    #tm-bar {
      position: fixed;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(6,6,6,0.92);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 999px;
      padding: 5px 10px;
      display: flex;
      align-items: center;
      gap: 1px;
      z-index: 99998;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 11px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 4px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset;
      user-select: none;
      transition: opacity 0.2s;
    }
    #tm-bar:hover { opacity: 1 !important; }
    .tm-bar-icon {
      color: rgba(255,255,255,0.3);
      font-size: 13px;
      padding: 2px 6px 2px 4px;
      cursor: pointer;
      transition: color 0.15s;
      line-height: 1;
    }
    .tm-bar-icon:hover { color: rgba(255,255,255,0.8); }
    .tm-sep {
      color: rgba(255,255,255,0.1);
      font-size: 9px;
      padding: 0 1px;
      pointer-events: none;
    }
    .tm-era-btn {
      color: rgba(255,255,255,0.38);
      text-decoration: none;
      padding: 3px 8px;
      border-radius: 999px;
      transition: all 0.15s ease;
      cursor: pointer;
      position: relative;
      white-space: nowrap;
    }
    .tm-era-btn:hover {
      color: rgba(255,255,255,0.9);
      background: rgba(255,255,255,0.08);
    }
    .tm-era-btn.tm-active {
      color: #fff;
      font-weight: 600;
      background: rgba(255,255,255,0.12);
    }
    .tm-era-btn.tm-approx { font-style: italic; }

    /* --- Preview card --- */
    #tm-preview {
      position: fixed;
      bottom: 52px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(10,10,10,0.97);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 14px;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 11px;
      width: 280px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.7);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    #tm-preview.visible { opacity: 1; }
    .tm-preview-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 10px;
    }
    .tm-preview-title {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
    }
    .tm-preview-date {
      font-size: 10px;
      color: rgba(255,255,255,0.35);
    }
    .tm-preview-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-right: 2px;
    }
    .tm-preview-screenshot {
      width: 100%;
      height: 110px;
      border-radius: 6px;
      object-fit: cover;
      margin-bottom: 10px;
      border: 1px solid rgba(255,255,255,0.08);
      display: block;
    }
    .tm-preview-placeholder {
      width: 100%;
      height: 110px;
      border-radius: 6px;
      margin-bottom: 10px;
      border: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: rgba(255,255,255,0.25);
      font-style: italic;
      background: rgba(255,255,255,0.03);
    }
    .tm-preview-changes {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .tm-preview-changes li {
      color: rgba(255,255,255,0.55);
      padding: 2px 0 2px 12px;
      position: relative;
      line-height: 1.4;
    }
    .tm-preview-changes li::before {
      content: '·';
      position: absolute;
      left: 2px;
      color: rgba(255,255,255,0.25);
    }

    /* --- Full panel --- */
    #tm-panel {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(6,6,6,0.97);
      border-top: 1px solid rgba(255,255,255,0.1);
      z-index: 99997;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.32, 0, 0.67, 0);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      max-height: 80vh;
      overflow-y: auto;
    }
    #tm-panel.open {
      transform: translateY(0);
      transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1);
    }
    #tm-panel-inner {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px 20px 80px;
    }
    .tm-panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .tm-panel-title {
      font-size: 13px;
      font-weight: 700;
      color: rgba(255,255,255,0.8);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .tm-panel-close {
      background: none;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 999px;
      color: rgba(255,255,255,0.5);
      font-size: 11px;
      padding: 3px 10px;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .tm-panel-close:hover {
      background: rgba(255,255,255,0.08);
      color: #fff;
    }
    .tm-timeline {
      display: flex;
      gap: 0;
      position: relative;
    }
    .tm-timeline::before {
      content: '';
      position: absolute;
      top: 18px;
      left: 18px;
      right: 18px;
      height: 1px;
      background: rgba(255,255,255,0.08);
    }
    .tm-tl-era {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 0 4px;
      opacity: 0.55;
      transition: opacity 0.15s;
      position: relative;
    }
    .tm-tl-era:hover, .tm-tl-era.tm-active { opacity: 1; }
    .tm-tl-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.15);
      flex-shrink: 0;
      position: relative;
      z-index: 1;
      transition: transform 0.15s;
    }
    .tm-tl-era:hover .tm-tl-dot,
    .tm-tl-era.tm-active .tm-tl-dot {
      transform: scale(1.3);
      border-color: transparent;
    }
    .tm-tl-label {
      font-size: 10px;
      color: rgba(255,255,255,0.45);
      white-space: nowrap;
    }
    .tm-tl-era.tm-active .tm-tl-label {
      color: #fff;
      font-weight: 600;
    }
    .tm-tl-detail {
      display: none;
    }
    #tm-panel-detail {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.07);
    }
    .tm-detail-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    .tm-detail-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .tm-detail-title {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .tm-detail-date {
      font-size: 11px;
      color: rgba(255,255,255,0.35);
      margin-left: auto;
    }
    .tm-detail-body {
      display: flex;
      gap: 16px;
    }
    .tm-detail-screenshot {
      width: 180px;
      height: 120px;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }
    .tm-detail-placeholder {
      width: 180px;
      height: 120px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: rgba(255,255,255,0.2);
      font-style: italic;
      flex-shrink: 0;
      background: rgba(255,255,255,0.02);
    }
    .tm-detail-changes {
      flex: 1;
    }
    .tm-detail-changes ul {
      list-style: none;
      padding: 0;
      margin: 0 0 14px;
    }
    .tm-detail-changes li {
      color: rgba(255,255,255,0.6);
      padding: 3px 0 3px 14px;
      position: relative;
      font-size: 12px;
      line-height: 1.5;
    }
    .tm-detail-changes li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: rgba(255,255,255,0.2);
      font-size: 10px;
    }
    .tm-detail-nav {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      text-decoration: none;
      color: #000;
      transition: opacity 0.15s;
    }
    .tm-detail-nav:hover { opacity: 0.85; }
    .tm-pages-note {
      font-size: 10px;
      color: rgba(255,255,255,0.25);
      margin-top: 8px;
      font-style: italic;
    }

    /* --- Diff highlight --- */
    @keyframes tm-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(0,217,255,0); outline: 2px solid rgba(0,217,255,0); }
      30%  { box-shadow: 0 0 0 6px rgba(0,217,255,0.15); outline: 2px solid rgba(0,217,255,0.5); }
      100% { box-shadow: 0 0 0 0 rgba(0,217,255,0); outline: 2px solid rgba(0,217,255,0); }
    }
    .tm-highlight-pulse {
      animation: tm-pulse 2.2s ease-out forwards;
      border-radius: 4px;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ─── PREVIEW CARD ──────────────────────────────────────────── */
  const preview = document.createElement('div');
  preview.id = 'tm-preview';
  document.body.appendChild(preview);

  let previewTimer = null;

  function showPreview(era, anchorEl) {
    clearTimeout(previewTimer);
    const hasPage = era.pages.includes(currentPage);
    const targetPage = hasPage ? currentPage : 'index.html';
    const href = era.root + targetPage;

    const imgTag = `<img class="tm-preview-screenshot" src="${era.screenshot}"
      onerror="this.outerHTML='<div class=\\'tm-preview-placeholder\\'>no screenshot yet</div>'" alt="${era.title}">`;

    preview.innerHTML = `
      <div class="tm-preview-header">
        <span class="tm-preview-dot" style="background:${era.color}"></span>
        <span class="tm-preview-title">${era.title}</span>
        <span class="tm-preview-date">${era.date}</span>
      </div>
      ${imgTag}
      <ul class="tm-preview-changes">
        ${era.changes.map(c => `<li>${c}</li>`).join('')}
      </ul>
    `;

    // Smart horizontal positioning
    const barRect = document.getElementById('tm-bar').getBoundingClientRect();
    const anchorRect = anchorEl.getBoundingClientRect();
    const cardW = 280;
    const vw = window.innerWidth;
    let left = anchorRect.left + anchorRect.width / 2 - cardW / 2;
    left = Math.max(10, Math.min(left, vw - cardW - 10));
    preview.style.left = left + 'px';
    preview.style.transform = 'none';
    preview.style.bottom = (window.innerHeight - barRect.top + 8) + 'px';

    preview.classList.add('visible');
  }

  function hidePreview() {
    previewTimer = setTimeout(() => preview.classList.remove('visible'), 120);
  }

  /* ─── FULL PANEL ────────────────────────────────────────────── */
  const panel = document.createElement('div');
  panel.id = 'tm-panel';

  function buildPanelContent(activeEra) {
    const hasPage = activeEra.pages.includes(currentPage);
    const targetPage = hasPage ? currentPage : 'index.html';
    const href = activeEra.root + targetPage;

    const imgTag = `<img class="tm-detail-screenshot" src="${activeEra.screenshot}"
      onerror="this.outerHTML='<div class=\\'tm-detail-placeholder\\'>no screenshot yet</div>'" alt="${activeEra.title}">`;

    const pagesNote = !hasPage
      ? `<p class="tm-pages-note">This page didn't exist in this era — link goes to homepage</p>`
      : '';

    panel.innerHTML = `
      <div id="tm-panel-inner">
        <div class="tm-panel-head">
          <span class="tm-panel-title">Site Timeline</span>
          <button class="tm-panel-close">close ✕</button>
        </div>
        <div class="tm-timeline">
          ${ERAS.map(e => `
            <div class="tm-tl-era ${e.id === activeEra.id ? 'tm-active' : ''}" data-era="${e.id}">
              <div class="tm-tl-dot" style="background:${e.id === activeEra.id ? e.color : 'rgba(255,255,255,0.15)'}"></div>
              <span class="tm-tl-label">${e.label}</span>
            </div>
          `).join('')}
        </div>
        <div id="tm-panel-detail">
          <div class="tm-detail-head">
            <span class="tm-detail-dot" style="background:${activeEra.color}"></span>
            <span class="tm-detail-title">${activeEra.title}</span>
            <span class="tm-detail-date">${activeEra.date}</span>
          </div>
          <div class="tm-detail-body">
            ${imgTag}
            <div class="tm-detail-changes">
              <ul>${activeEra.changes.map(c => `<li>${c}</li>`).join('')}</ul>
              <a class="tm-detail-nav" href="${href}" style="background:${activeEra.color}"
                onclick="sessionStorage.setItem('tm-prev-era','${currentEra.id}')">
                View this era →
              </a>
              ${pagesNote}
            </div>
          </div>
        </div>
      </div>
    `;

    panel.querySelector('.tm-panel-close').addEventListener('click', closePanel);
    panel.querySelectorAll('.tm-tl-era').forEach(el => {
      el.addEventListener('click', () => {
        const era = ERAS.find(e => e.id === el.dataset.era);
        if (era) buildPanelContent(era);
      });
    });
  }

  function openPanel() {
    buildPanelContent(currentEra);
    document.body.appendChild(panel);
    requestAnimationFrame(() => panel.classList.add('open'));
  }

  function closePanel() {
    panel.classList.remove('open');
    setTimeout(() => { if (panel.parentNode) panel.parentNode.removeChild(panel); }, 320);
  }

  /* ─── BAR ───────────────────────────────────────────────────── */
  const bar = document.createElement('div');
  bar.id = 'tm-bar';

  // Clock icon → open panel
  const icon = document.createElement('span');
  icon.className = 'tm-bar-icon';
  icon.textContent = '⏱';
  icon.title = 'Open timeline';
  icon.addEventListener('click', openPanel);
  bar.appendChild(icon);

  ERAS.forEach((era, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'tm-sep';
      sep.textContent = '·';
      bar.appendChild(sep);
    }

    const hasPage = era.pages.includes(currentPage);
    const targetPage = hasPage ? currentPage : 'index.html';
    const href = era.root + targetPage;

    const btn = document.createElement('a');
    btn.className = 'tm-era-btn' +
      (era.id === currentEra.id ? ' tm-active' : '') +
      (!hasPage ? ' tm-approx' : '');
    btn.textContent = era.label;
    btn.href = href;
    btn.title = era.title + (hasPage ? '' : ' (closest: homepage)');
    if (era.id !== currentEra.id) {
      btn.addEventListener('click', () => {
        sessionStorage.setItem('tm-prev-era', currentEra.id);
      });
    }
    btn.style.setProperty('--era-color', era.color);
    if (era.id === currentEra.id) {
      btn.style.color = era.color;
    }

    btn.addEventListener('mouseenter', () => showPreview(era, btn));
    btn.addEventListener('mouseleave', hidePreview);
    preview.addEventListener('mouseenter', () => clearTimeout(previewTimer));
    preview.addEventListener('mouseleave', hidePreview);

    bar.appendChild(btn);
  });

  document.body.appendChild(bar);
})();
