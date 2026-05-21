const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

let marked;

const CONTENT_DIR = 'content/blog';
const TEMPLATE_DIR = '_templates';
const OUTPUT_DIR = '.';

// --- Helpers ---

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitiseHtml(html) {
  let s = html;
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '');
  s = s.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '');
  s = s.replace(/<embed\b[^>]*\/?>/gi, '');
  s = s.replace(/(<[^>]*)\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '$1');
  s = s.replace(/(<[^>]*\s+href\s*=\s*)(["'])javascript:[^"']*\2/gi, '$1$2$2');
  s = s.replace(/(<[^>]*\s+src\s*=\s*)(["'])javascript:[^"']*\2/gi, '$1$2$2');
  return s;
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${day} ${months[month - 1]} ${year}`;
}

function calculateReadingTime(body) {
  let text = body.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`[^`]*`/g, '');
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return Math.max(1, Math.ceil(words.length / 200));
}

function truncateExcerpt(text, max) {
  if (text.length <= max) return text;
  const truncated = text.slice(0, max);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace === -1 ? truncated : truncated.slice(0, lastSpace)) + '\u2026';
}

// --- Main ---

function buildBlog() {
  // Check content directory
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('No content/blog directory found. Generating empty blog listing.');
    return;
  }

  // Load templates
  const postTemplatePath = path.join(TEMPLATE_DIR, 'post.html');
  const listingTemplatePath = path.join(TEMPLATE_DIR, 'blog-listing.html');

  if (!fs.existsSync(postTemplatePath) || !fs.existsSync(listingTemplatePath)) {
    console.error('Template files missing. Skipping blog build.');
    return;
  }

  const postTemplate = fs.readFileSync(postTemplatePath, 'utf-8');
  const listingTemplate = fs.readFileSync(listingTemplatePath, 'utf-8');

  // Read markdown files
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');

    if (!raw.startsWith('---')) {
      console.warn(`Skipping ${file}: no frontmatter`);
      continue;
    }

    const { data, content } = matter(raw);

    if (!data.title || !data.date) {
      console.warn(`Skipping ${file}: missing title or date`);
      continue;
    }

    // Normalize date
    let dateStr;
    if (data.date instanceof Date) {
      dateStr = data.date.toISOString().split('T')[0];
    } else {
      dateStr = String(data.date).trim();
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.warn(`Skipping ${file}: invalid date format`);
      continue;
    }

    // Derive slug from filename
    const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '').toLowerCase();

    // Defaults
    const category = data.category || 'Uncategorised';
    const author = data.author || 'The Solution Architect';
    const excerpt = data.excerpt || content.trim().split(/\n\s*\n/)[0].slice(0, 300);

    // Convert markdown
    const htmlContent = sanitiseHtml(marked.parse(content, { async: false }));
    const readingTime = calculateReadingTime(content);

    posts.push({ title: data.title, date: dateStr, category, author, excerpt, slug, htmlContent, readingTime });
  }

  // Sort: newest first, then alphabetical by title
  posts.sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    return d !== 0 ? d : a.title.localeCompare(b.title);
  });

  // Generate individual post pages
  for (const post of posts) {
    let html = postTemplate;
    html = html.replace(/\{\{title\}\}/g, escapeHtml(post.title));
    html = html.replace(/\{\{excerpt\}\}/g, escapeHtml(post.excerpt));
    html = html.replace(/\{\{category\}\}/g, escapeHtml(post.category));
    html = html.replace(/\{\{author\}\}/g, escapeHtml(post.author));
    html = html.replace(/\{\{date\}\}/g, formatDate(post.date));
    html = html.replace(/\{\{dateISO\}\}/g, post.date);
    html = html.replace(/\{\{readingTime\}\}/g, `${post.readingTime} min read`);
    html = html.replace(/\{\{content\}\}/g, post.htmlContent);
    html = html.replace(/\{\{slug\}\}/g, post.slug);

    fs.writeFileSync(path.join(OUTPUT_DIR, `${post.slug}.html`), html, 'utf-8');
  }

  // Generate listing page
  let cardsHtml;
  if (posts.length === 0) {
    cardsHtml = '<p class="blog-card__empty">No posts yet</p>';
  } else {
    cardsHtml = posts.map(post => {
      const title = escapeHtml(post.title);
      const category = escapeHtml(post.category);
      const excerptText = escapeHtml(truncateExcerpt(post.excerpt, 200));
      return `          <a href="${post.slug}.html" class="blog-card fade-in">
            <div class="blog-card__body">
              <div class="blog-card__meta">
                <span class="badge badge--category">${category}</span>
                <time datetime="${post.date}">${formatDate(post.date)}</time>
                <span>${post.readingTime} min read</span>
              </div>
              <h2 class="blog-card__title">${title}</h2>
              <p class="blog-card__excerpt">${excerptText}</p>
            </div>
          </a>`;
    }).join('\n\n');
  }

  const listingHtml = listingTemplate.replace('{{posts}}', cardsHtml);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'blog.html'), listingHtml, 'utf-8');

  console.log(`Built ${posts.length} blog post(s).`);
}

async function main() {
  const { marked: markedLib } = await import('marked');
  marked = markedLib;
  buildBlog();
}

main();
