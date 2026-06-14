// Architecture Design Lab — Standards Service
// Implements: Requirements 9.1, 9.2, 9.3, 9.4

import { randomUUID } from 'crypto';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type Database from 'better-sqlite3';
import type {
  StandardsService as IStandardsService,
  Standard,
  StandardReviewStatus,
  ArchitectureDomain,
} from './types';

// ---------------------------------------------------------------------------
// Standards Service Implementation
// ---------------------------------------------------------------------------

export class StandardsServiceImpl implements IStandardsService {
  private db: Database.Database;
  private contentPath: string;
  private standards: Standard[] = [];
  private loaded = false;

  constructor(db: Database.Database, contentPath: string) {
    this.db = db;
    this.contentPath = contentPath;
  }

  /**
   * Returns standards applicable to the given architecture domains.
   */
  getApplicableStandards(domains: ArchitectureDomain[]): Standard[] {
    this.ensureLoaded();
    return this.standards.filter((s) =>
      s.applicableDomains.some((d) => domains.includes(d)),
    );
  }

  /**
   * Returns all standards in the library.
   */
  getAllStandards(): Standard[] {
    this.ensureLoaded();
    return [...this.standards];
  }

  /**
   * Returns standards relevant to a specific domain.
   */
  getRelevantForDomain(domain: ArchitectureDomain): Standard[] {
    this.ensureLoaded();
    return this.standards.filter((s) => s.applicableDomains.includes(domain));
  }

  /**
   * Sets the review status for a standard within an assessment.
   */
  setReviewStatus(
    assessmentId: string,
    standardId: string,
    status: StandardReviewStatus['status'],
    note?: string,
  ): void {
    const existing = this.db.prepare(
      'SELECT id FROM design_lab_standard_reviews WHERE assessment_id = ? AND standard_id = ?',
    ).get(assessmentId, standardId) as { id: string } | undefined;

    if (existing) {
      this.db.prepare(`
        UPDATE design_lab_standard_reviews
        SET status = ?, note = ?, reviewed_at = datetime('now')
        WHERE id = ?
      `).run(status, note ?? null, existing.id);
    } else {
      this.db.prepare(`
        INSERT INTO design_lab_standard_reviews (id, assessment_id, standard_id, status, note, reviewed_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(randomUUID(), assessmentId, standardId, status, note ?? null);
    }
  }

  /**
   * Returns all review statuses for an assessment.
   */
  getReviewStatuses(assessmentId: string): StandardReviewStatus[] {
    const rows = this.db.prepare(
      'SELECT * FROM design_lab_standard_reviews WHERE assessment_id = ?',
    ).all(assessmentId) as Array<{
      standard_id: string;
      assessment_id: string;
      status: StandardReviewStatus['status'];
      note: string | null;
      reviewed_at: string | null;
    }>;

    return rows.map((row) => ({
      standardId: row.standard_id,
      assessmentId: row.assessment_id,
      status: row.status,
      note: row.note ?? undefined,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    }));
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private ensureLoaded(): void {
    if (this.loaded) return;

    try {
      const standardsDir = join(this.contentPath, 'standards');
      const files = readdirSync(standardsDir).filter((f) => f.endsWith('.json'));

      for (const file of files) {
        const content = readFileSync(join(standardsDir, file), 'utf-8');
        const standard = JSON.parse(content) as Standard;
        this.standards.push(standard);
      }

      this.loaded = true;
    } catch {
      this.loaded = true;
    }
  }
}
