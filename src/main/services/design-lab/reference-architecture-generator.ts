// Architecture Design Lab — Reference Architecture Generator
// Implements: Requirements 6.1, 6.2, 6.3, 6.4

import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import type {
  ReferenceArchitectureGenerator as IReferenceArchitectureGenerator,
  AssessmentResult,
  ConsolidatedRecommendation,
  ReferenceArchitecture,
  ComponentEntry,
  CategorisedQuestion,
  ADRCandidate,
  RiskAssumption,
} from './types';

// ---------------------------------------------------------------------------
// Reference Architecture Generator Implementation
// ---------------------------------------------------------------------------

export class ReferenceArchitectureGeneratorImpl implements IReferenceArchitectureGenerator {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Generates a reference architecture from assessment results and recommendations.
   */
  generate(
    assessment: AssessmentResult,
    recommendation: ConsolidatedRecommendation,
  ): ReferenceArchitecture {
    const refArch: ReferenceArchitecture = {
      id: randomUUID(),
      assessmentId: assessment.id,
      designSummary: this.buildDesignSummary(assessment, recommendation),
      keyComponents: this.extractKeyComponents(assessment),
      dataFlowDescription: this.buildDataFlowDescription(assessment),
      securityControls: this.extractSecurityControls(assessment),
      resilienceModel: this.buildResilienceModel(assessment),
      operationalModel: this.buildOperationalModel(assessment),
      integrationApproach: this.buildIntegrationApproach(assessment),
      deploymentApproach: this.buildDeploymentApproach(assessment),
      keyRisks: this.extractKeyRisks(assessment),
      openQuestions: this.buildOpenQuestions(assessment),
      assumptions: this.extractAssumptions(assessment),
      adrCandidates: this.buildADRCandidates(assessment, recommendation),
      hldSectionDraft: this.buildHLDDraft(assessment, recommendation),
      governanceReviewQuestions: this.buildGovernanceQuestions(assessment),
      generatedAt: new Date(),
    };

    // Persist
    this.db.prepare(`
      INSERT INTO design_lab_reference_architectures (id, assessment_id, content_json, generated_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(refArch.id, assessment.id, JSON.stringify(refArch));

    return refArch;
  }

  /**
   * Regenerates a reference architecture for an existing assessment.
   */
  regenerate(assessmentId: string): ReferenceArchitecture {
    throw new Error(`Regenerate requires loading assessment ${assessmentId} and re-running generate(). Use generate() directly with fresh data.`);
  }

  // -------------------------------------------------------------------------
  // Private: Design summary (plain English)
  // -------------------------------------------------------------------------

  private buildDesignSummary(assessment: AssessmentResult, recommendation: ConsolidatedRecommendation): string {
    const patterns = recommendation.recommendations
      .map((r) => `${r.domain.replace(/-/g, ' ')}: ${r.patternName}`)
      .join('; ');

    return `This architecture addresses the requirements captured in the scenario intake. ` +
      `The design recommends the following patterns across the assessed domains: ${patterns}. ` +
      `The approach prioritises managed services where possible to reduce operational burden, ` +
      `with security controls appropriate to the stated data classification. ` +
      `${assessment.missingInformation.length > 0 ? `Note: ${assessment.missingInformation.length} areas require further information before the design can be finalised.` : 'All required information has been captured for a confident recommendation.'}`;
  }

  // -------------------------------------------------------------------------
  // Private: Key components
  // -------------------------------------------------------------------------

  private extractKeyComponents(assessment: AssessmentResult): ComponentEntry[] {
    const components: ComponentEntry[] = [];

    for (const domain of assessment.domains) {
      const recommended = domain.candidateTechnologies.find((t) => t.isRecommended);
      if (recommended) {
        components.push({
          name: recommended.name,
          purpose: `${domain.domain.replace(/-/g, ' ')} — ${recommended.category}`,
          technology: recommended.name,
          platform: recommended.platform,
        });
      }
    }

    return components;
  }

  // -------------------------------------------------------------------------
  // Private: Data flow
  // -------------------------------------------------------------------------

  private buildDataFlowDescription(assessment: AssessmentResult): string {
    const integrationDomain = assessment.domains.find((d) => d.domain === 'integration-apis');
    const dataDomain = assessment.domains.find((d) => d.domain === 'data-persistence');

    let description = 'Data flows through the system as follows: ';

    if (integrationDomain && integrationDomain.candidateTechnologies.length > 0) {
      description += `External data enters via ${integrationDomain.recommendedPattern} integration pattern. `;
    }

    if (dataDomain) {
      description += `Data is persisted using ${dataDomain.recommendedPattern} approach. `;
    }

    description += 'All data in transit is encrypted using TLS 1.2+. Data at rest is encrypted using platform-native encryption.';

    return description;
  }

  // -------------------------------------------------------------------------
  // Private: Security controls
  // -------------------------------------------------------------------------

  private extractSecurityControls(assessment: AssessmentResult): string[] {
    const securityDomain = assessment.domains.find((d) => d.domain === 'security-controls');
    const identityDomain = assessment.domains.find((d) => d.domain === 'identity-access');
    const networkDomain = assessment.domains.find((d) => d.domain === 'networking-edge');

    const controls: string[] = [
      'TLS 1.2+ for all data in transit',
      'Encryption at rest for all persistent data',
      'Principle of least privilege for all access controls',
    ];

    if (securityDomain) {
      controls.push(`Security pattern: ${securityDomain.recommendedPattern}`);
    }
    if (identityDomain) {
      controls.push(`Identity approach: ${identityDomain.recommendedPattern}`);
    }
    if (networkDomain) {
      controls.push(`Network protection: ${networkDomain.recommendedPattern}`);
    }

    return controls;
  }

  // -------------------------------------------------------------------------
  // Private: Resilience model
  // -------------------------------------------------------------------------

  private buildResilienceModel(assessment: AssessmentResult): string {
    const resilienceDomain = assessment.domains.find((d) => d.domain === 'resilience-dr');
    if (!resilienceDomain) {
      return 'Resilience model to be determined based on availability requirements.';
    }

    return `The resilience model follows the ${resilienceDomain.recommendedPattern} pattern. ` +
      `${resilienceDomain.rationale} ` +
      `Key considerations include: ${resilienceDomain.questionsToAskNext.slice(0, 2).join('; ')}.`;
  }

  // -------------------------------------------------------------------------
  // Private: Operational model
  // -------------------------------------------------------------------------

  private buildOperationalModel(assessment: AssessmentResult): string {
    const opsDomain = assessment.domains.find((d) => d.domain === 'observability-operations');
    if (!opsDomain) {
      return 'Operational model to be defined based on support requirements.';
    }

    return `Operations follow the ${opsDomain.recommendedPattern} approach. ` +
      `Operational complexity: ${opsDomain.operationalBurden.complexity}. ` +
      `Staffing: ${opsDomain.operationalBurden.staffingImplications}. ` +
      `Required skills: ${opsDomain.operationalBurden.skillsRequired.join(', ')}.`;
  }

  // -------------------------------------------------------------------------
  // Private: Integration approach
  // -------------------------------------------------------------------------

  private buildIntegrationApproach(assessment: AssessmentResult): string {
    const integrationDomain = assessment.domains.find((d) => d.domain === 'integration-apis');
    if (!integrationDomain) {
      return 'No external integrations identified in the current assessment.';
    }

    return `Integration follows the ${integrationDomain.recommendedPattern} pattern. ` +
      `${integrationDomain.rationale}`;
  }

  // -------------------------------------------------------------------------
  // Private: Deployment approach
  // -------------------------------------------------------------------------

  private buildDeploymentApproach(assessment: AssessmentResult): string {
    const deployDomain = assessment.domains.find((d) => d.domain === 'deployment-release');
    if (!deployDomain) {
      return 'Deployment approach to be determined.';
    }

    return `Deployment uses ${deployDomain.recommendedPattern}. ` +
      `${deployDomain.rationale}`;
  }

  // -------------------------------------------------------------------------
  // Private: Key risks
  // -------------------------------------------------------------------------

  private extractKeyRisks(assessment: AssessmentResult): RiskAssumption[] {
    const allRisks = assessment.domains.flatMap((d) =>
      d.risksAndAssumptions.filter((r) => r.type === 'risk'),
    );

    // Return top risks by severity
    return allRisks
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.severity] - order[b.severity];
      })
      .slice(0, 10);
  }

  // -------------------------------------------------------------------------
  // Private: Open questions (categorised by stakeholder)
  // -------------------------------------------------------------------------

  private buildOpenQuestions(assessment: AssessmentResult): CategorisedQuestion[] {
    const questions: CategorisedQuestion[] = [];

    // From missing information
    for (const missing of assessment.missingInformation) {
      questions.push({
        question: missing.question,
        stakeholderGroup: this.mapDomainToStakeholder(missing.domain),
      });
    }

    // From domain questions
    for (const domain of assessment.domains) {
      for (const q of domain.questionsToAskNext.slice(0, 1)) {
        questions.push({
          question: q,
          stakeholderGroup: this.mapDomainToStakeholder(domain.domain),
        });
      }
    }

    return questions;
  }

  private mapDomainToStakeholder(domain: string): CategorisedQuestion['stakeholderGroup'] {
    switch (domain) {
      case 'security-controls':
      case 'identity-access':
      case 'networking-edge':
        return 'security';
      case 'observability-operations':
      case 'resilience-dr':
        return 'operations';
      case 'cost-sustainability':
        return 'finance';
      case 'compliance-assurance':
        return 'governance';
      case 'deployment-release':
        return 'delivery';
      default:
        return 'technical';
    }
  }

  // -------------------------------------------------------------------------
  // Private: Assumptions
  // -------------------------------------------------------------------------

  private extractAssumptions(assessment: AssessmentResult): string[] {
    return assessment.domains
      .flatMap((d) => d.labels.assumptions)
      .filter((a, i, arr) => arr.indexOf(a) === i) // deduplicate
      .slice(0, 15);
  }

  // -------------------------------------------------------------------------
  // Private: ADR candidates
  // -------------------------------------------------------------------------

  private buildADRCandidates(assessment: AssessmentResult, recommendation: ConsolidatedRecommendation): ADRCandidate[] {
    return recommendation.recommendations.map((rec) => ({
      title: `ADR: ${rec.patternName} for ${rec.domain.replace(/-/g, ' ')}`,
      contextStatement: `The ${rec.domain.replace(/-/g, ' ')} domain requires a decision on the architectural approach. ${(rec.decisionLogic ?? '').split('\n')[0]}`,
      domain: rec.domain,
    }));
  }

  // -------------------------------------------------------------------------
  // Private: HLD draft
  // -------------------------------------------------------------------------

  private buildHLDDraft(assessment: AssessmentResult, recommendation: ConsolidatedRecommendation): string {
    const lines: string[] = [];

    lines.push('# High-Level Design — Draft');
    lines.push('');
    lines.push('## 1. Solution Overview');
    lines.push('');
    lines.push(this.buildDesignSummary(assessment, recommendation));
    lines.push('');
    lines.push('## 2. Key Components');
    lines.push('');
    for (const comp of this.extractKeyComponents(assessment)) {
      lines.push(`- **${comp.name}** (${comp.platform}): ${comp.purpose}`);
    }
    lines.push('');
    lines.push('## 3. Security Controls');
    lines.push('');
    for (const control of this.extractSecurityControls(assessment)) {
      lines.push(`- ${control}`);
    }
    lines.push('');
    lines.push('## 4. Resilience');
    lines.push('');
    lines.push(this.buildResilienceModel(assessment));
    lines.push('');
    lines.push('## 5. Key Risks');
    lines.push('');
    for (const risk of this.extractKeyRisks(assessment).slice(0, 5)) {
      lines.push(`- [${risk.severity.toUpperCase()}] ${risk.description}${risk.mitigation ? ` — Mitigation: ${risk.mitigation}` : ''}`);
    }

    return lines.join('\n');
  }

  // -------------------------------------------------------------------------
  // Private: Governance questions
  // -------------------------------------------------------------------------

  private buildGovernanceQuestions(assessment: AssessmentResult): string[] {
    return [
      'Has the architecture been reviewed against the Technology Code of Practice?',
      'Have all security risks been assessed and accepted by the appropriate authority?',
      'Is the operational support model funded and resourced?',
      'Have data protection impact assessments been completed where required?',
      'Is the disaster recovery approach proportionate to the service criticality?',
      'Have accessibility requirements been validated against WCAG 2.1 AA?',
    ];
  }
}
