// Architecture Design Lab — Pattern Library Service
// Implements: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type {
  PatternLibraryService as IPatternLibraryService,
  PatternEntry,
  PatternSearchResult,
  PatternFilter,
} from './types';
import { ContentNotFoundError } from './types';

// ---------------------------------------------------------------------------
// Pattern Library Service Implementation
// ---------------------------------------------------------------------------

export class PatternLibraryServiceImpl implements IPatternLibraryService {
  private patterns: PatternEntry[] = [];
  private contentPath: string;
  private loaded = false;

  constructor(contentPath: string) {
    this.contentPath = contentPath;
  }

  /**
   * Searches patterns by query string with relevance scoring.
   */
  search(query: string, filter?: PatternFilter): PatternSearchResult[] {
    this.ensureLoaded();
    const normalised = query.toLowerCase().trim();

    if (!normalised) {
      const filtered = filter ? this.applyFilter(this.patterns, filter) : this.patterns;
      return filtered.map((p) => ({ pattern: p, relevanceScore: 50, matchedOn: ['all'] }));
    }

    const results: PatternSearchResult[] = [];

    for (const pattern of this.patterns) {
      const matchedOn: string[] = [];
      let score = 0;

      // Match on name (highest weight)
      if (pattern.name.toLowerCase().includes(normalised)) {
        score += 100;
        matchedOn.push('name');
      }

      // Match on description
      if (pattern.description.toLowerCase().includes(normalised)) {
        score += 60;
        matchedOn.push('description');
      }

      // Match on component keywords
      const componentMatch = pattern.typicalComponents.some(
        (c) => c.name.toLowerCase().includes(normalised) || c.purpose.toLowerCase().includes(normalised),
      );
      if (componentMatch) {
        score += 40;
        matchedOn.push('components');
      }

      // Match on workload types
      if (pattern.workloadTypes.some((w) => w.toLowerCase().includes(normalised))) {
        score += 30;
        matchedOn.push('workloadType');
      }

      if (score > 0) {
        results.push({ pattern, relevanceScore: score, matchedOn });
      }
    }

    // Apply filter if provided
    const filtered = filter
      ? results.filter((r) => this.matchesFilter(r.pattern, filter))
      : results;

    return filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Retrieves a single pattern by ID.
   */
  getPattern(id: string): PatternEntry {
    this.ensureLoaded();
    const pattern = this.patterns.find((p) => p.id === id);
    if (!pattern) {
      throw new ContentNotFoundError('pattern', id);
    }
    return pattern;
  }

  /**
   * Returns all patterns in the library.
   */
  getAllPatterns(): PatternEntry[] {
    this.ensureLoaded();
    return [...this.patterns];
  }

  /**
   * Returns patterns matching the given filter criteria.
   */
  getPatternsByFilter(filter: PatternFilter): PatternEntry[] {
    this.ensureLoaded();
    return this.applyFilter(this.patterns, filter);
  }

  /**
   * Returns suggested patterns when no exact match is found.
   */
  getSuggestions(query: string): PatternEntry[] {
    this.ensureLoaded();
    const normalised = query.toLowerCase().trim();

    // Return patterns that partially match any word in the query
    const words = normalised.split(/\s+/);
    const scored = this.patterns.map((pattern) => {
      const text = `${pattern.name} ${pattern.description} ${pattern.workloadTypes.join(' ')}`.toLowerCase();
      const matchCount = words.filter((w) => text.includes(w)).length;
      return { pattern, matchCount };
    });

    return scored
      .filter((s) => s.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 5)
      .map((s) => s.pattern);
  }

  /**
   * Returns a pattern with cloud services highlighted for the given platforms.
   */
  highlightForPlatforms(patternId: string, platforms: string[]): PatternEntry {
    const pattern = this.getPattern(patternId);

    // Reorder cloud service examples to put matching platforms first
    const highlighted = { ...pattern };
    highlighted.cloudServiceExamples = [
      ...pattern.cloudServiceExamples.filter((e) => platforms.includes(e.platform)),
      ...pattern.cloudServiceExamples.filter((e) => !platforms.includes(e.platform)),
    ];

    return highlighted;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private ensureLoaded(): void {
    if (this.loaded) return;

    try {
      const patternsDir = join(this.contentPath, 'patterns');
      const files = readdirSync(patternsDir).filter((f) => f.endsWith('.json'));

      for (const file of files) {
        const content = readFileSync(join(patternsDir, file), 'utf-8');
        const pattern = JSON.parse(content) as PatternEntry;
        this.patterns.push(pattern);
      }

      this.loaded = true;
    } catch {
      // If content directory doesn't exist, start with empty library
      this.loaded = true;
    }
  }

  private applyFilter(patterns: PatternEntry[], filter: PatternFilter): PatternEntry[] {
    return patterns.filter((p) => this.matchesFilter(p, filter));
  }

  private matchesFilter(pattern: PatternEntry, filter: PatternFilter): boolean {
    if (filter.cloudProvider) {
      const hasProvider = pattern.cloudServiceExamples.some(
        (e) => e.platform === filter.cloudProvider,
      );
      if (!hasProvider) return false;
    }

    if (filter.workloadType) {
      const hasWorkload = pattern.workloadTypes.some(
        (w) => w.toLowerCase().includes(filter.workloadType!.toLowerCase()),
      );
      if (!hasWorkload) return false;
    }

    if (filter.securityClassification) {
      const hasClassification = pattern.securityClassifications.some(
        (c) => c.toLowerCase() === filter.securityClassification!.toLowerCase(),
      );
      if (!hasClassification) return false;
    }

    return true;
  }
}
