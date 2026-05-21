import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parsePost } from '../../website/build/parse-post';

describe('parsePost', () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parse-post-test-'));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writePost(filename: string, content: string): string {
    const filePath = path.join(tmpDir, filename);
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  }

  it('parses a valid post with all fields', () => {
    const filePath = writePost(
      '2025-01-15-my-first-post.md',
      `---
title: "My First Post"
date: 2025-01-15
category: "Architecture"
excerpt: "A brief summary."
author: "John Doe"
---

This is the body of the post.`
    );

    const post = parsePost(filePath);

    expect(post).not.toBeNull();
    expect(post!.title).toBe('My First Post');
    expect(post!.date).toBe('2025-01-15');
    expect(post!.category).toBe('Architecture');
    expect(post!.excerpt).toBe('A brief summary.');
    expect(post!.author).toBe('John Doe');
    expect(post!.slug).toBe('my-first-post');
    expect(post!.readingTime).toBe(1);
    expect(post!.htmlContent).toBe('');
  });

  it('applies default category when missing', () => {
    const filePath = writePost(
      '2025-02-10-no-category.md',
      `---
title: "No Category Post"
date: 2025-02-10
---

Some content here.`
    );

    const post = parsePost(filePath);

    expect(post).not.toBeNull();
    expect(post!.category).toBe('Uncategorised');
  });

  it('applies default author when missing', () => {
    const filePath = writePost(
      '2025-03-01-no-author.md',
      `---
title: "No Author Post"
date: 2025-03-01
---

Some content here.`
    );

    const post = parsePost(filePath);

    expect(post).not.toBeNull();
    expect(post!.author).toBe('The Solution Architect');
  });

  it('extracts excerpt from first paragraph when not provided', () => {
    const filePath = writePost(
      '2025-04-01-auto-excerpt.md',
      `---
title: "Auto Excerpt"
date: 2025-04-01
---

This is the first paragraph that should become the excerpt.

This is the second paragraph and should not be included.`
    );

    const post = parsePost(filePath);

    expect(post).not.toBeNull();
    expect(post!.excerpt).toBe('This is the first paragraph that should become the excerpt.');
  });

  it('truncates auto-extracted excerpt to 300 characters', () => {
    const longParagraph = 'A'.repeat(400);
    const filePath = writePost(
      '2025-04-02-long-excerpt.md',
      `---
title: "Long Excerpt"
date: 2025-04-02
---

${longParagraph}

Second paragraph.`
    );

    const post = parsePost(filePath);

    expect(post).not.toBeNull();
    expect(post!.excerpt.length).toBe(300);
  });

  it('returns null for filename not matching YYYY-MM-DD-<slug>.md pattern', () => {
    const filePath = writePost('invalid-name.md', `---
title: "Test"
date: 2025-01-01
---

Content.`);

    const post = parsePost(filePath);

    expect(post).toBeNull();
  });

  it('returns null when title is missing', () => {
    const filePath = writePost(
      '2025-05-01-no-title.md',
      `---
date: 2025-05-01
category: "Architecture"
---

Content.`
    );

    const post = parsePost(filePath);

    expect(post).toBeNull();
  });

  it('returns null when date is missing', () => {
    const filePath = writePost(
      '2025-05-02-no-date.md',
      `---
title: "No Date Post"
category: "Architecture"
---

Content.`
    );

    const post = parsePost(filePath);

    expect(post).toBeNull();
  });

  it('returns null when date format is invalid', () => {
    const filePath = writePost(
      '2025-05-03-bad-date.md',
      `---
title: "Bad Date"
date: "January 15, 2025"
---

Content.`
    );

    const post = parsePost(filePath);

    expect(post).toBeNull();
  });

  it('returns null when file has no frontmatter delimiters', () => {
    const filePath = writePost(
      '2025-06-01-no-frontmatter.md',
      `This is just plain content without any frontmatter.`
    );

    const post = parsePost(filePath);

    expect(post).toBeNull();
  });

  it('derives slug from filename correctly', () => {
    const filePath = writePost(
      '2025-07-01-my-awesome-post-title.md',
      `---
title: "Awesome Post"
date: 2025-07-01
---

Content.`
    );

    const post = parsePost(filePath);

    expect(post).not.toBeNull();
    expect(post!.slug).toBe('my-awesome-post-title');
  });

  it('calculates reading time correctly for longer posts', () => {
    // 400 words should give reading time of 2 minutes
    const words = Array(400).fill('word').join(' ');
    const filePath = writePost(
      '2025-08-01-long-post.md',
      `---
title: "Long Post"
date: 2025-08-01
---

${words}`
    );

    const post = parsePost(filePath);

    expect(post).not.toBeNull();
    expect(post!.readingTime).toBe(2);
  });

  it('sets minimum reading time of 1 minute for short posts', () => {
    const filePath = writePost(
      '2025-08-02-short-post.md',
      `---
title: "Short Post"
date: 2025-08-02
---

Just a few words.`
    );

    const post = parsePost(filePath);

    expect(post).not.toBeNull();
    expect(post!.readingTime).toBe(1);
  });

  it('converts slug to lowercase', () => {
    const filePath = writePost(
      '2025-09-01-Mixed-Case-Slug.md',
      `---
title: "Mixed Case"
date: 2025-09-01
---

Content.`
    );

    const post = parsePost(filePath);

    expect(post).not.toBeNull();
    expect(post!.slug).toBe('mixed-case-slug');
  });
});
