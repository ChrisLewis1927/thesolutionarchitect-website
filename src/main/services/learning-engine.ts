// ArchLens — Learning Module Engine
// Implemented in Task 8.1

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LearningCategory =
  | 'aws-well-architected'
  | 'azure-well-architected'
  | 'togaf'
  | 'gds-service-standard'
  | 'secure-by-design'
  | 'zero-trust'
  | 'enterprise-architecture'
  | 'solution-architecture';

export const ALL_CATEGORIES: LearningCategory[] = [
  'aws-well-architected',
  'azure-well-architected',
  'togaf',
  'gds-service-standard',
  'secure-by-design',
  'zero-trust',
  'enterprise-architecture',
  'solution-architecture',
];

export interface ContentSection {
  heading: string;
  body: string;
}

export interface ModuleContent {
  sections: ContentSection[];
  keyTakeaways: string[];
  practicalExamples: string[];
}

export interface LearningModule {
  id: string;
  title: string;
  category: LearningCategory;
  sequenceOrder: number;
  estimatedMinutes: number;
  content: ModuleContent;
}

// ---------------------------------------------------------------------------
// Markdown parsing helpers
// ---------------------------------------------------------------------------

/** Splits YAML frontmatter from the body of a Markdown file. */
export function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith('---')) {
    return { frontmatter: '', body: raw };
  }
  const end = trimmed.indexOf('---', 3);
  if (end === -1) {
    return { frontmatter: '', body: raw };
  }
  return {
    frontmatter: trimmed.slice(3, end).trim(),
    body: trimmed.slice(end + 3).trim(),
  };
}

/** Minimal YAML key-value parser for flat frontmatter. */
export function parseFrontmatter(yaml: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of yaml.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

/** Parses the Markdown body into sections, keyTakeaways, and practicalExamples. */
export function parseModuleBody(body: string): ModuleContent {
  // Split at the trailing YAML-like block (--- followed by keyTakeaways/practicalExamples)
  const trailingSeparator = body.lastIndexOf('\n---');
  let markdownPart: string;
  let trailingPart: string;

  if (trailingSeparator !== -1) {
    markdownPart = body.slice(0, trailingSeparator).trim();
    trailingPart = body.slice(trailingSeparator + 4).trim();
  } else {
    markdownPart = body.trim();
    trailingPart = '';
  }

  // Parse sections from Markdown headings (## level)
  const sections: ContentSection[] = [];
  const headingRegex = /^## (.+)$/gm;
  const headings: Array<{ heading: string; index: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(markdownPart)) !== null) {
    headings.push({ heading: match[1].trim(), index: match.index });
  }

  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index + headings[i].heading.length + 3; // "## " + heading + newline
    const end = i + 1 < headings.length ? headings[i + 1].index : markdownPart.length;
    const sectionBody = markdownPart.slice(start, end).trim();
    sections.push({ heading: headings[i].heading, body: sectionBody });
  }

  // Parse keyTakeaways and practicalExamples from trailing block
  const keyTakeaways = parseYamlList(trailingPart, 'keyTakeaways');
  const practicalExamples = parseYamlList(trailingPart, 'practicalExamples');

  return { sections, keyTakeaways, practicalExamples };
}

/** Extracts a YAML-style list from a block of text. */
function parseYamlList(text: string, key: string): string[] {
  const items: string[] = [];
  const keyPattern = new RegExp(`^${key}:\\s*$`, 'm');
  const keyMatch = keyPattern.exec(text);
  if (!keyMatch) return items;

  const afterKey = text.slice(keyMatch.index + keyMatch[0].length);
  for (const line of afterKey.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      items.push(trimmed.slice(2).trim());
    } else if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    } else if (!trimmed.startsWith('-')) {
      // Hit the next key or non-list content
      break;
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// LearningEngine
// ---------------------------------------------------------------------------

export class LearningEngine {
  private db: Database.Database;
  private modules: Map<string, LearningModule> = new Map();
  private categoryIndex: Map<LearningCategory, LearningModule[]> = new Map();

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Loads and parses all Markdown modules from the given directory.
   * Indexes them by category and sequence order.
   */
  loadModules(modulesDir: string): void {
    this.modules.clear();
    this.categoryIndex.clear();

    if (!fs.existsSync(modulesDir)) return;

    const categoryDirs = fs.readdirSync(modulesDir, { withFileTypes: true });

    for (const entry of categoryDirs) {
      if (!entry.isDirectory()) continue;

      const categoryPath = path.join(modulesDir, entry.name);
      const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const mod = this.parseModuleFile(raw, file);
        if (mod) {
          this.modules.set(mod.id, mod);
        }
      }
    }

    // Build category index sorted by sequenceOrder
    for (const mod of this.modules.values()) {
      const list = this.categoryIndex.get(mod.category) ?? [];
      list.push(mod);
      this.categoryIndex.set(mod.category, list);
    }

    for (const list of this.categoryIndex.values()) {
      list.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    }
  }

  /**
   * Returns all available learning categories.
   */
  getCategories(): LearningCategory[] {
    return ALL_CATEGORIES;
  }

  /**
   * Returns modules for a given category, ordered by sequence.
   */
  getModules(category: LearningCategory): LearningModule[] {
    return this.categoryIndex.get(category) ?? [];
  }

  /**
   * Returns a single module by ID.
   * @throws Error if the module is not found.
   */
  getModule(id: string): LearningModule {
    const mod = this.modules.get(id);
    if (!mod) {
      throw new Error(`Learning module not found: ${id}`);
    }
    return mod;
  }

  /**
   * Records a module completion in the database.
   */
  completeModule(userId: string, moduleId: string): void {
    const id = crypto.randomUUID();
    this.db
      .prepare(
        `INSERT INTO module_completions (id, module_id, module_type, completed_at)
         VALUES (?, ?, 'learning', datetime('now'))
         ON CONFLICT(module_id, module_type) DO UPDATE SET completed_at = datetime('now')`,
      )
      .run(id, moduleId);
  }

  /**
   * Returns the next recommended module in the sequence for a given category,
   * based on the user's completions. Returns null if all modules are completed.
   */
  getNextRecommended(userId: string, category: LearningCategory): LearningModule | null {
    const modules = this.getModules(category);
    if (modules.length === 0) return null;

    const completedIds = this.getCompletedModuleIds();

    for (const mod of modules) {
      if (!completedIds.has(mod.id)) {
        return mod;
      }
    }

    return null;
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /** Returns the set of completed learning module IDs. */
  private getCompletedModuleIds(): Set<string> {
    const rows = this.db
      .prepare(
        `SELECT module_id FROM module_completions WHERE module_type = 'learning'`,
      )
      .all() as Array<{ module_id: string }>;

    return new Set(rows.map((r) => r.module_id));
  }

  /** Parses a single Markdown file into a LearningModule. */
  private parseModuleFile(raw: string, filename: string): LearningModule | null {
    const { frontmatter, body } = splitFrontmatter(raw);
    if (!frontmatter) return null;

    const meta = parseFrontmatter(frontmatter);
    if (!meta.title || !meta.category || !meta.sequenceOrder) return null;

    const category = meta.category as LearningCategory;
    if (!ALL_CATEGORIES.includes(category)) return null;

    const content = parseModuleBody(body);

    // Generate a stable ID from category + filename
    const id = `${category}/${filename.replace(/\.md$/, '')}`;

    return {
      id,
      title: meta.title,
      category,
      sequenceOrder: parseInt(meta.sequenceOrder, 10),
      estimatedMinutes: parseInt(meta.estimatedMinutes ?? '10', 10),
      content,
    };
  }
}
