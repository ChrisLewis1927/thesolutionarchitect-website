// ArchLens — Guardrails Knowledge Base Service
// Implemented in Task 13.1

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GuardrailsCategory = 'governance' | 'security' | 'data-protection';

export const ALL_GUARDRAILS_CATEGORIES: GuardrailsCategory[] = [
  'governance',
  'security',
  'data-protection',
];

export interface GuardrailsTopic {
  id: string;
  title: string;
  category: GuardrailsCategory;
  content: string;
  lastUpdated: Date;
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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

// ---------------------------------------------------------------------------
// GuardrailsService
// ---------------------------------------------------------------------------

export class GuardrailsService {
  private topics: Map<string, GuardrailsTopic> = new Map();
  private categoryIndex: Map<GuardrailsCategory, GuardrailsTopic[]> = new Map();

  /**
   * Loads and parses all Markdown guardrails content from the given directory.
   * Expects subdirectories named after categories (governance, security, data-protection).
   */
  loadTopics(guardrailsDir: string): void {
    this.topics.clear();
    this.categoryIndex.clear();

    if (!fs.existsSync(guardrailsDir)) return;

    const categoryDirs = fs.readdirSync(guardrailsDir, { withFileTypes: true });

    for (const entry of categoryDirs) {
      if (!entry.isDirectory()) continue;

      const categoryPath = path.join(guardrailsDir, entry.name);
      const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const topic = this.parseTopicFile(raw, file, entry.name);
        if (topic) {
          this.topics.set(topic.id, topic);
        }
      }
    }

    // Build category index
    for (const topic of this.topics.values()) {
      const list = this.categoryIndex.get(topic.category) ?? [];
      list.push(topic);
      this.categoryIndex.set(topic.category, list);
    }
  }

  /**
   * Returns all guardrails topics.
   */
  getTopics(): GuardrailsTopic[] {
    return Array.from(this.topics.values());
  }

  /**
   * Returns a single topic by ID.
   * @throws Error if the topic is not found.
   */
  getTopic(id: string): GuardrailsTopic {
    const topic = this.topics.get(id);
    if (!topic) {
      throw new Error(`Guardrails topic not found: ${id}`);
    }
    return topic;
  }

  /**
   * Returns all topics for a given category.
   */
  getByCategory(category: string): GuardrailsTopic[] {
    return this.categoryIndex.get(category as GuardrailsCategory) ?? [];
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /** Parses a single Markdown file into a GuardrailsTopic. */
  private parseTopicFile(
    raw: string,
    filename: string,
    dirName: string,
  ): GuardrailsTopic | null {
    const { frontmatter, body } = splitFrontmatter(raw);
    if (!frontmatter) return null;

    const meta = parseFrontmatter(frontmatter);
    if (!meta.title || !meta.category) return null;

    const category = meta.category as GuardrailsCategory;
    if (!ALL_GUARDRAILS_CATEGORIES.includes(category)) return null;

    const id = `${dirName}/${filename.replace(/\.md$/, '')}`;

    return {
      id,
      title: meta.title,
      category,
      content: body,
      lastUpdated: meta.lastUpdated ? new Date(meta.lastUpdated) : new Date(),
    };
  }
}
