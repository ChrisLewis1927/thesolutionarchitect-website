import { describe, it, expect } from 'vitest';
import { convertMarkdown, sanitiseHtml } from '../../../website/build/markdown-converter';

describe('convertMarkdown', () => {
  describe('Markdown element conversion', () => {
    it('converts headings (h1-h6)', () => {
      const md = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
      const html = convertMarkdown(md);
      expect(html).toContain('<h1>H1</h1>');
      expect(html).toContain('<h2>H2</h2>');
      expect(html).toContain('<h3>H3</h3>');
      expect(html).toContain('<h4>H4</h4>');
      expect(html).toContain('<h5>H5</h5>');
      expect(html).toContain('<h6>H6</h6>');
    });

    it('converts unordered lists', () => {
      const md = '- Item 1\n- Item 2\n- Item 3';
      const html = convertMarkdown(md);
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('<li>Item 2</li>');
      expect(html).toContain('<li>Item 3</li>');
      expect(html).toContain('</ul>');
    });

    it('converts ordered lists', () => {
      const md = '1. First\n2. Second\n3. Third';
      const html = convertMarkdown(md);
      expect(html).toContain('<ol>');
      expect(html).toContain('<li>First</li>');
      expect(html).toContain('<li>Second</li>');
      expect(html).toContain('</ol>');
    });

    it('converts links', () => {
      const md = '[Example](https://example.com)';
      const html = convertMarkdown(md);
      expect(html).toContain('<a href="https://example.com">Example</a>');
    });

    it('converts fenced code blocks', () => {
      const md = '```javascript\nconst x = 1;\n```';
      const html = convertMarkdown(md);
      expect(html).toContain('<code');
      expect(html).toContain('const x = 1;');
    });

    it('converts inline code', () => {
      const md = 'Use `console.log()` for debugging';
      const html = convertMarkdown(md);
      expect(html).toContain('<code>console.log()</code>');
    });

    it('converts blockquotes', () => {
      const md = '> This is a quote';
      const html = convertMarkdown(md);
      expect(html).toContain('<blockquote>');
      expect(html).toContain('This is a quote');
      expect(html).toContain('</blockquote>');
    });

    it('converts bold text', () => {
      const md = '**bold text**';
      const html = convertMarkdown(md);
      expect(html).toContain('<strong>bold text</strong>');
    });

    it('converts italic text', () => {
      const md = '*italic text*';
      const html = convertMarkdown(md);
      expect(html).toContain('<em>italic text</em>');
    });

    it('converts images', () => {
      const md = '![Alt text](https://example.com/image.png "Title")';
      const html = convertMarkdown(md);
      expect(html).toContain('<img');
      expect(html).toContain('src="https://example.com/image.png"');
      expect(html).toContain('alt="Alt text"');
    });
  });

  describe('HTML sanitisation', () => {
    it('strips script tags and their content', () => {
      const md = 'Hello <script>alert("xss")</script> world';
      const html = convertMarkdown(md);
      expect(html).not.toContain('<script');
      expect(html).not.toContain('alert');
      expect(html).toContain('Hello');
      expect(html).toContain('world');
    });

    it('strips iframe tags and their content', () => {
      const md = '<iframe src="https://evil.com"></iframe>';
      const html = convertMarkdown(md);
      expect(html).not.toContain('<iframe');
      expect(html).not.toContain('evil.com');
    });

    it('strips object tags and their content', () => {
      const md = '<object data="malware.swf"><param name="x"></object>';
      const html = convertMarkdown(md);
      expect(html).not.toContain('<object');
      expect(html).not.toContain('malware.swf');
    });

    it('strips embed tags', () => {
      const md = '<embed src="malware.swf" type="application/x-shockwave-flash">';
      const html = convertMarkdown(md);
      expect(html).not.toContain('<embed');
    });

    it('removes inline event handlers', () => {
      const md = '<div onclick="alert(1)">Click me</div>';
      const html = convertMarkdown(md);
      expect(html).not.toContain('onclick');
      expect(html).not.toContain('alert');
      expect(html).toContain('<div');
      expect(html).toContain('Click me');
    });

    it('removes onerror event handlers', () => {
      const md = '<img src="x" onerror="alert(1)">';
      const html = convertMarkdown(md);
      expect(html).not.toContain('onerror');
      expect(html).not.toContain('alert');
    });

    it('removes onload event handlers', () => {
      const md = '<body onload="alert(1)">content</body>';
      const html = convertMarkdown(md);
      expect(html).not.toContain('onload');
    });

    it('removes javascript: URLs from href', () => {
      const md = '<a href="javascript:alert(1)">Click</a>';
      const html = convertMarkdown(md);
      expect(html).not.toContain('javascript:');
      expect(html).toContain('Click');
    });

    it('removes javascript: URLs from src', () => {
      const md = '<img src="javascript:alert(1)">';
      const html = convertMarkdown(md);
      expect(html).not.toContain('javascript:');
    });

    it('removes data: URIs from link href', () => {
      const md = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
      const html = convertMarkdown(md);
      expect(html).not.toContain('data:');
    });

    it('preserves safe inline HTML elements', () => {
      const md = '<span class="highlight">highlighted</span>';
      const html = convertMarkdown(md);
      expect(html).toContain('<span class="highlight">highlighted</span>');
    });

    it('preserves div elements', () => {
      const md = '<div class="container">content</div>';
      const html = convertMarkdown(md);
      expect(html).toContain('<div class="container">content</div>');
    });

    it('preserves em and strong elements', () => {
      const md = '<em>emphasis</em> and <strong>strong</strong>';
      const html = convertMarkdown(md);
      expect(html).toContain('<em>emphasis</em>');
      expect(html).toContain('<strong>strong</strong>');
    });
  });
});

describe('sanitiseHtml', () => {
  it('handles multiline script tags', () => {
    const html = '<p>Before</p><script>\nalert("xss");\nconsole.log("evil");\n</script><p>After</p>';
    const result = sanitiseHtml(html);
    expect(result).not.toContain('<script');
    expect(result).toContain('<p>Before</p>');
    expect(result).toContain('<p>After</p>');
  });

  it('handles multiple dangerous elements', () => {
    const html = '<script>bad</script><iframe>bad</iframe><object>bad</object><embed src="bad">';
    const result = sanitiseHtml(html);
    expect(result).toBe('');
  });

  it('handles event handlers with single quotes', () => {
    const html = "<div onclick='alert(1)'>test</div>";
    const result = sanitiseHtml(html);
    expect(result).not.toContain('onclick');
    expect(result).toContain('test');
  });

  it('handles event handlers without quotes', () => {
    const html = '<div onmouseover=alert(1)>test</div>';
    const result = sanitiseHtml(html);
    expect(result).not.toContain('onmouseover');
    expect(result).toContain('test');
  });

  it('preserves safe HTML unchanged', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    const result = sanitiseHtml(html);
    expect(result).toBe('<p>Hello <strong>world</strong></p>');
  });
});
