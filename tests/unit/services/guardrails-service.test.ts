import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  GuardrailsService,
  GuardrailsTopic,
  ALL_GUARDRAILS_CATEGORIES,
  splitFrontmatter,
  parseFrontmatter,
} from '../../../src/main/services/guardrails-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a temp directory with sample guardrails Markdown files. */
function createTempGuardrailsDir(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archlens-guardrails-'));

  // governance category
  const govDir = path.join(tmpDir, 'governance');
  fs.mkdirSync(govDir);
  fs.writeFileSync(
    path.join(govDir, '01-ai-governance-frameworks.md'),
    `---
title: "AI Governance Frameworks for UK Government"
category: "governance"
sequenceOrder: 1
lastUpdated: "2024-06-01"
---

## Introduction

AI governance in UK government is guided by principles and frameworks.

## Key Principles

Transparency, accountability, fairness, safety, and contestability.
`,
  );

  // security category
  const secDir = path.join(tmpDir, 'security');
  fs.mkdirSync(secDir);
  fs.writeFileSync(
    path.join(secDir, '01-security-guardrails-for-ai.md'),
    `---
title: "Security Guardrails for AI Systems"
category: "security"
sequenceOrder: 1
lastUpdated: "2024-06-01"
---

## Introduction

Deploying AI systems requires robust security guardrails.

## Recommended Controls

Input validation, output filtering, rate limiting, audit logging.
`,
  );

  // data-protection category
  const dpDir = path.join(tmpDir, 'data-protection');
  fs.mkdirSync(dpDir);
  fs.writeFileSync(
    path.join(dpDir, '01-data-protection-and-ai.md'),
    `---
title: "Data Protection and Privacy in AI Systems"
category: "data-protection"
sequenceOrder: 1
lastUpdated: "2024-06-01"
---

## Introduction

Using AI with government data raises data protection considerations.

## Key Considerations

Lawful basis, DPIAs, data minimisation, transparency.
`,
  );

  // Non-markdown file (should be ignored)
  fs.writeFileSync(path.join(govDir, '.gitkeep'), '');

  // Non-directory file at root (should be ignored)
  fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Guardrails');

  return tmpDir;
}

function cleanupDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

describe('splitFrontmatter (guardrails)', () => {
  it('splits YAML frontmatter from body', () => {
    const raw = `---
title: "Test"
category: "governance"
---

## Body`;
    const { frontmatter, body } = splitFrontmatter(raw);
    expect(frontmatter).toContain('title: "Test"');
    expect(body).toContain('## Body');
  });

  it('returns empty frontmatter when no delimiters', () => {
    const { frontmatter, body } = splitFrontmatter('Just text');
    expect(frontmatter).toBe('');
    expect(body).toBe('Just text');
  });
});

describe('parseFrontmatter (guardrails)', () => {
  it('parses key-value pairs', () => {
    const result = parseFrontmatter('title: "Hello"\ncategory: governance');
    expect(result.title).toBe('Hello');
    expect(result.category).toBe('governance');
  });

  it('handles empty input', () => {
    expect(parseFrontmatter('')).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// GuardrailsService
// ---------------------------------------------------------------------------

describe('GuardrailsService', () => {
  let service: GuardrailsService;
  let tmpDir: string;

  beforeEach(() => {
    service = new GuardrailsService();
    tmpDir = createTempGuardrailsDir();
    service.loadTopics(tmpDir);
  });

  afterEach(() => {
    cleanupDir(tmpDir);
  });

  // -----------------------------------------------------------------------
  // loadTopics
  // -----------------------------------------------------------------------

  describe('loadTopics', () => {
    it('loads topics from the file system', () => {
      const topics = service.getTopics();
      expect(topics).toHaveLength(3);
    });

    it('ignores non-markdown files', () => {
      const topics = service.getTopics();
      expect(topics.every((t) => t.title !== '')).toBe(true);
    });

    it('handles non-existent directory gracefully', () => {
      const freshService = new GuardrailsService();
      freshService.loadTopics('/nonexistent/path');
      expect(freshService.getTopics()).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // getTopics
  // -----------------------------------------------------------------------

  describe('getTopics', () => {
    it('returns all loaded topics', () => {
      const topics = service.getTopics();
      expect(topics).toHaveLength(3);
      const titles = topics.map((t) => t.title);
      expect(titles).toContain('AI Governance Frameworks for UK Government');
      expect(titles).toContain('Security Guardrails for AI Systems');
      expect(titles).toContain('Data Protection and Privacy in AI Systems');
    });

    it('returns topics with valid categories', () => {
      const topics = service.getTopics();
      for (const topic of topics) {
        expect(ALL_GUARDRAILS_CATEGORIES).toContain(topic.category);
      }
    });
  });

  // -----------------------------------------------------------------------
  // getTopic
  // -----------------------------------------------------------------------

  describe('getTopic', () => {
    it('returns a topic by ID', () => {
      const topic = service.getTopic('governance/01-ai-governance-frameworks');
      expect(topic.title).toBe('AI Governance Frameworks for UK Government');
      expect(topic.category).toBe('governance');
    });

    it('returns topic with Markdown content', () => {
      const topic = service.getTopic('governance/01-ai-governance-frameworks');
      expect(topic.content).toContain('## Introduction');
      expect(topic.content).toContain('## Key Principles');
    });

    it('returns topic with lastUpdated date', () => {
      const topic = service.getTopic('governance/01-ai-governance-frameworks');
      expect(topic.lastUpdated).toBeInstanceOf(Date);
      expect(topic.lastUpdated.getFullYear()).toBe(2024);
    });

    it('throws for unknown topic ID', () => {
      expect(() => service.getTopic('nonexistent')).toThrow(
        'Guardrails topic not found',
      );
    });
  });

  // -----------------------------------------------------------------------
  // getByCategory
  // -----------------------------------------------------------------------

  describe('getByCategory', () => {
    it('returns topics for governance category', () => {
      const topics = service.getByCategory('governance');
      expect(topics).toHaveLength(1);
      expect(topics[0].category).toBe('governance');
    });

    it('returns topics for security category', () => {
      const topics = service.getByCategory('security');
      expect(topics).toHaveLength(1);
      expect(topics[0].category).toBe('security');
    });

    it('returns topics for data-protection category', () => {
      const topics = service.getByCategory('data-protection');
      expect(topics).toHaveLength(1);
      expect(topics[0].category).toBe('data-protection');
    });

    it('returns empty array for unknown category', () => {
      expect(service.getByCategory('unknown')).toEqual([]);
    });
  });
});
