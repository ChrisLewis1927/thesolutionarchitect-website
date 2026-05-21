import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DatabaseManager } from '../../../src/main/services/database';
import {
  LearningEngine,
  LearningModule,
  ALL_CATEGORIES,
  splitFrontmatter,
  parseFrontmatter,
  parseModuleBody,
} from '../../../src/main/services/learning-engine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a temp directory with sample module Markdown files. */
function createTempModulesDir(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archlens-modules-'));

  // aws-well-architected category — 2 modules
  const awsDir = path.join(tmpDir, 'aws-well-architected');
  fs.mkdirSync(awsDir);

  fs.writeFileSync(
    path.join(awsDir, '01-operational-excellence.md'),
    `---
title: "Operational Excellence Pillar"
category: "aws-well-architected"
sequenceOrder: 1
estimatedMinutes: 10
---

## Introduction

The Operational Excellence pillar focuses on running and monitoring systems.

## Key Principles

Perform operations as code and make frequent, small, reversible changes.

---
keyTakeaways:
  - Automate operational procedures
  - Design for small reversible changes

practicalExamples:
  - Use CloudFormation for infrastructure as code
  - Implement CloudWatch alarms with automated remediation
`,
  );

  fs.writeFileSync(
    path.join(awsDir, '02-security.md'),
    `---
title: "Security Pillar"
category: "aws-well-architected"
sequenceOrder: 2
estimatedMinutes: 12
---

## Introduction

The Security pillar covers protecting data and systems.

## Identity and Access Management

Implement least privilege across all AWS accounts.

---
keyTakeaways:
  - Apply least privilege access
  - Encrypt data at rest and in transit

practicalExamples:
  - Configure AWS Organizations with SCPs
`,
  );

  // gds-service-standard category — 1 module
  const gdsDir = path.join(tmpDir, 'gds-service-standard');
  fs.mkdirSync(gdsDir);

  fs.writeFileSync(
    path.join(gdsDir, '01-understand-users.md'),
    `---
title: "Understanding Users and Their Needs"
category: "gds-service-standard"
sequenceOrder: 1
estimatedMinutes: 8
---

## Introduction

Point 1 of the GDS Service Standard requires understanding users.

## User Research in Architecture

Architecture decisions should be informed by user research.

---
keyTakeaways:
  - Architecture decisions must be traceable to user needs

practicalExamples:
  - Create ADRs that reference user research findings
`,
  );

  // Non-markdown file (should be ignored)
  fs.writeFileSync(path.join(awsDir, '.gitkeep'), '');

  // Non-directory file at root (should be ignored)
  fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Modules');

  return tmpDir;
}

function cleanupDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

describe('splitFrontmatter', () => {
  it('splits YAML frontmatter from body', () => {
    const raw = `---
title: "Test"
---

## Body`;
    const { frontmatter, body } = splitFrontmatter(raw);
    expect(frontmatter).toBe('title: "Test"');
    expect(body).toContain('## Body');
  });

  it('returns empty frontmatter when no delimiters', () => {
    const { frontmatter, body } = splitFrontmatter('Just text');
    expect(frontmatter).toBe('');
    expect(body).toBe('Just text');
  });

  it('returns empty frontmatter when only opening delimiter', () => {
    const { frontmatter, body } = splitFrontmatter('---\ntitle: "Test"\nno closing');
    expect(frontmatter).toBe('');
    expect(body).toBe('---\ntitle: "Test"\nno closing');
  });
});

describe('parseFrontmatter', () => {
  it('parses key-value pairs', () => {
    const result = parseFrontmatter('title: "Hello"\ncategory: aws-well-architected\nsequenceOrder: 1');
    expect(result.title).toBe('Hello');
    expect(result.category).toBe('aws-well-architected');
    expect(result.sequenceOrder).toBe('1');
  });

  it('strips single quotes', () => {
    const result = parseFrontmatter("title: 'Hello World'");
    expect(result.title).toBe('Hello World');
  });

  it('handles empty input', () => {
    expect(parseFrontmatter('')).toEqual({});
  });
});

describe('parseModuleBody', () => {
  it('extracts sections from Markdown headings', () => {
    const body = `## Intro\n\nSome text.\n\n## Details\n\nMore text.\n\n---\nkeyTakeaways:\n  - Item 1\n\npracticalExamples:\n  - Example 1`;
    const content = parseModuleBody(body);
    expect(content.sections).toHaveLength(2);
    expect(content.sections[0].heading).toBe('Intro');
    expect(content.sections[1].heading).toBe('Details');
  });

  it('extracts keyTakeaways and practicalExamples', () => {
    const body = `## Section\n\nText.\n\n---\nkeyTakeaways:\n  - Takeaway 1\n  - Takeaway 2\n\npracticalExamples:\n  - Example A`;
    const content = parseModuleBody(body);
    expect(content.keyTakeaways).toEqual(['Takeaway 1', 'Takeaway 2']);
    expect(content.practicalExamples).toEqual(['Example A']);
  });

  it('handles body with no trailing metadata', () => {
    const body = '## Only Section\n\nJust content.';
    const content = parseModuleBody(body);
    expect(content.sections).toHaveLength(1);
    expect(content.keyTakeaways).toEqual([]);
    expect(content.practicalExamples).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// LearningEngine
// ---------------------------------------------------------------------------

describe('LearningEngine', () => {
  let dbManager: DatabaseManager;
  let engine: LearningEngine;
  let tmpDir: string;

  beforeEach(() => {
    dbManager = new DatabaseManager(':memory:');
    dbManager.initialise();
    engine = new LearningEngine(dbManager.getDatabase());
    tmpDir = createTempModulesDir();
    engine.loadModules(tmpDir);
  });

  afterEach(() => {
    dbManager.close();
    cleanupDir(tmpDir);
  });

  // -----------------------------------------------------------------------
  // getCategories
  // -----------------------------------------------------------------------

  describe('getCategories', () => {
    it('returns all defined learning categories', () => {
      const categories = engine.getCategories();
      expect(categories).toEqual(ALL_CATEGORIES);
      expect(categories).toContain('aws-well-architected');
      expect(categories).toContain('gds-service-standard');
    });
  });

  // -----------------------------------------------------------------------
  // loadModules
  // -----------------------------------------------------------------------

  describe('loadModules', () => {
    it('loads modules from the file system', () => {
      const awsModules = engine.getModules('aws-well-architected');
      expect(awsModules).toHaveLength(2);
    });

    it('ignores non-markdown files', () => {
      // .gitkeep should not be loaded
      const awsModules = engine.getModules('aws-well-architected');
      expect(awsModules.every((m) => m.title !== '')).toBe(true);
    });

    it('handles non-existent directory gracefully', () => {
      const freshEngine = new LearningEngine(dbManager.getDatabase());
      freshEngine.loadModules('/nonexistent/path');
      expect(freshEngine.getModules('aws-well-architected')).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // getModules — ordering
  // -----------------------------------------------------------------------

  describe('getModules', () => {
    it('returns modules ordered by sequenceOrder', () => {
      const modules = engine.getModules('aws-well-architected');
      expect(modules[0].sequenceOrder).toBe(1);
      expect(modules[1].sequenceOrder).toBe(2);
      expect(modules[0].title).toBe('Operational Excellence Pillar');
      expect(modules[1].title).toBe('Security Pillar');
    });

    it('returns empty array for category with no modules', () => {
      expect(engine.getModules('togaf')).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // getModule
  // -----------------------------------------------------------------------

  describe('getModule', () => {
    it('returns a module by ID', () => {
      const mod = engine.getModule('aws-well-architected/01-operational-excellence');
      expect(mod.title).toBe('Operational Excellence Pillar');
      expect(mod.category).toBe('aws-well-architected');
      expect(mod.estimatedMinutes).toBe(10);
    });

    it('returns parsed content with sections', () => {
      const mod = engine.getModule('aws-well-architected/01-operational-excellence');
      expect(mod.content.sections.length).toBeGreaterThan(0);
      expect(mod.content.sections[0].heading).toBe('Introduction');
    });

    it('returns parsed keyTakeaways and practicalExamples', () => {
      const mod = engine.getModule('aws-well-architected/01-operational-excellence');
      expect(mod.content.keyTakeaways.length).toBeGreaterThan(0);
      expect(mod.content.practicalExamples.length).toBeGreaterThan(0);
    });

    it('throws for unknown module ID', () => {
      expect(() => engine.getModule('nonexistent')).toThrow('Learning module not found');
    });
  });

  // -----------------------------------------------------------------------
  // completeModule
  // -----------------------------------------------------------------------

  describe('completeModule', () => {
    it('records a completion in the database', () => {
      engine.completeModule('user-1', 'aws-well-architected/01-operational-excellence');

      const row = dbManager.getDatabase()
        .prepare("SELECT * FROM module_completions WHERE module_id = ? AND module_type = 'learning'")
        .get('aws-well-architected/01-operational-excellence') as { module_id: string; module_type: string; completed_at: string } | undefined;

      expect(row).toBeDefined();
      expect(row!.module_type).toBe('learning');
      expect(row!.completed_at).toBeTruthy();
    });

    it('updates completion timestamp on re-completion', () => {
      engine.completeModule('user-1', 'aws-well-architected/01-operational-excellence');
      const first = dbManager.getDatabase()
        .prepare("SELECT completed_at FROM module_completions WHERE module_id = ? AND module_type = 'learning'")
        .get('aws-well-architected/01-operational-excellence') as { completed_at: string };

      // Re-complete
      engine.completeModule('user-1', 'aws-well-architected/01-operational-excellence');
      const second = dbManager.getDatabase()
        .prepare("SELECT completed_at FROM module_completions WHERE module_id = ? AND module_type = 'learning'")
        .get('aws-well-architected/01-operational-excellence') as { completed_at: string };

      // Should not throw (UNIQUE constraint handled by ON CONFLICT)
      expect(second.completed_at).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // getNextRecommended
  // -----------------------------------------------------------------------

  describe('getNextRecommended', () => {
    it('returns the first module when nothing is completed', () => {
      const next = engine.getNextRecommended('user-1', 'aws-well-architected');
      expect(next).not.toBeNull();
      expect(next!.sequenceOrder).toBe(1);
    });

    it('returns the next uncompleted module in sequence', () => {
      engine.completeModule('user-1', 'aws-well-architected/01-operational-excellence');
      const next = engine.getNextRecommended('user-1', 'aws-well-architected');
      expect(next).not.toBeNull();
      expect(next!.sequenceOrder).toBe(2);
      expect(next!.title).toBe('Security Pillar');
    });

    it('returns null when all modules in category are completed', () => {
      engine.completeModule('user-1', 'aws-well-architected/01-operational-excellence');
      engine.completeModule('user-1', 'aws-well-architected/02-security');
      const next = engine.getNextRecommended('user-1', 'aws-well-architected');
      expect(next).toBeNull();
    });

    it('returns null for category with no modules', () => {
      const next = engine.getNextRecommended('user-1', 'togaf');
      expect(next).toBeNull();
    });
  });
});
