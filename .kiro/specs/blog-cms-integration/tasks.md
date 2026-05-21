# Implementation Plan: Blog CMS Integration

## Overview

This plan implements the Decap CMS integration and Node.js build script for The Solution Architect's static website. The build script is written in TypeScript, compiled and run via `ts-node` or compiled to JS. It reads Markdown posts from `website/content/blog/`, parses YAML frontmatter, converts Markdown to HTML, and generates static HTML pages using templates. The Decap CMS admin panel provides a browser-based editorial interface backed by GitHub OAuth.

## Tasks

- [x] 1. Set up build script project structure and dependencies
  - [x] 1.1 Create directory structure and install dependencies
    - Create `website/content/blog/` directory for Markdown posts
    - Create `website/_templates/` directory for HTML templates
    - Create `website/admin/` directory for Decap CMS files
    - Install `gray-matter` and `marked` as dependencies (pinned versions)
    - Add `build:blog` script to `package.json`
    - _Requirements: 7.1, 7.2, 9.1, 9.2_

  - [x] 1.2 Define TypeScript interfaces and types for the build script
    - Create `website/build/types.ts` with `Post`, `BuildResult`, and `BuildConfig` interfaces
    - Define `Post` interface with fields: title, date, category, excerpt, author, readingTime, slug, body, htmlContent
    - Define `BuildResult` with postsGenerated count and success boolean
    - _Requirements: 3.2, 8.1_

- [x] 2. Implement frontmatter parsing and Markdown conversion
  - [x] 2.1 Implement the `parsePost` function
    - Create `website/build/parse-post.ts`
    - Parse YAML frontmatter using `gray-matter`
    - Validate required fields (title, date) and skip invalid files with warnings
    - Validate date format conforms to `YYYY-MM-DD`
    - Apply default values: "Uncategorised" for missing category, "The Solution Architect" for missing author
    - Extract excerpt from first paragraph if not provided, truncated to 300 characters
    - Derive slug from filename by removing date prefix and `.md` extension
    - Skip files that don't match `YYYY-MM-DD-<slug>.md` pattern
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 8.1, 8.4_

  - [x] 2.2 Implement Markdown-to-HTML conversion with sanitisation
    - Create `website/build/markdown-converter.ts`
    - Configure `marked` to convert headings, lists, links, code blocks, blockquotes, bold, italic, and images
    - Implement HTML sanitisation to strip `<script>`, `<iframe>`, `<object>`, `<embed>` tags, inline event handlers, and `javascript:` URLs
    - Preserve safe inline HTML elements
    - _Requirements: 4.1, 4.2, 4.5, 10.2_

  - [x] 2.3 Implement reading time calculation
    - Create `website/build/reading-time.ts`
    - Calculate word count from Markdown body (whitespace-separated tokens, excluding code blocks)
    - Compute reading time as `Math.ceil(wordCount / 200)` with minimum of 1 minute
    - _Requirements: 4.3, 4.4_

  - [x]* 2.4 Write property tests for frontmatter parsing
    - **Property 9: Frontmatter Round-Trip**
    - **Property 11: Default Field Values**
    - **Validates: Requirements 3.1, 3.2, 3.5, 3.6, 3.7**

  - [x]* 2.5 Write property test for reading time calculation
    - **Property 8: Reading Time Accuracy**
    - **Validates: Requirements 4.3, 4.4**

  - [x]* 2.6 Write property test for content fidelity
    - **Property 5: Content Fidelity**
    - **Validates: Requirements 4.1**

- [x] 3. Implement template rendering
  - [x] 3.1 Implement the `renderPost` function
    - Create `website/build/render-post.ts`
    - Replace all `{{token}}` placeholders with corresponding post data
    - HTML-escape text fields (title, excerpt, category, author) to prevent XSS
    - Insert `htmlContent` without double-escaping
    - Ensure no `{{...}}` placeholders remain in output
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 10.1_

  - [x] 3.2 Implement the `renderListing` function
    - Create `website/build/render-listing.ts`
    - Generate one blog card per post with title, date, category, excerpt (200 chars at word boundary with ellipsis), and reading time
    - Sort posts by date descending; use alphabetical title order for same-date posts
    - Handle empty posts array with "No posts yet" placeholder message
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x]* 3.3 Write property tests for template rendering
    - **Property 7: Safe Output**
    - **Property 10: Placeholder Elimination**
    - **Validates: Requirements 5.1, 5.2, 5.3, 10.1, 10.2**

  - [x]* 3.4 Write property test for template integrity
    - **Property 4: Template Integrity**
    - **Validates: Requirements 5.5**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement the main build orchestrator
  - [x] 5.1 Implement the `buildBlog` main function
    - Create `website/build/build-blog.ts`
    - Load templates from `website/_templates/`; exit with non-zero code if missing
    - Read all `.md` files from `website/content/blog/`; exit with non-zero code if directory missing
    - Parse each file, skip invalid ones with warnings to stderr
    - Handle duplicate slugs: keep newer post, skip older duplicate with error log
    - Sort posts by date descending
    - Generate individual post HTML files
    - Generate blog listing page
    - Return `BuildResult` with count and success status
    - Exit with zero code even when some files are skipped
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4_

  - [x]* 5.2 Write property tests for build completeness and ordering
    - **Property 1: Completeness**
    - **Property 2: Ordering**
    - **Validates: Requirements 7.1, 7.2, 7.3, 6.1, 6.4**

  - [x]* 5.3 Write property tests for idempotency and slug uniqueness
    - **Property 3: Idempotency**
    - **Property 6: Slug Uniqueness**
    - **Validates: Requirements 7.4, 8.1, 8.2, 8.3**

- [x] 6. Create HTML templates
  - [x] 6.1 Create the post page template
    - Create `website/_templates/post.html`
    - Match the structure of existing `blog-post-1.html` (header, nav, footer, CSS/JS references)
    - Include placeholder tokens: `{{title}}`, `{{content}}`, `{{date}}`, `{{dateISO}}`, `{{category}}`, `{{author}}`, `{{readingTime}}`, `{{excerpt}}`, `{{slug}}`
    - Include skip link, ARIA roles, semantic HTML, `<!DOCTYPE html>`, `<html lang="en">`, charset and viewport meta tags
    - _Requirements: 5.5, 5.7_

  - [x] 6.2 Create the blog listing template
    - Create `website/_templates/blog-listing.html`
    - Match existing site header/footer structure
    - Include `{{posts}}` placeholder for generated blog cards
    - Include "No posts yet" fallback structure
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 7. Set up Decap CMS admin panel
  - [x] 7.1 Create the CMS admin entry point
    - Create `website/admin/index.html` with Decap CMS script tag (pinned CDN version)
    - Include proper meta tags and title
    - _Requirements: 1.1, 10.3_

  - [x] 7.2 Create the CMS configuration file
    - Create `website/admin/config.yml`
    - Configure GitHub backend with OAuth authentication
    - Define blog collection with folder `website/content/blog/`, create enabled
    - Set slug pattern to `{{year}}-{{month}}-{{day}}-{{slug}}`
    - Define fields: title (string, required), date (datetime, required), category (select with predefined options), excerpt (text), author (string with default), body (markdown)
    - Configure media folder and public folder paths
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 10.3, 10.4_

- [x] 8. Integration and wiring
  - [x] 8.1 Create the CLI entry point and wire all components
    - Create `website/build/index.ts` as the main entry point
    - Wire `parsePost`, `renderPost`, `renderListing`, and `buildBlog` together
    - Add CLI output (post count, warnings, errors)
    - Ensure the script can be run via `npm run build:blog`
    - _Requirements: 7.1, 7.2, 9.1, 9.2, 9.3, 9.4_

  - [x] 8.2 Create a sample Markdown post for testing
    - Create `website/content/blog/2025-01-15-architecture-decisions.md` with frontmatter and body matching the existing `blog-post-1.html` content
    - Verify the build script produces output matching the existing page structure
    - _Requirements: 3.1, 3.2, 7.1_

  - [x]* 8.3 Write integration tests for the full build pipeline
    - Test end-to-end: place sample `.md` files, run build, verify output HTML files exist and contain expected content
    - Test error scenarios: missing templates, empty content directory, invalid frontmatter
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The build script uses TypeScript, consistent with the project's existing tech stack
- Dependencies `gray-matter` and `marked` should be pinned to exact versions for supply chain security
- The Decap CMS is loaded from a pinned CDN version — no npm install needed for the CMS itself

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "6.1", "6.2", "7.1", "7.2"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3", "3.1", "3.2"] },
    { "id": 3, "tasks": ["2.4", "2.5", "2.6", "3.3", "3.4"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "8.1"] },
    { "id": 6, "tasks": ["8.2"] },
    { "id": 7, "tasks": ["8.3"] }
  ]
}
```
