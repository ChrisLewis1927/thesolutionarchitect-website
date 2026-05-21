# Requirements Document

## Introduction

This feature adds a headless CMS (Decap CMS, formerly Netlify CMS) with a Git-based backend to the existing static website for "The Solution Architect" (thesolutionarchitect.uk). The CMS provides a login-based editorial interface for writing and publishing blog posts without editing HTML code directly. Blog posts are authored as Markdown files stored in the Git repository, and a build step converts them into static HTML pages that match the existing site design.

## Glossary

- **Decap_CMS**: An open-source headless content management system (formerly Netlify CMS) that provides a browser-based editorial interface backed by a Git repository
- **Git_Backend**: The Decap CMS backend adapter that commits content changes directly to the site's Git repository via an authentication provider
- **Build_Pipeline**: A Node.js script or static site generator that converts Markdown blog posts into HTML pages matching the existing site template
- **Markdown_Post**: A blog post authored in Markdown format with YAML front matter metadata, stored in the Git repository
- **Front_Matter**: YAML metadata at the top of a Markdown file containing fields such as title, date, category, excerpt, and reading time
- **Blog_Listing_Page**: The generated blog.html page that displays all published blog posts as cards in reverse chronological order
- **Blog_Post_Page**: A generated HTML page for an individual blog post, styled to match the existing article template
- **Admin_Panel**: The Decap CMS editorial interface served at /admin/ on the website
- **Authentication_Provider**: The OAuth or identity service (e.g., Netlify Identity, GitHub OAuth) that controls access to the Admin_Panel
- **Site_Template**: The existing HTML structure, CSS classes, header, footer, and navigation used across the static website

## Requirements

### Requirement 1: CMS Admin Panel Setup

**User Story:** As a site owner, I want a browser-based CMS admin panel at /admin/ on my website, so that I can manage blog content without editing code.

#### Acceptance Criteria

1. WHEN a user navigates to /admin/ on the website, THE Admin_Panel SHALL load the Decap CMS editorial interface
2. THE Admin_Panel SHALL include a config.yml file that defines the blog collection, fields, and Git_Backend settings
3. WHEN the Admin_Panel loads, THE Admin_Panel SHALL connect to the configured Git_Backend for content storage
4. THE Admin_Panel SHALL be accessible only via the site URL and SHALL NOT require a local development server to function

### Requirement 2: Authentication and Access Control

**User Story:** As a site owner, I want login-based access to the CMS, so that only authorised users can create or edit blog posts.

#### Acceptance Criteria

1. WHEN an unauthenticated user accesses the Admin_Panel, THE Authentication_Provider SHALL present a login prompt before granting access
2. WHEN valid credentials are provided, THE Authentication_Provider SHALL authenticate the user and grant access to the Admin_Panel
3. IF invalid credentials are provided, THEN THE Authentication_Provider SHALL deny access and display an error message
4. THE Admin_Panel SHALL support at least one OAuth-based Authentication_Provider (GitHub OAuth or Netlify Identity)

### Requirement 3: Blog Post Content Authoring

**User Story:** As a site owner, I want to write blog posts using a rich text editor with Markdown support, so that I can author content comfortably without writing raw HTML.

#### Acceptance Criteria

1. WHEN a user creates a new blog post in the Admin_Panel, THE Admin_Panel SHALL present editable fields for title, date, category, excerpt, reading time, and body content
2. THE Admin_Panel SHALL provide a rich text editor for the body field that supports headings, bold, italic, links, lists, blockquotes, and code blocks
3. WHEN a user saves a blog post, THE Admin_Panel SHALL commit a Markdown_Post file with valid Front_Matter to the Git repository
4. THE Markdown_Post SHALL be stored in a designated content directory (e.g., website/content/blog/) within the repository
5. WHEN a user edits an existing blog post, THE Admin_Panel SHALL load the current content from the Git repository and allow modifications

### Requirement 4: Front Matter Schema

**User Story:** As a site owner, I want each blog post to have structured metadata, so that the build process can generate correctly formatted HTML pages.

#### Acceptance Criteria

1. THE Front_Matter SHALL include a title field of type string
2. THE Front_Matter SHALL include a date field of type datetime
3. THE Front_Matter SHALL include a category field of type string
4. THE Front_Matter SHALL include an excerpt field of type text
5. THE Front_Matter SHALL include a reading_time field of type string (e.g., "5 min read")
6. THE Front_Matter SHALL include a slug field that determines the output HTML filename

### Requirement 5: Build Pipeline — Markdown to HTML Conversion

**User Story:** As a site owner, I want a build step that converts my Markdown blog posts into static HTML pages, so that the published site remains a set of plain HTML files.

#### Acceptance Criteria

1. WHEN the Build_Pipeline is executed, THE Build_Pipeline SHALL read all Markdown_Post files from the content directory
2. WHEN a Markdown_Post is processed, THE Build_Pipeline SHALL parse the Front_Matter and Markdown body content
3. WHEN a Markdown_Post is processed, THE Build_Pipeline SHALL generate a Blog_Post_Page as a static HTML file in the website root directory
4. THE Build_Pipeline SHALL use the slug Front_Matter field to determine the output filename (e.g., slug "my-post" produces "my-post.html")
5. IF a Markdown_Post contains invalid Front_Matter, THEN THE Build_Pipeline SHALL report an error identifying the file and the missing or invalid field

### Requirement 6: Blog Post Page Generation

**User Story:** As a site visitor, I want blog posts to look consistent with the rest of the site, so that the reading experience is seamless.

#### Acceptance Criteria

1. THE Blog_Post_Page SHALL include the Site_Template header with navigation, matching the existing site structure
2. THE Blog_Post_Page SHALL include the Site_Template footer, matching the existing site structure
3. THE Blog_Post_Page SHALL display the post title, category badge, author ("By The Solution Architect"), date, and reading time in the article header
4. THE Blog_Post_Page SHALL render the Markdown body content as HTML within an element using the existing article__content CSS class
5. THE Blog_Post_Page SHALL include appropriate meta tags (description, og:title, og:description, og:type) derived from the Front_Matter
6. THE Blog_Post_Page SHALL include the site favicon, stylesheet (css/style.css), and script (js/main.js) references

### Requirement 7: Blog Listing Page Generation

**User Story:** As a site visitor, I want the blog listing page to automatically show all published posts, so that I can discover new content without the page being manually updated.

#### Acceptance Criteria

1. WHEN the Build_Pipeline is executed, THE Build_Pipeline SHALL generate a Blog_Listing_Page (blog.html) listing all published Markdown_Post files
2. THE Blog_Listing_Page SHALL display posts as cards in a two-column grid layout using the existing blog-card CSS classes
3. THE Blog_Listing_Page SHALL order posts by date in descending order (newest first)
4. WHEN a blog card is displayed, THE Blog_Listing_Page SHALL show the category badge, date, reading time, title, and excerpt for each post
5. THE Blog_Listing_Page SHALL link each blog card to the corresponding Blog_Post_Page HTML file
6. THE Blog_Listing_Page SHALL include the Site_Template header, footer, and page-header section matching the existing design

### Requirement 8: Build Pipeline Execution

**User Story:** As a site owner, I want a simple command to run the build, so that I can regenerate the site after writing new posts.

#### Acceptance Criteria

1. THE Build_Pipeline SHALL be executable via a single npm script command (e.g., npm run build:blog)
2. WHEN the Build_Pipeline completes successfully, THE Build_Pipeline SHALL output a summary of how many posts were processed and files generated
3. THE Build_Pipeline SHALL complete processing without requiring manual intervention or interactive prompts
4. IF no Markdown_Post files exist in the content directory, THEN THE Build_Pipeline SHALL generate a Blog_Listing_Page with no post cards and report zero posts processed

### Requirement 9: Existing Site Compatibility

**User Story:** As a site owner, I want the CMS integration to work alongside my existing static files, so that non-blog pages remain unaffected.

#### Acceptance Criteria

1. THE Build_Pipeline SHALL NOT modify or overwrite any existing HTML files that are not blog-related (e.g., index.html, about.html, library.html)
2. THE Admin_Panel files (admin/index.html, admin/config.yml) SHALL coexist with existing site files without conflicts
3. THE Build_Pipeline SHALL preserve the existing CSS and JavaScript files without modification
4. WHEN a blog post slug matches an existing non-blog HTML filename, THE Build_Pipeline SHALL prefix the output filename with "blog-" to avoid overwriting existing files
