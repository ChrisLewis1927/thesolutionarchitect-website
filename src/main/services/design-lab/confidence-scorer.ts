// Architecture Design Lab — Confidence Scorer
// Implements: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7

import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import type {
  ConfidenceScorer as IConfidenceScorer,
  AssessmentResult,
  ScenarioIntake,
  ConfidenceSummary,
  ConfidenceScore,
  ArchitectureDomain,
  RAGStatus,
  DomainAssessment,
} from './types';

// ---------------------------------------------------------------------------
// Confidence Scorer Implementation
// ---------------------------------------------------------------------------

export class ConfidenceScorerImpl implements IConfidenceScorer {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Scores all domains in an assessment and produces a confidence summary.
   */
  score(assessment: AssessmentResult, scenario: ScenarioIntake): ConfidenceSummary {
    const scores: ConfidenceScore[] = [];

    for (const domainAssessment of assessment.domains) {
      const score = this.scoreDomain(domainAssessment, scenario, assessment);
      scores.push(score);

      // Persist individual score
      this.db.prepare(`
        INSERT OR REPLACE INTO design_lab_confidence
          (id, assessment_id, domain, status, rationale, gaps_json, improvement_actions_json, scored_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        randomUUID(),
        assessment.id,
        score.domain,
        score.status,
        score.rationale,
        JSON.stringify(score.gaps),
        JSON.stringify(score.improvementActions),
      );
    }

    const summary: ConfidenceSummary = {
      assessmentId: assessment.id,
      scores,
      overallMaturity: this.calculateMaturity(scores),
      greenCount: scores.filter((s) => s.status === 'green').length,
      amberCount: scores.filter((s) => s.status === 'amber').length,
      redCount: scores.filter((s) => s.status === 'red').length,
      greyCount: scores.filter((s) => s.status === 'grey').length,
      naCount: scores.filter((s) => s.status === 'na').length,
    };

    return summary;
  }

  /**
   * Retrieves a single domain's confidence score from storage.
   */
  getScore(assessmentId: string, domain: ArchitectureDomain): ConfidenceScore {
    const row = this.db.prepare(
      'SELECT * FROM design_lab_confidence WHERE assessment_id = ? AND domain = ?',
    ).get(assessmentId, domain) as {
      domain: string;
      status: RAGStatus;
      rationale: string;
      gaps_json: string;
      improvement_actions_json: string;
    } | undefined;

    if (!row) {
      throw new Error(`Confidence score not found for ${domain} in assessment ${assessmentId}`);
    }

    return {
      domain: row.domain as ArchitectureDomain,
      status: row.status,
      rationale: row.rationale,
      gaps: JSON.parse(row.gaps_json),
      improvementActions: JSON.parse(row.improvement_actions_json),
    };
  }

  /**
   * Retrieves the full confidence summary for an assessment.
   */
  getSummary(assessmentId: string): ConfidenceSummary {
    const rows = this.db.prepare(
      'SELECT * FROM design_lab_confidence WHERE assessment_id = ? ORDER BY domain',
    ).all(assessmentId) as Array<{
      domain: string;
      status: RAGStatus;
      rationale: string;
      gaps_json: string;
      improvement_actions_json: string;
    }>;

    const scores: ConfidenceScore[] = rows.map((row) => ({
      domain: row.domain as ArchitectureDomain,
      status: row.status,
      rationale: row.rationale,
      gaps: JSON.parse(row.gaps_json),
      improvementActions: JSON.parse(row.improvement_actions_json),
    }));

    return {
      assessmentId,
      scores,
      overallMaturity: this.calculateMaturity(scores),
      greenCount: scores.filter((s) => s.status === 'green').length,
      amberCount: scores.filter((s) => s.status === 'amber').length,
      redCount: scores.filter((s) => s.status === 'red').length,
      greyCount: scores.filter((s) => s.status === 'grey').length,
      naCount: scores.filter((s) => s.status === 'na').length,
    };
  }

  // -------------------------------------------------------------------------
  // Private: Scoring logic
  // -------------------------------------------------------------------------

  private scoreDomain(
    domainAssessment: DomainAssessment,
    scenario: ScenarioIntake,
    assessment: AssessmentResult,
  ): ConfidenceScore {
    const domain = domainAssessment.domain;

    // Check if domain is applicable
    if (this.isDomainNotApplicable(domain, scenario)) {
      return {
        domain,
        status: 'na',
        rationale: `${domain.replace(/-/g, ' ')} is not applicable to this workload scenario.`,
        gaps: [],
        improvementActions: [],
      };
    }

    // Check if domain has missing information (grey)
    const missingForDomain = assessment.missingInformation.filter((m) => m.domain === domain);
    if (missingForDomain.length > 2) {
      return {
        domain,
        status: 'grey',
        rationale: `Insufficient input data to assess ${domain.replace(/-/g, ' ')}. Multiple required inputs are missing.`,
        gaps: missingForDomain.map((m) => m.impact),
        improvementActions: missingForDomain.map((m) => m.question),
      };
    }

    // Score based on assessment completeness
    const gaps = this.identifyGaps(domainAssessment, scenario);

    if (gaps.length === 0) {
      return {
        domain,
        status: 'green',
        rationale: `High confidence in ${domain.replace(/-/g, ' ')} design. Sufficient evidence and clear rationale support the recommendation.`,
        gaps: [],
        improvementActions: [],
      };
    }

    if (gaps.length <= 2) {
      return {
        domain,
        status: 'amber',
        rationale: `Partial confidence in ${domain.replace(/-/g, ' ')} design. Specific gaps remain that need addressing.`,
        gaps,
        improvementActions: gaps.map((g) => `Address gap: ${g}`),
      };
    }

    return {
      domain,
      status: 'red',
      rationale: `Low confidence in ${domain.replace(/-/g, ' ')} design. Significant gaps or unresolved risks remain.`,
      gaps,
      improvementActions: [
        'Conduct detailed discovery for this domain',
        'Engage specialist stakeholders',
        ...gaps.map((g) => `Resolve: ${g}`),
      ],
    };
  }

  private isDomainNotApplicable(domain: ArchitectureDomain, scenario: ScenarioIntake): boolean {
    // Integration domain is N/A if no integrations specified and service is standalone
    if (domain === 'integration-apis') {
      return (
        scenario.steps.integrations.systems.length === 0 &&
        scenario.steps.integrations.protocols.length === 0 &&
        scenario.steps.serviceType.type === 'batch-processing'
      );
    }
    return false;
  }

  private identifyGaps(domainAssessment: DomainAssessment, scenario: ScenarioIntake): string[] {
    const gaps: string[] = [];

    // High-severity risks without mitigations are gaps
    for (const risk of domainAssessment.risksAndAssumptions) {
      if (risk.severity === 'high' && !risk.mitigation) {
        gaps.push(`Unmitigated high-severity ${risk.type}: ${risk.description}`);
      }
    }

    // Unvalidated assumptions are gaps
    const assumptions = domainAssessment.labels.assumptions;
    if (assumptions.length > 3) {
      gaps.push('Multiple unvalidated assumptions need stakeholder confirmation');
    }

    // Missing evidence
    if (domainAssessment.evidenceNeeded.length > 2) {
      gaps.push('Key evidence has not yet been gathered to support the recommendation');
    }

    // Low team capability for complex domains
    if (
      domainAssessment.operationalBurden.complexity === 'high' &&
      scenario.steps.teamCapability.cloudExperience === 'none'
    ) {
      gaps.push('Team capability gap: high-complexity recommendation with no cloud experience');
    }

    return gaps;
  }

  // -------------------------------------------------------------------------
  // Private: Overall maturity
  // -------------------------------------------------------------------------

  private calculateMaturity(scores: ConfidenceScore[]): ConfidenceSummary['overallMaturity'] {
    const applicable = scores.filter((s) => s.status !== 'na' && s.status !== 'grey');
    if (applicable.length === 0) return 'early';

    const greenRatio = applicable.filter((s) => s.status === 'green').length / applicable.length;

    if (greenRatio >= 0.8) return 'mature';
    if (greenRatio >= 0.5) return 'established';
    if (greenRatio >= 0.2) return 'developing';
    return 'early';
  }
}
