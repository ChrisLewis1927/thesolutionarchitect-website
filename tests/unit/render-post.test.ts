import { describe, it, expect, vi } from 'vitest';
import { renderPost, escapeHtml } from '../../website/build/render-post';
import { Post } from '../../website/build/types';

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    title: 'Test Post Title',
    date: '2025-01-15',
    category: 'Architecture',
    excerpt: 'A brief summary of the post.',
    author: 'The Solution Architect',
    readingTime: 3,
    slug: 'test-post-title',
    body: '# Hello\n\nSome content here.',
    htmlContent: '<h1>Hello</h1>\n<p>Some content here.</p>',
    ...overrides,
  };
}

const simpleTemplate = `<html>
<head><title>{{title}}</title></head>
<body>
<h1>{{title}}</h1>
<p class="category">{{category}}</p>
<p class="author">{{author}}</p>
<p class="excerpt">{{excerpt}}</p>
<time datetime="{{dateISO}}">{{date}}</time>
<span>{{readingTime}}</span>
<a href="{{slug}}.html">Link</a>
<div>{{content}}</div>
</body>
</html>`;

describe('escapeHtml', () => {
  it('escapes < and > characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes & character', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("It's fine")).toBe('It&#39;s fine');
  });

  it('escapes all special characters together', () => {
    expect(escapeHtml('<a href="x">&\'test\'')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;test&#39;'
    );
  });

  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('renderPost', () => {
  it('replaces all template tokens with post data', () => {
    const post = makePost();
    const result = renderPost(post, simpleTemplate);

    expect(result).not.toBeNull();
    expect(result).toContain('Test Post Title');
    expect(result).toContain('Architecture');
    expect(result).toContain('The Solution Architect');
    expect(result).toContain('A brief summary of the post.');
    expect(result).toContain('2025-01-15');
    expect(result).toContain('15 January 2025');
    expect(result).toContain('3 min read');
    expect(result).toContain('test-post-title.html');
    expect(result).toContain('<h1>Hello</h1>');
  });

  it('HTML-escapes text fields to prevent XSS', () => {
    const post = makePost({
      title: '<script>alert("xss")</script>',
      category: 'Cat & Dog',
      author: 'O\'Brien',
      excerpt: 'Use <b>bold</b> & "quotes"',
    });
    const result = renderPost(post, simpleTemplate)!;

    expect(result).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(result).toContain('Cat &amp; Dog');
    expect(result).toContain('O&#39;Brien');
    expect(result).toContain('Use &lt;b&gt;bold&lt;/b&gt; &amp; &quot;quotes&quot;');
  });

  it('inserts htmlContent without double-escaping', () => {
    const post = makePost({
      htmlContent: '<p>This has <strong>HTML</strong> & entities</p>',
    });
    const result = renderPost(post, simpleTemplate)!;

    expect(result).toContain('<p>This has <strong>HTML</strong> & entities</p>');
    expect(result).not.toContain('&amp;amp;');
    expect(result).not.toContain('&lt;p&gt;');
  });

  it('formats date as "D Month YYYY"', () => {
    const post = makePost({ date: '2025-03-07' });
    const result = renderPost(post, simpleTemplate)!;

    expect(result).toContain('7 March 2025');
  });

  it('leaves no {{...}} placeholders in output', () => {
    const post = makePost();
    const result = renderPost(post, simpleTemplate)!;

    expect(result).not.toMatch(/\{\{[^}]+\}\}/);
  });

  it('returns null when title is missing', () => {
    const post = makePost({ title: '' });
    const result = renderPost(post, simpleTemplate);

    expect(result).toBeNull();
  });

  it('returns null when excerpt is missing', () => {
    const post = makePost({ excerpt: '' });
    const result = renderPost(post, simpleTemplate);

    expect(result).toBeNull();
  });

  it('returns null when category is missing', () => {
    const post = makePost({ category: '' });
    const result = renderPost(post, simpleTemplate);

    expect(result).toBeNull();
  });

  it('returns null when author is missing', () => {
    const post = makePost({ author: '' });
    const result = renderPost(post, simpleTemplate);

    expect(result).toBeNull();
  });

  it('returns null when date is missing', () => {
    const post = makePost({ date: '' });
    const result = renderPost(post, simpleTemplate);

    expect(result).toBeNull();
  });

  it('returns null when htmlContent is missing', () => {
    const post = makePost({ htmlContent: '' });
    const result = renderPost(post, simpleTemplate);

    expect(result).toBeNull();
  });

  it('replaces multiple occurrences of the same token', () => {
    const post = makePost();
    // The simpleTemplate has {{title}} twice (in <title> and <h1>)
    const result = renderPost(post, simpleTemplate)!;

    const titleCount = (result.match(/Test Post Title/g) || []).length;
    expect(titleCount).toBe(2);
  });

  it('logs a warning when required field is missing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const post = makePost({ title: '' });

    renderPost(post, simpleTemplate);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('missing required field "title"')
    );
    warnSpy.mockRestore();
  });
});
