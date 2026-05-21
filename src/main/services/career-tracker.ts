// ArchLens — Career Tracker
// Implemented in Task 9.1

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Certification {
  id: string;
  name: string;
  provider: string;
  dateEarned: Date;
  expiryDate?: Date;
}

export type DDATLevel = 'awareness' | 'working' | 'practitioner' | 'expert';

export const DDAT_LEVEL_ORDER: Record<DDATLevel, number> = {
  awareness: 0,
  working: 1,
  practitioner: 2,
  expert: 3,
};

export interface SkillGap {
  capability: string;
  currentLevel: DDATLevel;
  targetLevel: DDATLevel;
  recommendations: Recommendation[];
}

export interface Recommendation {
  type: 'certification' | 'course' | 'learning-path';
  title: string;
  provider: string;
  url?: string;
  relevantCapability: string;
}

export interface CapabilityCoverage {
  capabilities: Array<{
    name: string;
    currentLevel: DDATLevel;
    targetLevel: DDATLevel;
    coveragePercent: number;
  }>;
  overallCoveragePercent: number;
}

// ---------------------------------------------------------------------------
// DDAT capability data types (loaded from capabilities.json)
// ---------------------------------------------------------------------------

export interface DDATCapability {
  name: string;
  description: string;
  requiredLevel: DDATLevel;
}

export interface DDATCertificationMapping {
  certificationPattern: string;
  capabilities: string[];
  levelGranted: DDATLevel;
}

export interface DDATRole {
  title: string;
  capabilities: DDATCapability[];
  certificationMappings: DDATCertificationMapping[];
}

export interface DDATData {
  roles: Record<string, DDATRole>;
}

// ---------------------------------------------------------------------------
// CareerTracker
// ---------------------------------------------------------------------------

export class CareerTracker {
  private db: Database.Database;
  private ddatData: DDATData | null = null;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Loads DDAT capability definitions from a JSON file.
   */
  loadDDATData(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      this.ddatData = { roles: {} };
      return;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    this.ddatData = JSON.parse(raw) as DDATData;
  }

  /**
   * Loads DDAT data directly from a parsed object (useful for testing).
   */
  loadDDATDataFromObject(data: DDATData): void {
    this.ddatData = data;
  }

  /**
   * Adds a certification to the database.
   */
  addCertification(cert: Certification): void {
    this.db
      .prepare(
        `INSERT INTO certifications (id, name, provider, date_earned, expiry_date, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           provider = excluded.provider,
           date_earned = excluded.date_earned,
           expiry_date = excluded.expiry_date`,
      )
      .run(
        cert.id,
        cert.name,
        cert.provider,
        cert.dateEarned.toISOString(),
        cert.expiryDate ? cert.expiryDate.toISOString() : null,
      );
  }

  /**
   * Removes a certification by ID.
   */
  removeCertification(id: string): void {
    this.db.prepare('DELETE FROM certifications WHERE id = ?').run(id);
  }

  /**
   * Returns all stored certifications.
   */
  getCertifications(): Certification[] {
    const rows = this.db
      .prepare('SELECT id, name, provider, date_earned, expiry_date FROM certifications ORDER BY date_earned DESC')
      .all() as Array<{
        id: string;
        name: string;
        provider: string;
        date_earned: string;
        expiry_date: string | null;
      }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      provider: row.provider,
      dateEarned: new Date(row.date_earned),
      expiryDate: row.expiry_date ? new Date(row.expiry_date) : undefined,
    }));
  }

  /**
   * Analyses gaps between the user's current certifications and the target
   * role's DDAT capability requirements. Returns only genuine gaps where
   * currentLevel < targetLevel.
   */
  analyseGaps(targetRole: string): SkillGap[] {
    const role = this.getRole(targetRole);
    if (!role) return [];

    const certifications = this.getCertifications();
    const currentLevels = this.computeCurrentLevels(certifications, role);
    const gaps: SkillGap[] = [];

    for (const capability of role.capabilities) {
      const currentLevel = currentLevels.get(capability.name) ?? 'awareness';
      const targetLevel = capability.requiredLevel;

      if (DDAT_LEVEL_ORDER[currentLevel] < DDAT_LEVEL_ORDER[targetLevel]) {
        gaps.push({
          capability: capability.name,
          currentLevel,
          targetLevel,
          recommendations: this.buildRecommendations(capability.name, currentLevel, targetLevel, role),
        });
      }
    }

    return gaps;
  }

  /**
   * Returns recommendations for all gaps against the target role.
   */
  getRecommendations(targetRole: string): Recommendation[] {
    const gaps = this.analyseGaps(targetRole);
    const recommendations: Recommendation[] = [];
    for (const gap of gaps) {
      recommendations.push(...gap.recommendations);
    }
    return recommendations;
  }

  /**
   * Computes capability coverage percentages for the target role.
   * Each capability's coverage is (currentLevelOrder / targetLevelOrder) * 100,
   * capped at 100%. Overall coverage is the arithmetic mean.
   */
  getCapabilityCoverage(targetRole: string): CapabilityCoverage {
    const role = this.getRole(targetRole);
    if (!role) {
      return { capabilities: [], overallCoveragePercent: 0 };
    }

    const certifications = this.getCertifications();
    const currentLevels = this.computeCurrentLevels(certifications, role);

    const capabilities = role.capabilities.map((cap) => {
      const currentLevel = currentLevels.get(cap.name) ?? 'awareness';
      const targetLevel = cap.requiredLevel;
      const currentOrder = DDAT_LEVEL_ORDER[currentLevel];
      const targetOrder = DDAT_LEVEL_ORDER[targetLevel];

      const coveragePercent =
        targetOrder === 0 ? 100 : Math.min(100, (currentOrder / targetOrder) * 100);

      return {
        name: cap.name,
        currentLevel,
        targetLevel,
        coveragePercent: Math.round(coveragePercent * 100) / 100,
      };
    });

    const overallCoveragePercent =
      capabilities.length === 0
        ? 0
        : Math.round(
            (capabilities.reduce((sum, c) => sum + c.coveragePercent, 0) / capabilities.length) *
              100,
          ) / 100;

    return { capabilities, overallCoveragePercent };
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private getRole(targetRole: string): DDATRole | null {
    if (!this.ddatData) return null;
    return this.ddatData.roles[targetRole] ?? null;
  }

  /**
   * Computes the highest DDAT level achieved for each capability based on
   * the user's certifications and the role's certification mappings.
   */
  private computeCurrentLevels(
    certifications: Certification[],
    role: DDATRole,
  ): Map<string, DDATLevel> {
    const levels = new Map<string, DDATLevel>();

    for (const cert of certifications) {
      for (const mapping of role.certificationMappings) {
        if (this.certMatchesPattern(cert.name, mapping.certificationPattern)) {
          for (const capName of mapping.capabilities) {
            const existing = levels.get(capName);
            if (
              !existing ||
              DDAT_LEVEL_ORDER[mapping.levelGranted] > DDAT_LEVEL_ORDER[existing]
            ) {
              levels.set(capName, mapping.levelGranted);
            }
          }
        }
      }
    }

    return levels;
  }

  /**
   * Checks if a certification name matches a DDAT certification pattern
   * (case-insensitive substring match).
   */
  private certMatchesPattern(certName: string, pattern: string): boolean {
    return certName.toLowerCase().includes(pattern.toLowerCase());
  }

  /**
   * Builds recommendations for a capability gap based on the role's
   * certification mappings.
   */
  private buildRecommendations(
    capabilityName: string,
    currentLevel: DDATLevel,
    targetLevel: DDATLevel,
    role: DDATRole,
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Find certification mappings that cover this capability and grant a level
    // higher than the current level
    for (const mapping of role.certificationMappings) {
      if (
        mapping.capabilities.includes(capabilityName) &&
        DDAT_LEVEL_ORDER[mapping.levelGranted] > DDAT_LEVEL_ORDER[currentLevel]
      ) {
        recommendations.push({
          type: 'certification',
          title: mapping.certificationPattern,
          provider: this.inferProvider(mapping.certificationPattern),
          relevantCapability: capabilityName,
        });
      }
    }

    // If no certification recommendations found, add a generic learning-path
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'learning-path',
        title: `${capabilityName} — ${targetLevel} level development`,
        provider: 'DDAT Framework',
        relevantCapability: capabilityName,
      });
    }

    return recommendations;
  }

  /**
   * Infers a provider name from a certification pattern string.
   */
  private inferProvider(pattern: string): string {
    const lower = pattern.toLowerCase();
    if (lower.includes('aws')) return 'Amazon Web Services';
    if (lower.includes('azure')) return 'Microsoft';
    if (lower.includes('google cloud')) return 'Google';
    if (lower.includes('togaf')) return 'The Open Group';
    if (lower.includes('cissp')) return 'ISC2';
    if (lower.includes('security+')) return 'CompTIA';
    return 'Various';
  }
}
