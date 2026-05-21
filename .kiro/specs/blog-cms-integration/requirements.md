# Requirements Document

## Introduction

This document defines the requirements for integrating Decap CMS into The Solution Architect's static website. The feature provides a browser-based editorial interface for writing and publishing blog posts, backed by a Node.js build script that converts Markdown content into fully-rendered HTML pages matching the existing site design. The solution preserves the site's static nature while adding a professional content management workflow.

## Glossary

- **Build_Script**: The Node.js script (`build-blog.js`) that reads Markdown files, parses frontmatter, converts content to HTML, and generates static HTML pages.
- **Decap_CMS**: The browser-based content management system (formerly Netlify CMS) that provides the editorial interface for creating and editing blog posts.
- **Frontmatter**: YAML metadata at the top of a Markdown file, delimited by `---`, containing fields such as title, date, category, excerpt, and author.
- **Post**: A blog post consisting of YAML frontmatter and a Markdown body, stored as a `.md` file in `website/content/blog/`.
- **Template**: An HTML file in `website/_templates/` containing placeholder tokens (e.g., `{{title}}`, `{{content}}`) that the Build_Script replaces with post data.
- **Slug**: A URL-friendly identifier derived from the post filename, used as the output HTML filename.
- **Listing_Page**: The `blog.html` page that displays cards for all published posts in reverse chronological order.
- **Post_Page**: An individual HTML page generated for a single blog post.
- **Reading_Time**: The estimated time to read a post, calculated as `ceil(wordCount / 200)` minutes.
- **Content_Directory**: The `website/content/blog/` folder where Markdown post files are stored.

## Requirements

### Requirement 1: CMS Authentication

**User Story:** As the blog author, I want to authenticate via GitHub OAuth when accessing the CMS admin panel, so that only authorised users can create or edit posts.

#### Acceptance Criteria

1. WHEN the author navigates to the admin panel, THE Decap_CMS SHALL present a GitHub OAuth login prompt before granting access to any editorial functionality.
2. WHEN the author successfully authenticates with GitHub using an authorised GitHub account, THE Decap_CMS SHALL display the editorial dashboard within 10 seconds of the OAuth callback completing.
3. IF GitHub OAuth authentication fails, THEN THE Decap_CMS SHALL display an authentication error message indicating the failure reason without exposing OAuth tokens, client secrets, or internal stack traces.
4. IF a user authenticates with a GitHub account that is not in the authorised users list, THEN THE Decap_CMS SHALL deny access to the editorial dashboard and display a message indicating the account is not authorised.
5. WHEN an unauthenticated user attempts to access any CMS editorial route directly, THE Decap_CMS SHALL redirect the user to the GitHub OAuth login prompt.
6. WHEN the author has an active authenticated session, THE Decap_CMS SHALL maintain that session until the browser session ends or the author explicitly logs out.

### Requirement 2: Post Creation and Editing

**User Story:** As the blog author, I want to create and edit blog posts through a rich Markdown editor, so that I can write content without manually editing files.

#### Acceptance Criteria

1. WHEN the author creates a new post, THE Decap_CMS SHALL present fields for title (maximum 200 characters), date, category, excerpt (maximum 500 characters), author (maximum 100 characters), and body (maximum 50,000 characters)
2. WHEN the author selects a category, THE Decap_CMS SHALL restrict the selection to the predefined options: Architecture, Government, Delivery, Practice, Cloud, and Governance
3. WHEN the author writes post content, THE Decap_CMS SHALL provide a Markdown editor with a live preview panel that updates within 1 second of content changes
4. WHEN the author publishes a post, THE Decap_CMS SHALL commit a new Markdown file to the Git repository in the Content_Directory
5. WHEN the author publishes a post, THE Decap_CMS SHALL name the file using the convention `YYYY-MM-DD-slug.md` where the slug is derived from the title by converting to lowercase, replacing spaces with hyphens, removing special characters, and truncating to a maximum of 80 characters
6. WHEN the author selects an existing post from the post list, THE Decap_CMS SHALL load the post content into the editor fields and allow the author to modify and republish the post as an updated commit to the same file
7. IF the author attempts to publish a post with any required field (title, date, category, or body) left empty, THEN THE Decap_CMS SHALL display a validation error message indicating which fields must be completed and SHALL prevent the publish action
8. IF the Decap_CMS fails to commit the file to the Git repository, THEN THE Decap_CMS SHALL display an error message indicating the publish failed and SHALL preserve the entered content so the author can retry without data loss

### Requirement 3: Frontmatter Parsing

**User Story:** As a developer, I want the build script to parse YAML frontmatter from Markdown files, so that post metadata is correctly extracted for rendering.

#### Acceptance Criteria

1. WHEN the Build_Script reads a Markdown file, THE Build_Script SHALL extract YAML frontmatter located between the opening `---` on the first line and the next `---` delimiter
2. WHEN frontmatter contains title, date, category, excerpt, and author fields, THE Build_Script SHALL parse all fields into a structured Post object containing title (string), date (ISO 8601 date string in `YYYY-MM-DD` format), category (string), excerpt (string, maximum 300 characters), author (string), and slug (string derived from filename)
3. IF the frontmatter is missing the required `title` field, THEN THE Build_Script SHALL skip the file and log a warning to the console identifying the filename and the missing field
4. IF the frontmatter is missing the required `date` field, THEN THE Build_Script SHALL skip the file and log a warning to the console identifying the filename and the missing field
5. IF the `date` field is present but does not conform to `YYYY-MM-DD` format, THEN THE Build_Script SHALL skip the file and log a warning to the console identifying the filename and the invalid value
6. WHEN the `category` field is absent from frontmatter, THE Build_Script SHALL default to "Uncategorised"
7. WHEN the `author` field is absent from frontmatter, THE Build_Script SHALL default to "The Solution Architect"
8. WHEN the `excerpt` field is absent from frontmatter, THE Build_Script SHALL use the first block of text before the first blank line in the Markdown body as the excerpt, truncated to 300 characters if longer
9. IF a Markdown file contains no `---` delimiters or only a single `---` delimiter, THEN THE Build_Script SHALL skip the file and log a warning to the console identifying the filename

### Requirement 4: Markdown to HTML Conversion

**User Story:** As a developer, I want the build script to convert Markdown content to HTML, so that blog posts render correctly in the browser.

#### Acceptance Criteria

1. WHEN the Build_Script processes a Post, THE Build_Script SHALL convert the Markdown body to HTML producing correct HTML elements for headings (h1–h6), ordered lists, unordered lists, links (anchor tags), fenced and inline code blocks, blockquotes, bold, italic, and images
2. WHEN the Build_Script converts Markdown to HTML, THE Build_Script SHALL remove all `<script>` tags, `<iframe>` tags, `<object>` tags, `<embed>` tags, inline event handler attributes (e.g., onclick, onerror, onload), and `javascript:` URLs from the output
3. WHEN the Build_Script processes a Post, THE Build_Script SHALL calculate Reading_Time as `ceil(wordCount / 200)` where wordCount is the number of whitespace-separated tokens in the Markdown body excluding frontmatter and code block contents
4. WHEN a Post has fewer than 200 words, THE Build_Script SHALL set Reading_Time to 1 minute
5. WHEN the Build_Script converts Markdown containing safe inline HTML (elements other than those listed in criterion 2), THE Build_Script SHALL preserve those elements in the HTML output without stripping them

### Requirement 5: Template Rendering

**User Story:** As a developer, I want the build script to inject post content into HTML templates, so that generated pages match the existing site design.

#### Acceptance Criteria

1. WHEN the Build_Script renders a Post_Page, THE Build_Script SHALL replace all template placeholder tokens with corresponding post data fields (title, excerpt, category, author, date, htmlContent, and meta description)
2. WHEN the Build_Script renders a Post_Page, THE Build_Script SHALL produce output containing no remaining `{{...}}` placeholder tokens
3. WHEN the Build_Script renders text fields (title, excerpt, category, author), THE Build_Script SHALL HTML-escape the characters `<`, `>`, `&`, `"`, and `'` by replacing them with their corresponding HTML entities
4. WHEN the Build_Script renders the `htmlContent` field, THE Build_Script SHALL insert it without double-escaping
5. WHEN the Build_Script renders a Post_Page, THE Build_Script SHALL include the site header with navigation links, footer with site branding, a reference to `css/style.css` in the `<head>`, and a reference to `js/main.js` before the closing `</body>` tag
6. IF a required post data field (title, excerpt, category, author, date, or htmlContent) is empty or missing, THEN THE Build_Script SHALL skip rendering that post and log a warning message indicating the post identifier and the missing field name
7. WHEN the Build_Script renders a Post_Page, THE Build_Script SHALL produce a valid HTML5 document containing a `<!DOCTYPE html>` declaration, a `<html lang="en">` root element, and `<meta charset="UTF-8">` and viewport meta tags in the `<head>`

### Requirement 6: Blog Listing Generation

**User Story:** As a site visitor, I want to see all blog posts listed on a single page in reverse chronological order, so that I can browse the latest content first.

#### Acceptance Criteria

1. WHEN the Build_Script generates the Listing_Page, THE Build_Script SHALL display posts sorted by date in descending order (newest first), where date is the value of the `date` frontmatter field in each Markdown file parsed as an ISO 8601 date (YYYY-MM-DD)
2. WHEN the Build_Script generates the Listing_Page, THE Build_Script SHALL produce one blog card per post containing the title, date, category, an excerpt consisting of the first 200 characters of the post body text (truncated at the nearest word boundary followed by an ellipsis), and reading time calculated as total word count divided by 200 words per minute rounded up to the nearest whole minute
3. IF the Content_Directory contains no valid Markdown files, THEN THE Build_Script SHALL generate the Listing_Page with a "No posts yet" placeholder message, where a valid Markdown file is one that contains the required frontmatter fields (title, date, and category) with non-empty values and a parseable ISO 8601 date
4. IF two or more posts share the same date value, THEN THE Build_Script SHALL order those posts alphabetically by title in ascending order (A–Z) to maintain a deterministic sequence
5. IF a Markdown file in the Content_Directory is missing any required frontmatter field (title, date, or category) or contains an unparseable date value, THEN THE Build_Script SHALL exclude that file from the Listing_Page and log a warning message identifying the filename and the missing or invalid field

### Requirement 7: Build Output Completeness

**User Story:** As a developer, I want the build script to generate one HTML file per valid post plus the listing page, so that no content is silently lost.

#### Acceptance Criteria

1. WHEN the Build_Script completes a build, THE Build_Script SHALL produce exactly one HTML file in the Output_Directory for each valid Markdown file in the Content_Directory, where a valid Markdown file is one that contains parseable frontmatter with all required fields
2. WHEN the Build_Script completes a build, THE Build_Script SHALL generate the Listing_Page containing one entry per valid post, where each entry includes at minimum the post title and a hyperlink to the corresponding HTML file
3. IF a Markdown file has invalid frontmatter (missing required fields or malformed syntax), THEN THE Build_Script SHALL skip that file, log a warning to standard error identifying the skipped filename and the reason for rejection, and continue processing remaining files
4. WHEN the Build_Script is run multiple times with no content changes, THE Build_Script SHALL produce byte-identical output files
5. IF the Content_Directory contains zero valid Markdown files, THEN THE Build_Script SHALL generate the Listing_Page with no post entries and SHALL NOT produce any post HTML files

### Requirement 8: Slug Handling

**User Story:** As a developer, I want each post to have a unique slug derived from its filename, so that output filenames are predictable and collision-free.

#### Acceptance Criteria

1. WHEN the Build_Script processes a Markdown file with a filename matching the pattern `YYYY-MM-DD-<slug>.md`, THE Build_Script SHALL derive the Slug by removing the leading date prefix (`YYYY-MM-DD-`) and the `.md` extension, converting the remaining string to lowercase, and preserving hyphens as-is
2. WHEN the Build_Script generates a Post_Page, THE Build_Script SHALL use the Slug as the output HTML filename in the format `{slug}.html`
3. IF two or more Markdown files produce the same Slug, THEN THE Build_Script SHALL log an error identifying the conflicting filenames, keep the post whose filename date prefix is the most recent, and skip the earlier duplicate
4. IF a Markdown file's name does not match the expected `YYYY-MM-DD-<slug>.md` pattern, THEN THE Build_Script SHALL log a warning identifying the file and skip it without generating an output page

### Requirement 9: Error Handling

**User Story:** As a developer, I want the build script to handle errors gracefully, so that a single broken post does not prevent the entire site from building.

#### Acceptance Criteria

1. IF a template file is missing or unreadable, THEN THE Build_Script SHALL exit with a non-zero exit code and print an error message to standard error that includes the expected template file path and the nature of the failure (missing or unreadable).
2. IF the Content_Directory does not exist, THEN THE Build_Script SHALL exit with a non-zero exit code and print an error message to standard error that includes the expected Content_Directory path.
3. WHEN the Build_Script encounters a Markdown file that cannot be parsed (malformed front matter, unreadable file encoding, or empty content body), THE Build_Script SHALL log a warning to standard error that includes the file path and the reason for the failure, skip that file, and continue processing the remaining files without terminating.
4. WHEN the Build_Script completes processing after skipping one or more invalid Markdown files, THE Build_Script SHALL exit with a zero exit code and produce output for all successfully parsed files.

### Requirement 10: Security

**User Story:** As the blog author, I want generated pages to be safe from cross-site scripting attacks, so that site visitors are protected from malicious content.

#### Acceptance Criteria

1. WHEN the Build_Script renders user-provided text fields (all fields sourced from CMS content files) into HTML, THE Build_Script SHALL escape the following HTML special characters: `<`, `>`, `&`, `"`, and `'` by converting them to their corresponding HTML entities.
2. WHEN the Build_Script converts Markdown to HTML, THE Build_Script SHALL strip script tags, event handler attributes (attributes prefixed with "on"), javascript: URIs, data: URIs in links, iframe elements, object elements, and embed elements from the output.
3. THE Decap_CMS admin panel SHALL require GitHub OAuth authentication before allowing any content modifications.
4. IF a user attempts to access the Decap_CMS admin panel without completing GitHub OAuth authentication, THEN THE Decap_CMS admin panel SHALL redirect the user to the GitHub OAuth login flow and SHALL NOT display or permit access to any content editing functionality.
