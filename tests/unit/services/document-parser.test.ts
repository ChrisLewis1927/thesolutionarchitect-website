import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createDocumentParser } from '@main/services/document-parser';
import type { DocumentParser } from '@main/services/document-parser';
import { DocumentParseError, ValidationError } from '@main/errors';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const mockedPdfParse = vi.mocked(pdfParse);
const mockedMammoth = vi.mocked(mammoth.extractRawText);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;
let parser: DocumentParser;

function writeTmpFile(name: string, content: string | Buffer): string {
  const filePath = path.join(tmpDir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'archlens-test-'));
  parser = createDocumentParser();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// getSupportedFormats
// ---------------------------------------------------------------------------

describe('getSupportedFormats', () => {
  it('returns pdf, docx, and txt', () => {
    expect(parser.getSupportedFormats()).toEqual(['pdf', 'docx', 'txt']);
  });
});

// ---------------------------------------------------------------------------
// validateFile
// ---------------------------------------------------------------------------

describe('validateFile', () => {
  it('accepts a .pdf file within size limit', async () => {
    const fp = writeTmpFile('doc.pdf', 'small content');
    const result = await parser.validateFile(fp);
    expect(result.valid).toBe(true);
  });

  it('accepts a .docx file within size limit', async () => {
    const fp = writeTmpFile('doc.docx', 'small content');
    const result = await parser.validateFile(fp);
    expect(result.valid).toBe(true);
  });

  it('accepts a .txt file within size limit', async () => {
    const fp = writeTmpFile('doc.txt', 'small content');
    const result = await parser.validateFile(fp);
    expect(result.valid).toBe(true);
  });

  it('rejects unsupported format with descriptive message listing supported formats', async () => {
    const fp = writeTmpFile('doc.xlsx', 'content');
    const result = await parser.validateFile(fp);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('PDF');
    expect(result.error).toContain('.docx');
    expect(result.error).toContain('.txt');
  });

  it('rejects case-insensitive unsupported format', async () => {
    const fp = writeTmpFile('doc.PNG', 'content');
    const result = await parser.validateFile(fp);
    expect(result.valid).toBe(false);
  });

  it('accepts case-insensitive supported format (.PDF)', async () => {
    const fp = writeTmpFile('doc.PDF', 'content');
    const result = await parser.validateFile(fp);
    expect(result.valid).toBe(true);
  });

  it('rejects file exceeding 10MB', async () => {
    const fp = writeTmpFile('big.pdf', Buffer.alloc(11 * 1024 * 1024));
    const result = await parser.validateFile(fp);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('rejects non-existent file', async () => {
    const result = await parser.validateFile('/nonexistent/file.pdf');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not found');
  });
});

// ---------------------------------------------------------------------------
// parse — TXT
// ---------------------------------------------------------------------------

describe('parse — TXT', () => {
  it('parses a plain text file', async () => {
    const content = 'Hello world. This is a test document with some words.';
    const fp = writeTmpFile('test.txt', content);
    const doc = await parser.parse(fp);

    expect(doc.text).toBe(content);
    expect(doc.metadata.format).toBe('txt');
    expect(doc.metadata.filename).toBe('test.txt');
    expect(doc.metadata.wordCount).toBe(10);
    expect(doc.metadata.pageCount).toBeGreaterThanOrEqual(1);
    expect(doc.metadata.hasDiagrams).toBe(false);
    expect(doc.warnings).toHaveLength(0);
  });

  it('handles empty text file', async () => {
    const fp = writeTmpFile('empty.txt', '');
    const doc = await parser.parse(fp);
    expect(doc.text).toBe('');
    expect(doc.metadata.wordCount).toBe(0);
    expect(doc.metadata.pageCount).toBe(1);
  });

  it('throws ValidationError for unsupported format', async () => {
    const fp = writeTmpFile('bad.html', '<html></html>');
    await expect(parser.parse(fp)).rejects.toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// parse — PDF (mocked)
// ---------------------------------------------------------------------------

describe('parse — PDF', () => {
  it('parses a PDF and returns extracted text', async () => {
    const fp = writeTmpFile('report.pdf', 'fake-pdf-bytes');
    mockedPdfParse.mockResolvedValueOnce({
      text: 'Architecture design document content here.',
      numpages: 3,
      numrender: 3,
      info: {},
      metadata: null,
      version: '1.0',
    });

    const doc = await parser.parse(fp);
    expect(doc.metadata.format).toBe('pdf');
    expect(doc.metadata.pageCount).toBe(3);
    expect(doc.text).toContain('Architecture design');
    expect(doc.metadata.wordCount).toBe(5);
  });

  it('detects diagram pages with low text content', async () => {
    // 3 pages: page 1 has text (>50 chars), page 2 is nearly empty (diagram), page 3 has text
    const page1 = 'Page one has plenty of text content here and more words to exceed the threshold easily.';
    const textWithFormFeeds = `${page1}\fX\f${page1}`;
    const fp = writeTmpFile('diagrams.pdf', 'fake-pdf');
    mockedPdfParse.mockResolvedValueOnce({
      text: textWithFormFeeds,
      numpages: 3,
      numrender: 3,
      info: {},
      metadata: null,
      version: '1.0',
    });

    const doc = await parser.parse(fp);
    expect(doc.metadata.hasDiagrams).toBe(true);
    expect(doc.warnings).toHaveLength(1);
    expect(doc.warnings[0]).toContain('page 2');
    expect(doc.warnings[0]).toContain('manual review');
  });

  it('throws DocumentParseError for corrupted PDF', async () => {
    const fp = writeTmpFile('corrupt.pdf', 'not-a-pdf');
    mockedPdfParse.mockRejectedValueOnce(new Error('Invalid PDF structure'));

    await expect(parser.parse(fp)).rejects.toThrow(DocumentParseError);
  });

  it('throws ValidationError when PDF exceeds 50 pages', async () => {
    const fp = writeTmpFile('huge.pdf', 'fake-pdf');
    mockedPdfParse.mockResolvedValueOnce({
      text: 'content',
      numpages: 60,
      numrender: 60,
      info: {},
      metadata: null,
      version: '1.0',
    });

    await expect(parser.parse(fp)).rejects.toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// parse — DOCX (mocked)
// ---------------------------------------------------------------------------

describe('parse — DOCX', () => {
  it('parses a DOCX and returns extracted text', async () => {
    const fp = writeTmpFile('design.docx', 'fake-docx-bytes');
    mockedMammoth.mockResolvedValueOnce({
      value: 'Solution architecture design for the new platform.',
      messages: [],
    });

    const doc = await parser.parse(fp);
    expect(doc.metadata.format).toBe('docx');
    expect(doc.text).toContain('Solution architecture');
    expect(doc.metadata.wordCount).toBe(7);
    expect(doc.metadata.hasDiagrams).toBe(false);
  });

  it('detects embedded images in DOCX via mammoth messages', async () => {
    const fp = writeTmpFile('with-images.docx', 'fake-docx');
    mockedMammoth.mockResolvedValueOnce({
      value: 'Some text content.',
      messages: [
        { type: 'warning', message: 'An image element was ignored' },
      ],
    });

    const doc = await parser.parse(fp);
    expect(doc.metadata.hasDiagrams).toBe(true);
    expect(doc.warnings.length).toBeGreaterThanOrEqual(1);
    expect(doc.warnings[0]).toContain('image');
  });

  it('throws DocumentParseError for corrupted DOCX', async () => {
    const fp = writeTmpFile('corrupt.docx', 'not-a-docx');
    mockedMammoth.mockRejectedValueOnce(new Error('Could not find file'));

    await expect(parser.parse(fp)).rejects.toThrow(DocumentParseError);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('handles file with no extension', async () => {
    const fp = writeTmpFile('noext', 'content');
    const result = await parser.validateFile(fp);
    expect(result.valid).toBe(false);
  });

  it('parse throws for non-existent file', async () => {
    await expect(parser.parse('/tmp/does-not-exist.txt')).rejects.toThrow();
  });
});
