import { describe, it, expect } from 'vitest';
import { renderListing, escapeHtml } from '../../../website/build/render-listing';
import { Post } from '../../../website/build/types';

const template = `<div class="grid grid--2">
          {{posts}}
        </div>`;

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    title: 'Test Post',
    date: '2025-01-15',
    category: 'Architecture',
    excerpt: 'A short excerpt for testing purposes.',
    author: 'The Solution Architect',
    readingTime: 5,
    slug: 'test-post',
    body: 'Some markdown body content.',
    htmlContent: '<p>Some markdown body content.</p>',
    ...overrides,
  };
}

describe('renderListing', () => {
  it('renders a "No posts yet" placeholder when posts array is empty', () => {
    const result = renderListing([], template);
    expect(result).toContain('No posts yet');
    expect(result).not.toContain('{{posts}}');
  });

  it('generates one blog card per post', () => {
    const posts = [
      makePost({ title: 'Post A', slug: 'post-a' }),
      makePost({ title: 'Post B', slug: 'post-b', date: '2025-01-10' }),
    ];
    const result = renderListing(posts, template);
    expect(result).toContain('Post A');
    expect(result).toContain('Post B');
    expect(result).toContain('post-a.html');
    expect(result).toContain('post-b.html');
  });

  it('sorts posts by date descending (newest first)', () => {
    const posts = [
      makePost({ title: 'Older', date: '2024-12-01', slug: 'older' }),
      makePost({ title: 'Newer', date: '2025-01-15', slug: 'newer' }),
    ];
    const result = renderListing(posts, template);
    const newerIndex = result.indexOf('Newer');
    const olderIndex = result.indexOf('Older');
    expect(newerIndex).toBeLessThan(olderIndex);
  });

  it('sorts posts with the same date alphabetically by title (A-Z)', () => {
    const posts = [
      makePost({ title: 'Zebra Post', date: '2025-01-15', slug: 'zebra' }),
      makePost({ title: 'Alpha Post', date: '2025-01-15', slug: 'alpha' }),
    ];
    const result = renderListing(posts, template);
    const alphaIndex = result.indexOf('Alpha Post');
    const zebraIndex = result.indexOf('Zebra Post');
    expect(alphaIndex).toBeLessThan(zebraIndex);
  });

  it('truncates excerpt at word boundary with ellipsis when over 200 chars', () => {
    const longExcerpt = 'word '.repeat(50); // 250 chars
    const posts = [makePost({ excerpt: longExcerpt })];
    const result = renderListing(posts, template);
    // Should not contain the full excerpt
    expect(result).not.toContain(longExcerpt.trim());
    // Should contain the ellipsis character
    expect(result).toContain('\u2026');
  });

  it('does not truncate excerpt when 200 chars or fewer', () => {
    const shortExcerpt = 'A short excerpt.';
    const posts = [makePost({ excerpt: shortExcerpt })];
    const result = renderListing(posts, template);
    expect(result).toContain(shortExcerpt);
    expect(result).not.toContain('\u2026');
  });

  it('includes title, date, category, excerpt, and reading time in each card', () => {
    const posts = [makePost({
      title: 'My Title',
      date: '2025-03-20',
      category: 'Cloud',
      excerpt: 'My excerpt text.',
      readingTime: 3,
      slug: 'my-title',
    })];
    const result = renderListing(posts, template);
    expect(result).toContain('My Title');
    expect(result).toContain('20 March 2025');
    expect(result).toContain('Cloud');
    expect(result).toContain('My excerpt text.');
    expect(result).toContain('3 min read');
    expect(result).toContain('my-title.html');
  });

  it('formats dates correctly (e.g., "15 January 2025")', () => {
    const posts = [makePost({ date: '2025-01-15' })];
    const result = renderListing(posts, template);
    expect(result).toContain('15 January 2025');
    expect(result).toContain('datetime="2025-01-15"');
  });

  it('escapes HTML in title and category', () => {
    const posts = [makePost({
      title: '<script>alert("xss")</script>',
      category: 'A & B',
      slug: 'xss-test',
    })];
    const result = renderListing(posts, template);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('A &amp; B');
  });

  it('replaces {{posts}} placeholder in template', () => {
    const posts = [makePost()];
    const result = renderListing(posts, template);
    expect(result).not.toContain('{{posts}}');
  });

  it('does not mutate the original posts array', () => {
    const posts = [
      makePost({ title: 'B', date: '2025-01-15', slug: 'b' }),
      makePost({ title: 'A', date: '2025-01-20', slug: 'a' }),
    ];
    const originalOrder = posts.map((p) => p.title);
    renderListing(posts, template);
    expect(posts.map((p) => p.title)).toEqual(originalOrder);
  });
});

describe('escapeHtml', () => {
  it('escapes all HTML special characters', () => {
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('>')).toBe('&gt;');
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('"')).toBe('&quot;');
    expect(escapeHtml("'")).toBe('&#39;');
  });

  it('escapes multiple characters in a string', () => {
    expect(escapeHtml('<a href="test">')).toBe('&lt;a href=&quot;test&quot;&gt;');
  });
});
