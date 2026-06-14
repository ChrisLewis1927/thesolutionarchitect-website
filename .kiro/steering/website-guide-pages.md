---
inclusion: manual
---

# Website Guide Page Creation Process

## Overview

This file documents the exact process for creating new Architect's Library guide pages on thesolutionarchitect.uk. Follow every step exactly — no deviations.

## Site Architecture

- **Live site**: https://thesolutionarchitect.uk
- **Hosting**: Netlify, auto-deploys from `main` branch on GitHub
- **Publish directory**: Root of repo (`.`)
- **Repo**: https://github.com/ChrisLewis1927/thesolutionarchitect-website.git
- **The `website/` folder is gitignored** — it's a working/staging area only. Deployed files go in the ROOT.

## File Locations

| What | Where |
|------|-------|
| HTML guide pages | Root: `guide-{slug}.html` |
| Images (WebP) | Root: `images/{filename}.webp` |
| CSS | `css/style.css` |
| JavaScript | `js/main.js` |
| Library listing | `library.html` |
| PNG source images (staging) | `website/images/Lesson N - Title/` |

## Step-by-Step Process

### 1. Convert PNG images to WebP

Source PNGs are in `website/images/Lesson N - Title/`. Convert them to WebP and place in the root `images/` folder:

```
npx sharp-cli --input "website/images/Lesson N - Title/N.1.png" --output "images/N.1 - Title.webp" --format webp
```

Repeat for all images (typically 8 per lesson).

### 2. Create the HTML page

Create `guide-{slug}.html` in the ROOT directory. Use this exact template structure:

**Critical elements that MUST be included:**
- `data-lightbox` attribute on each `<img>` (NOT `<a href>` wrapper)
- `data-title`, `tabindex="0"`, `role="button"`, `aria-label` on each image
- The **lightbox modal container** before the footer (ESSENTIAL — without this, clicking does nothing)
- Google Analytics tag in `<head>` (check other recent pages)
- Correct CSS path: `css/style.css`
- Correct JS path: `js/main.js`

### 3. Image markup pattern (CORRECT)

```html
<img src="images/N.1 - Title.webp" alt="Descriptive alt text" style="width: 100%; border-radius: 8px; margin-bottom: 1rem; cursor: pointer;" data-lightbox="images/N.1 - Title.webp" data-title="Short Title" tabindex="0" role="button" aria-label="Click to enlarge: Descriptive alt text">
```

**WRONG — do NOT use this:**
```html
<a href="images/N.1 - Title.webp" target="_blank">
  <img src="images/N.1 - Title.webp" ...>
</a>
```

### 4. Lightbox modal container (REQUIRED)

This MUST appear after `</main>` and before `<footer>`:

```html
<div class="lightbox" role="dialog" aria-modal="true" aria-label="Image lightbox">
  <button class="lightbox__close" aria-label="Close lightbox">&times;</button>
  <div class="lightbox__content">
    <img class="lightbox__image" src="" alt="">
    <p class="lightbox__title"></p>
  </div>
</div>
```

### 5. Page structure template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="...">
  <meta property="og:title" content="... — Architect's Library">
  <meta property="og:description" content="...">
  <link rel="icon" type="image/png" href="images/favicon.png">
  <title>... — Architect's Library</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <a href="#main" class="skip-link">Skip to main content</a>
  <!-- HEADER (copy from any existing guide page) -->
  <main id="main">
    <section class="lesson-hero">
      <div class="container">
        <div class="lesson-hero__meta">
          <span class="badge badge--foundation">Foundation</span>
          <span style="color: var(--color-light-grey); font-size: 0.875rem;">Category Name</span>
        </div>
        <h1 class="lesson-hero__title">Page Title</h1>
        <p class="lesson-hero__description">Description paragraph.</p>
      </div>
    </section>
    <div class="lesson-content">
      <div class="info-box mb-2xl">
        <p><strong>You'll come away with:</strong></p>
        <ul style="list-style: disc; padding-left: 1.5rem; margin-top: 0.5rem;">
          <li>...</li>
        </ul>
      </div>
      <!-- SECTIONS: h2 → img (data-lightbox) → subtitle p → prose → blockquote -->
      <!-- RELATED GUIDES NAV at bottom -->
    </div>
  </main>
  <!-- LIGHTBOX MODAL (see above) -->
  <!-- FOOTER (copy from any existing guide page) -->
  <script src="js/main.js"></script>
</body>
</html>
```

### 6. Add entry to library.html

Add the new card to `library.html` inside `#library-grid`:

```html
<a href="guide-{slug}.html" class="lesson-card fade-in" data-category="{category}">
  <span class="lesson-card__number">{N}</span>
  <div class="lesson-card__content">
    <h3 class="lesson-card__title">Title</h3>
    <p class="lesson-card__meta">One-liner description.</p>
  </div>
</a>
```

Valid `data-category` values: `role`, `discovery`, `decisions`

### 7. Deploy

```
git add guide-{slug}.html images/{all-new-webp-files} library.html
git commit -m "Add Lesson N: {Title}"
git push
```

Netlify auto-deploys from main. Page live within 2 minutes.

## Existing Pages (for reference)

| # | Slug | Category |
|---|------|----------|
| 1 | guide-what-a-solution-architect-does | role |
| 2 | guide-how-architecture-thinking-differs | role |
| 3 | guide-understanding-the-problem | discovery |
| 4 | guide-stakeholders-and-landscape | discovery |
| 5 | guide-functional-and-nonfunctional-requirements | decisions |
| 6 | guide-architecture-decisions | decisions |
| 7 | guide-asking-better-discovery-questions | discovery |
| 8 | guide-assessing-current-state | discovery |

## Image Naming Convention

Images follow: `{lesson}.{section} - {Title}.webp`

Examples:
- `8.1 - Why Current State Assessment Matters.webp`
- `5.3 - Scalability and Availability.webp`
