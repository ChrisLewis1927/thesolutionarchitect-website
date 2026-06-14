// Architecture Design Lab — Pattern Recommender
// Implements: Requirements 4.1, 4.2, 4.3, 4.4

import type {
  PatternRecommender as IPatternRecommender,
  AssessmentResult,
  ConsolidatedRecommendation,
  PatternRecommendation,
  ArchitectureDomain,
  RAGStatus,
  RiskAssumption,
  DomainAssessment,
} from './types';

// ---------------------------------------------------------------------------
// Pattern Recommender Implementation
// ---------------------------------------------------------------------------

export class PatternRecommenderImpl implements IPatternRecommender {
  /**
   * Produces a consolidated recommendation from an assessment result,
   * covering all assessed domains with decision logic explained.
   */
  recommend(assessment: AssessmentResult): ConsolidatedRecommendation {
    const recommendations: PatternRecommendation[] = [];

    for (const domainAssessment of assessment.domains) {
      const confidenceLevel = this.deriveConfidence(domainAssessment);

      // Ensure high-severity risks have mitigations
      const risks: RiskAssumption[] = domainAssessment.risksAndAssumptions.map((r) => {
        if (r.severity === 'high' && !r.mitigation) {
          return {
            ...r,
            mitigation: `Conduct detailed review and stakeholder validation for this ${r.type} before implementation.`,
          };
        }
        return r;
      });

      recommendations.push({
        domain: domainAssessment.domain,
        patternName: domainAssessment.recommendedPattern,
        patternId: domainAssessment.recommendedPattern.toLowerCase().replace(/\s+/g, '-'),
        decisionLogic: this.buildDecisionLogic(domainAssessment),
        conditionsForChange: this.buildConditionsForChange(domainAssessment),
        risks,
        confidenceLevel,
      });
    }

    const crossCuttingConcerns = this.identifyCrossCuttingConcerns(assessment);

    return {
      assessmentId: assessment.id,
      recommendations,
      crossCuttingConcerns,
      generatedAt: new Date(),
    };
  }

  /**
   * Retrieves a single domain recommendation from a stored assessment.
   */
  getRecommendation(assessmentId: string, domain: ArchitectureDomain): PatternRecommendation {
    // This would typically load from DB; for now we throw if not found
    throw new Error(`Use recommend() to generate recommendations. Direct lookup for ${assessmentId}/${domain} not yet implemented.`);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private buildDecisionLogic(domainAssessment: DomainAssessment): string {
    const parts: string[] = [];

    parts.push(`Pattern "${domainAssessment.recommendedPattern}" was selected for ${domainAssessment.domain.replace(/-/g, ' ')} because:`);
    parts.push('');
    parts.push(`- ${domainAssessment.rationale}`);

    if (domainAssessment.labels.facts.length > 0) {
      parts.push('');
      parts.push('Based on the following facts:');
      for (const fact of domainAssessment.labels.facts.slice(0, 3)) {
        parts.push(`- ${fact}`);
      }
    }

    if (domainAssessment.viableOptions.length > 1) {
      const best = domainAssessment.viableOptions.reduce((a, b) =>
        a.suitabilityScore > b.suitabilityScore ? a : b,
      );
      parts.push('');
      parts.push(`This option scored highest (${best.suitabilityScore}/100) among ${domainAssessment.viableOptions.length} viable alternatives.`);
    }

    return parts.join('\n');
  }

  private buildConditionsForChange(domainAssessment: DomainAssessment): string[] {
    const conditions: string[] = [];

    conditions.push(`If the data classification changes, the ${domainAssessment.domain.replace(/-/g, ' ')} recommendation may need revision.`);
    conditions.push(`If team capability changes significantly, alternative approaches may become viable.`);

    if (domainAssessment.operationalBurden.complexity === 'high') {
      conditions.push('If operational capacity is reduced, consider moving to a managed service alternative.');
    }

    if (domainAssessment.viableOptions.length > 1) {
      const alternatives = domainAssessment.viableOptions
        .filter((o) => o.name !== domainAssessment.recommendedPattern)
        .map((o) => o.name);
      if (alternatives.length > 0) {
        conditions.push(`Alternative patterns (${alternatives.join(', ')}) may be preferred if trade-off priorities change.`);
      }
    }

    return conditions;
  }

  private deriveConfidence(domainAssessment: DomainAssessment): RAGStatus {
    const highRisks = domainAssessment.risksAndAssumptions.filter(
      (r) => r.severity === 'high',
    ).length;
    const assumptions = domainAssessment.labels.assumptions.length;

    if (highRisks === 0 && assumptions <= 2) return 'green';
    if (highRisks <= 1 && assumptions <= 4) return 'amber';
    return 'red';
  }

  private identifyCrossCuttingConcerns(assessment: AssessmentResult): string[] {
    const concerns: string[] = [];

    // Check for security concerns across multiple domains
    const securityRisks = assessment.domains.flatMap((d) =>
      d.risksAndAssumptions.filter(
        (r) => r.description.toLowerCase().includes('security'),
      ),
    );
    if (securityRisks.length > 2) {
      concerns.push('Security is a cross-cutting concern affecting multiple architecture domains. Consider a unified security architecture review.');
    }

    // Check for operational complexity
    const highComplexity = assessment.domains.filter(
      (d) => d.operationalBurden.complexity === 'high',
    );
    if (highComplexity.length > 3) {
      concerns.push('Multiple domains have high operational complexity. Consider whether the team has capacity to manage this level of complexity.');
    }

    // Check for cost implications
    concerns.push('Cost optimisation should be reviewed holistically across all domains rather than in isolation.');

    // Check for integration dependencies
    if (assessment.domains.some((d) => d.domain === 'integration-apis' && d.candidateTechnologies.length > 3)) {
      concerns.push('Integration architecture spans multiple systems. Consider an integration strategy document.');
    }

    return concerns;
  }
}
