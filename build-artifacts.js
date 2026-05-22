const fs = require('fs');
const path = require('path');

// Read the artifacts data
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'resources', 'content', 'artifacts', 'artifacts.json'), 'utf8'));

// Filter to architecture category only
const artifacts = data.artifacts.filter(a => a.category === 'architecture');
console.log(`Found ${artifacts.length} architecture artifacts`);

// Create artifacts directory if it doesn't exist
const artifactsDir = path.join(__dirname, 'artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir);
}

// Helper: get first sentence of a string
function getFirstSentence(text) {
  if (!text) return '';
  const match = text.match(/^[^.!?]*[.!?]/);
  return match ? match[0] : text;
}

// Helper: convert \n to paragraphs
function toParagraphs(text) {
  if (!text) return '';
  return text
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${p.replace(/\n/g, ' ')}</p>`)
    .join('\n          ');
}

// Helper: render phase badges
function renderPhaseBadges(phases) {
  if (!phases || phases.length === 0) return '';
  return phases.map(phase => `<span class="badge badge--${phase}">${phase}</span>`).join(' ');
}

// Build artifact lookup map for related artifacts
const artifactMap = {};
artifacts.forEach(a => { artifactMap[a.id] = a; });

// GA4 tracking code
const ga4Code = `<!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-DF1MYHFXP4"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-DF1MYHFXP4');
  </script>`;

// Footer HTML
const footerHTML = `<footer class="footer" role="contentinfo">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <p class="footer__brand-name">The Solution Architect</p>
          <p class="footer__brand-tagline">Architecture knowledge with a public service lens.</p>
        </div>
        <div>
          <p class="footer__nav-title">Learn</p>
          <ul class="footer__nav-list" role="list">
            <li><a href="library.html">Architect's Library</a></li>
            <li><a href="lifecycle.html">Project Lifecycle</a></li>
            <li><a href="cloud.html">Cloud Fundamentals</a></li>
          </ul>
        </div>
        <div>
          <p class="footer__nav-title">Resources</p>
          <ul class="footer__nav-list" role="list">
            <li><a href="artifacts.html">Architecture Artifacts</a></li>
            <li><a href="guardrails.html">AI Guardrails</a></li>
            <li><a href="blog.html">Blog</a></li>
          </ul>
        </div>
        <div>
          <p class="footer__nav-title">About</p>
          <ul class="footer__nav-list" role="list">
            <li><a href="about.html">About This Site</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <p class="footer__tagline">Built by a UK government Solution Architect</p>
        <p>&copy; 2025 thesolutionarchitect.uk</p>
      </div>
    </div>
  </footer>`;

// Footer for detail pages (one level up)
const footerDetailHTML = footerHTML
  .replace(/href="library.html"/g, 'href="../library.html"')
  .replace(/href="lifecycle.html"/g, 'href="../lifecycle.html"')
  .replace(/href="cloud.html"/g, 'href="../cloud.html"')
  .replace(/href="artifacts.html"/g, 'href="../artifacts.html"')
  .replace(/href="guardrails.html"/g, 'href="../guardrails.html"')
  .replace(/href="blog.html"/g, 'href="../blog.html"')
  .replace(/href="about.html"/g, 'href="../about.html"');

// ============================================================
// Generate listing page: artifacts.html
// ============================================================
function generateListingPage() {
  const cards = artifacts.map(artifact => {
    const excerpt = getFirstSentence(artifact.description);
    const badges = renderPhaseBadges(artifact.projectPhase);
    return `        <div class="card fade-in">
            <h3 class="card__title">${artifact.name}</h3>
            <p class="card__description">${excerpt}</p>
            <div style="margin-top: auto; padding-top: 1rem;">${badges}</div>
            <a href="artifacts/${artifact.id}.html" class="card__link">View artifact</a>
        </div>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${ga4Code}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Architecture Artifacts — A reference guide to the documents, diagrams, and deliverables that Solution Architects produce across the delivery lifecycle.">
  <meta property="og:title" content="Architecture Artifacts — The Solution Architect">
  <meta property="og:description" content="A reference guide to the documents, diagrams, and deliverables that Solution Architects produce across the delivery lifecycle.">
  <link rel="icon" type="image/svg+xml" href="images/favicon.svg">
  <title>Architecture Artifacts — The Solution Architect</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <a href="#main" class="skip-link">Skip to main content</a>

  <header class="header" role="banner">
    <div class="container">
      <a href="index.html" class="header__logo" aria-label="The Solution Architect - Home">
        <span class="header__logo-icon">SA</span>
        <span>The Solution Architect</span>
      </a>
      <nav class="nav" aria-label="Main navigation">
        <button class="nav__toggle" aria-expanded="false" aria-label="Open menu" aria-controls="nav-list">
          <span class="nav__toggle-icon"></span>
        </button>
        <ul class="nav__list" id="nav-list" role="list">
          <li><a href="library.html" class="nav__link">Architect's Library</a></li>
          <li><a href="lifecycle.html" class="nav__link">Lifecycle</a></li>
          <li><a href="guardrails.html" class="nav__link">AI Guardrails</a></li>
          <li><a href="cloud.html" class="nav__link">Cloud</a></li>
          <li><a href="artifacts.html" class="nav__link nav__link--active">Artifacts</a></li>
          <li><a href="blog.html" class="nav__link">Blog</a></li>
          <li><a href="about.html" class="nav__link">About</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main id="main">
    <section class="page-header">
      <div class="container">
        <h1 class="page-header__title">Architecture Artifacts</h1>
        <p class="page-header__subtitle">A reference guide to the documents, diagrams, and deliverables that Solution Architects produce across the delivery lifecycle.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="grid grid--2">
${cards}
        </div>
      </div>
    </section>
  </main>

  ${footerHTML}

  <script src="js/main.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'artifacts.html'), html, 'utf8');
  console.log('Generated artifacts.html');
}

// ============================================================
// Generate detail pages: artifacts/{id}.html
// ============================================================
function generateDetailPage(artifact) {
  // Build related artifacts links
  let relatedHTML = '';
  if (artifact.relatedArtifacts && artifact.relatedArtifacts.length > 0) {
    const links = artifact.relatedArtifacts
      .filter(id => artifactMap[id])
      .map(id => `<li><a href="${id}.html">${artifactMap[id].name}</a></li>`)
      .join('\n            ');
    if (links) {
      relatedHTML = `
        <section class="lesson-section">
          <h2>Related Artifacts</h2>
          <ul>
            ${links}
          </ul>
        </section>`;
    }
  }

  // Build tips list
  let tipsHTML = '';
  if (artifact.tips && artifact.tips.length > 0) {
    const items = artifact.tips.map(t => `<li>${t}</li>`).join('\n            ');
    tipsHTML = `
        <section class="lesson-section">
          <h2>Tips</h2>
          <ul>
            ${items}
          </ul>
        </section>`;
  }

  // Build common mistakes list
  let mistakesHTML = '';
  if (artifact.commonMistakes && artifact.commonMistakes.length > 0) {
    const items = artifact.commonMistakes.map(m => `<li>${m}</li>`).join('\n            ');
    mistakesHTML = `
        <section class="lesson-section">
          <h2>Common Mistakes</h2>
          <ul>
            ${items}
          </ul>
        </section>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${ga4Code}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${artifact.name} — ${getFirstSentence(artifact.description)}">
  <meta property="og:title" content="${artifact.name} — The Solution Architect">
  <meta property="og:description" content="${getFirstSentence(artifact.description)}">
  <link rel="icon" type="image/svg+xml" href="../images/favicon.svg">
  <title>${artifact.name} — The Solution Architect</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <a href="#main" class="skip-link">Skip to main content</a>

  <header class="header" role="banner">
    <div class="container">
      <a href="../index.html" class="header__logo" aria-label="The Solution Architect - Home">
        <span class="header__logo-icon">SA</span>
        <span>The Solution Architect</span>
      </a>
      <nav class="nav" aria-label="Main navigation">
        <button class="nav__toggle" aria-expanded="false" aria-label="Open menu" aria-controls="nav-list">
          <span class="nav__toggle-icon"></span>
        </button>
        <ul class="nav__list" id="nav-list" role="list">
          <li><a href="../library.html" class="nav__link">Architect's Library</a></li>
          <li><a href="../lifecycle.html" class="nav__link">Lifecycle</a></li>
          <li><a href="../guardrails.html" class="nav__link">AI Guardrails</a></li>
          <li><a href="../cloud.html" class="nav__link">Cloud</a></li>
          <li><a href="../artifacts.html" class="nav__link nav__link--active">Artifacts</a></li>
          <li><a href="../blog.html" class="nav__link">Blog</a></li>
          <li><a href="../about.html" class="nav__link">About</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main id="main">
    <section class="page-header">
      <div class="container">
        <h1 class="page-header__title">${artifact.name}</h1>
        <p class="page-header__subtitle">${artifact.description}</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="lesson-content">
        <section class="lesson-section">
          <h2>Purpose</h2>
          <p>${artifact.purpose}</p>
        </section>

        <section class="lesson-section">
          <h2>When to Use</h2>
          <p>${artifact.whenToUse}</p>
        </section>

        <section class="lesson-section">
          <h2>How to Build</h2>
          ${toParagraphs(artifact.howToBuild)}
        </section>
${tipsHTML}
${mistakesHTML}

        <section class="lesson-section">
          <h2>Government Context</h2>
          <p>${artifact.governmentContext}</p>
        </section>
${relatedHTML}

        <div class="lesson-nav">
          <a href="../artifacts.html" class="btn btn--secondary">&larr; Back to Artifacts</a>
        </div>
        </div>
      </div>
    </section>
  </main>

  ${footerDetailHTML}

  <script src="../js/main.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(artifactsDir, `${artifact.id}.html`), html, 'utf8');
}

// Run the build
generateListingPage();

artifacts.forEach(artifact => {
  generateDetailPage(artifact);
});

console.log(`Generated ${artifacts.length} detail pages in artifacts/`);
console.log('Build complete!');
