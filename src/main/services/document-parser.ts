// ArchLens — Document Parser
// Implemented in Task 4.1

import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { DocumentParseError, ValidationError } from '../errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedDocument {
  text: string;
  metadata: {
    filename: string;
    format: 'pdf' | 'docx' | 'txt';
    pageCount: number;
    wordCount: number;
    hasDiagrams: boolean;
  };
  warnings: string[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface DocumentParser {
  parse(filePath: string): Promise<ParsedDocument>;
  getSupportedFormats(): string[];
  validateFile(filePath: string): Promise<ValidationResult>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORTED_FORMATS = ['pdf', 'docx', 'txt'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PAGE_COUNT = 50;

/**
 * Average characters per page used for page-count estimation (TXT)
 * and diagram detection. A typical A4 page of text is ~2000–3000 chars.
 */
const CHARS_PER_PAGE = 2500;

/**
 * If a page has fewer characters than this threshold it is considered
 * "low-text" and likely contains a diagram or image.
 */
const DIAGRAM_TEXT_THRESHOLD = 50;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createDocumentParser(): DocumentParser {
  return {
    parse,
    getSupportedFormats,
    validateFile,
  };
}

function getSupportedFormats(): string[] {
  return [...SUPPORTED_FORMATS];
}

async function validateFile(filePath: string): Promise<ValidationResult> {
  const ext = getExtension(filePath);

  if (!SUPPORTED_FORMATS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format. Please upload a PDF, Word (.docx), or plain text (.txt) file.`,
    };
  }

  try {
    const stat = await fs.promises.stat(filePath);

    if (stat.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `This file exceeds the 10MB size limit. Please upload a smaller document.`,
      };
    }
  } catch {
    return {
      valid: false,
      error: `File not found or inaccessible: ${filePath}`,
    };
  }

  return { valid: true };
}

async function parse(filePath: string): Promise<ParsedDocument> {
  const validation = await validateFile(filePath);
  if (!validation.valid) {
    throw new ValidationError(validation.error!);
  }

  const ext = getExtension(filePath) as 'pdf' | 'docx' | 'txt';
  const filename = path.basename(filePath);

  switch (ext) {
    case 'pdf':
      return parsePdf(filePath, filename);
    case 'docx':
      return parseDocx(filePath, filename);
    case 'txt':
      return parseTxt(filePath, filename);
    default:
      throw new ValidationError(
        `Unsupported file format. Please upload a PDF, Word (.docx), or plain text (.txt) file.`,
      );
  }
}

// ---------------------------------------------------------------------------
// Format-specific parsers
// ---------------------------------------------------------------------------

async function parsePdf(
  filePath: string,
  filename: string,
): Promise<ParsedDocument> {
  let buffer: Buffer;
  try {
    buffer = await fs.promises.readFile(filePath);
  } catch {
    throw new DocumentParseError(
      `Failed to read file: ${filename}. The file may be corrupted or inaccessible.`,
    );
  }

  let result: Awaited<ReturnType<typeof pdfParse>>;
  try {
    result = await pdfParse(buffer);
  } catch {
    throw new DocumentParseError(
      `Failed to parse PDF: ${filename}. The file may be corrupted or password-protected.`,
    );
  }

  const pageCount = result.numpages ?? 1;
  if (pageCount > MAX_PAGE_COUNT) {
    throw new ValidationError(
      `This file exceeds the 50-page limit (${pageCount} pages). Please upload a smaller document.`,
    );
  }

  const text = result.text ?? '';
  const wordCount = countWords(text);
  const warnings: string[] = [];

  // Diagram detection: split text by form-feed or estimate pages
  const pages = splitTextIntoPages(text, pageCount);
  let hasDiagrams = false;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].trim().length < DIAGRAM_TEXT_THRESHOLD) {
      hasDiagrams = true;
      warnings.push(
        `Diagram detected on page ${i + 1} — flagged for manual review`,
      );
    }
  }

  return {
    text,
    metadata: { filename, format: 'pdf', pageCount, wordCount, hasDiagrams },
    warnings,
  };
}

async function parseDocx(
  filePath: string,
  filename: string,
): Promise<ParsedDocument> {
  let result: { value: string; messages: unknown[] };
  try {
    result = await mammoth.extractRawText({ path: filePath });
  } catch {
    throw new DocumentParseError(
      `Failed to parse DOCX: ${filename}. The file may be corrupted or password-protected.`,
    );
  }

  const text = result.value ?? '';
  const wordCount = countWords(text);
  const pageCount = Math.max(1, Math.ceil(text.length / CHARS_PER_PAGE));

  if (pageCount > MAX_PAGE_COUNT) {
    throw new ValidationError(
      `This file exceeds the 50-page limit (~${pageCount} pages). Please upload a smaller document.`,
    );
  }

  // mammoth messages may include image conversion warnings
  const warnings: string[] = [];
  let hasDiagrams = false;

  if (result.messages && result.messages.length > 0) {
    for (const msg of result.messages) {
      const m = msg as { message?: string };
      if (
        m.message?.toLowerCase().includes('image') ||
        m.message?.toLowerCase().includes('picture')
      ) {
        hasDiagrams = true;
        warnings.push(`Embedded image detected — flagged for manual review`);
      }
    }
  }

  return {
    text,
    metadata: { filename, format: 'docx', pageCount, wordCount, hasDiagrams },
    warnings,
  };
}

async function parseTxt(
  filePath: string,
  filename: string,
): Promise<ParsedDocument> {
  let text: string;
  try {
    text = await fs.promises.readFile(filePath, 'utf-8');
  } catch {
    throw new DocumentParseError(
      `Failed to read file: ${filename}. The file may be corrupted or inaccessible.`,
    );
  }

  const wordCount = countWords(text);
  const pageCount = Math.max(1, Math.ceil(text.length / CHARS_PER_PAGE));

  if (pageCount > MAX_PAGE_COUNT) {
    throw new ValidationError(
      `This file exceeds the 50-page limit (~${pageCount} pages). Please upload a smaller document.`,
    );
  }

  return {
    text,
    metadata: {
      filename,
      format: 'txt',
      pageCount,
      wordCount,
      hasDiagrams: false,
    },
    warnings: [],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getExtension(filePath: string): string {
  return path.extname(filePath).replace('.', '').toLowerCase();
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Splits extracted text into per-page chunks.
 * PDF text often contains form-feed characters (\f) as page separators.
 * If form-feeds are present we use those; otherwise we split evenly.
 */
function splitTextIntoPages(text: string, pageCount: number): string[] {
  if (text.includes('\f')) {
    return text.split('\f');
  }

  // Evenly distribute characters across pages
  if (pageCount <= 1) return [text];
  const chunkSize = Math.ceil(text.length / pageCount);
  const pages: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    pages.push(text.slice(i, i + chunkSize));
  }
  return pages;
}
