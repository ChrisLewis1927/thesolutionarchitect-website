// Architecture Design Lab — Output Formatter
// Implements: Requirements 10.1, 10.2, 10.3, 10.4, 10.5

import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import type Database from 'better-sqlite3';
import type {
  OutputFormatter as IOutputFormatter,
  OutputType,
  FormattedOutput,
  ADROutput,
  GovernanceBriefingOutput,
  AssessmentResult,
} from './types';

// ---------------------------------------------------------------------------
// Output Formatter Implementation
// ---------------------------------------------------------------------------

export class OutputFormatterImpl implements IOutputFormatter {
  private db: Database.Database;
  private contentPath: string;

  constructor(db: Database.Database, contentPath: string) {
    this.db = db;
    this.contentPath = contentPath;
  }

  /**
   * Generates a formatted output document for the given type.
   */
  generate(assessmentId: string, type: OutputType): FormattedOutput {
    const assessment = this.loadAssessment(assessmentId);

    let output: FormattedOutput;

    switch (type) {
      case 'adr-draft':
        output = this.generateADR(assessment);
        break;
      case 'governance-briefing':
        output = this.generateGovernanceBriefing(assessment);
        break;
      case 'hld-section':
        output = this.generateHLDSection(assessment);
        break;
      case 'architecture-decision-summary':
        output = this.generateDecisionSummary(assessment);
        break;
      case 'risk-assumption-log':
        output = this.generateRiskLog(assessment);
        break;
      case 'pattern-comparison':
        output = this.generatePatternComparison(assessment);
        break;
      case 'stakeholder-questions':
        output = this.generateStakeholderQuestions(assessment);
        break;
      default:
        throw new Error(`Unknown output type: ${type}`);
    }

    // Persist
    this.db.prepare(`
      INSERT INTO design_lab_outputs (id, assessment_id, output_type, title, content, generated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(randomUUID(), assessmentId, output.type, output.title, output.content);

    return output;
  }

  /**
   * Generates all output types for an assessment.
   */
  generateAll(assessmentId: string): FormattedOutput[] {
    const types: OutputType[] = [
      'architecture-decision-summary',
      'hld-section',
      'adr-draft',
      'governance-briefing',
      'risk-assumption-log',
      'pattern-comparison',
      'stakeholder-questions',
    ];

    return types.map((type) => this.generate(assessmentId, type));
  }

  /**
   * Copies content to the system clipboard.
   */
  copyToClipboard(content: string): void {
    // In Electron, this would use clipboard.writeText(content)
    // For now, this is a placeholder that the IPC layer will implement
    if (typeof globalThis !== 'undefined' && 'electron' in globalThis) {
      // Electron clipboard API would be called here
    }
  }

  // -------------------------------------------------------------------------
  // Private: ADR output
  // -------------------------------------------------------------------------

  private generateADR(assessment: AssessmentResult): ADROutput {
    const primaryDomain = assessment.domains[0];

    const sections = {
      title: `Use ${primaryDomain.recommendedPattern} for ${primaryDomain.domain.replace(/-/g, ' ')}`,
      status: 'Proposed',
      context: `The system requires a decision on the ${primaryDomain.domain.replace(/-/g, ' ')} approach. ` +
        `Based on the scenario inputs, the following factors were considered: ` +
        `${primaryDomain.labels.facts.slice(0, 3).join('; ')}.`,
      decision: `We will adopt the ${primaryDomain.recommendedPattern} pattern. ` +
        `${primaryDomain.rationale}`,
      consequences: `Positive: ${primaryDomain.viableOptions[0]?.tradeOffs[0]?.advantage ?? 'Reduced complexity'}. ` +
        `Negative: ${primaryDomain.viableOptions[0]?.tradeOffs[0]?.disadvantage ?? 'Potential vendor dependency'}. ` +
        `Risks: ${primaryDomain.risksAndAssumptions.filter((r) => r.type === 'risk').map((r) => r.description).slice(0, 2).join('; ') || 'None identified'}.`,
    };

    const content = [
      `# ${sections.title}`,
      '',
      `## Status`,
      '',
      sections.status,
      '',
      `## Context`,
      '',
      sections.context,
      '',
      `## Decision`,
      '',
      sections.decision,
      '',
      `## Consequences`,
      '',
      sections.consequences,
    ].join('\n');

    return {
      type: 'adr-draft',
      title: sections.title,
      content,
      generatedAt: new Date(),
      assessmentId: assessment.id,
      sections,
    };
  }

  // -------------------------------------------------------------------------
  // Private: Governance briefing
  // -------------------------------------------------------------------------

  private generateGovernanceBriefing(assessment: AssessmentResult): GovernanceBriefingOutput {
    const allRisks = assessment.domains.flatMap((d) =>
      d.risksAndAssumptions.filter((r) => r.type === 'risk'),
    );
    const allAssumptions = assessment.domains.flatMap((d) => d.labels.assumptions);
    const allQuestions = assessment.domains.flatMap((d) => d.questionsToAskNext);

    const sections = {
      executiveSummary: `This briefing summarises the architecture assessment covering ${assessment.domains.length} domains. ` +
        `The assessment identified ${allRisks.length} risks and ${allAssumptions.length} assumptions requiring validation.`,
      keyDecisions: assessment.domains
        .map((d) => `- **${d.domain.replace(/-/g, ' ')}**: ${d.recommendedPattern}`)
        .join('\n'),
      risks: allRisks
        .slice(0, 5)
        .map((r) => `- [${r.severity.toUpperCase()}] ${r.description}`)
        .join('\n') || '- No significant risks identified',
      assumptions: [...new Set(allAssumptions)]
        .slice(0, 5)
        .map((a) => `- ${a}`)
        .join('\n') || '- No assumptions recorded',
      openQuestions: [...new Set(allQuestions)]
        .slice(0, 5)
        .map((q) => `- ${q}`)
        .join('\n') || '- No open questions',
    };

    const content = [
      '# Governance Board Briefing',
      '',
      '## Executive Summary',
      '',
      sections.executiveSummary,
      '',
      '## Key Decisions',
      '',
      sections.keyDecisions,
      '',
      '## Risks',
      '',
      sections.risks,
      '',
      '## Assumptions',
      '',
      sections.assumptions,
      '',
      '## Open Questions',
      '',
      sections.openQuestions,
    ].join('\n');

    return {
      type: 'governance-briefing',
      title: 'Governance Board Briefing',
      content,
      generatedAt: new Date(),
      assessmentId: assessment.id,
      sections,
    };
  }

  // -------------------------------------------------------------------------
  // Private: Other output types
  // -------------------------------------------------------------------------

  private generateHLDSection(assessment: AssessmentResult): FormattedOutput {
    const components = assessment.domains
      .map((d) => {
        const tech = d.candidateTechnologies.find((t) => t.isRecommended);
        return tech ? `- **${tech.name}** (${tech.platform}): ${d.domain.replace(/-/g, ' ')}` : null;
      })
      .filter(Boolean)
      .join('\n');

    const content = [
      '# High-Level Design Section',
      '',
      '## Architecture Overview',
      '',
      `This section describes the high-level architecture across ${assessment.domains.length} domains.`,
      '',
      '## Key Components',
      '',
      components || '- Components to be determined',
      '',
      '## Design Decisions',
      '',
      ...assessment.domains.map((d) => `- **${d.domain.replace(/-/g, ' ')}**: ${d.recommendedPattern} — ${d.rationale.slice(0, 100)}`),
    ].join('\n');

    return { type: 'hld-section', title: 'High-Level Design Section', content, generatedAt: new Date(), assessmentId: assessment.id };
  }

  private generateDecisionSummary(assessment: AssessmentResult): FormattedOutput {
    const content = [
      '# Architecture Decision Summary',
      '',
      ...assessment.domains.map((d) => [
        `## ${d.domain.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
        '',
        `**Pattern:** ${d.recommendedPattern}`,
        `**Rationale:** ${d.rationale}`,
        `**Alternatives considered:** ${d.alternativesRationale}`,
        '',
      ].join('\n')),
    ].join('\n');

    return { type: 'architecture-decision-summary', title: 'Architecture Decision Summary', content, generatedAt: new Date(), assessmentId: assessment.id };
  }

  private generateRiskLog(assessment: AssessmentResult): FormattedOutput {
    const allRisks = assessment.domains.flatMap((d) =>
      d.risksAndAssumptions.map((r) => ({ ...r, domain: d.domain })),
    );

    const content = [
      '# Risk and Assumption Log',
      '',
      '| Domain | Type | Severity | Description | Mitigation |',
      '|--------|------|----------|-------------|------------|',
      ...allRisks.map((r) =>
        `| ${(r as { domain: string }).domain.replace(/-/g, ' ')} | ${r.type} | ${r.severity} | ${r.description} | ${r.mitigation ?? 'TBD'} |`,
      ),
    ].join('\n');

    return { type: 'risk-assumption-log', title: 'Risk and Assumption Log', content, generatedAt: new Date(), assessmentId: assessment.id };
  }

  private generatePatternComparison(assessment: AssessmentResult): FormattedOutput {
    const content = [
      '# Pattern Comparison Table',
      '',
      '| Domain | Recommended Pattern | Alternatives | Key Trade-off |',
      '|--------|-------------------|--------------|---------------|',
      ...assessment.domains.map((d) => {
        const altNames = d.viableOptions.map((o) => o.name).join(', ');
        const tradeoff = d.viableOptions[0]?.tradeOffs[0];
        return `| ${d.domain.replace(/-/g, ' ')} | ${d.recommendedPattern} | ${altNames} | ${tradeoff ? `${tradeoff.advantage} vs ${tradeoff.disadvantage}` : 'N/A'} |`;
      }),
    ].join('\n');

    return { type: 'pattern-comparison', title: 'Pattern Comparison Table', content, generatedAt: new Date(), assessmentId: assessment.id };
  }

  private generateStakeholderQuestions(assessment: AssessmentResult): FormattedOutput {
    const questions = assessment.domains.flatMap((d) =>
      d.questionsToAskNext.map((q) => ({ question: q, domain: d.domain })),
    );

    const content = [
      '# Questions for Stakeholders',
      '',
      '## Technical Team',
      '',
      ...questions.filter((q) => ['hosting-compute', 'data-persistence', 'deployment-release'].includes(q.domain)).map((q) => `- ${q.question}`),
      '',
      '## Security Team',
      '',
      ...questions.filter((q) => ['security-controls', 'identity-access', 'networking-edge'].includes(q.domain)).map((q) => `- ${q.question}`),
      '',
      '## Operations',
      '',
      ...questions.filter((q) => ['observability-operations', 'resilience-dr'].includes(q.domain)).map((q) => `- ${q.question}`),
      '',
      '## Governance / Finance',
      '',
      ...questions.filter((q) => ['cost-sustainability', 'compliance-assurance'].includes(q.domain)).map((q) => `- ${q.question}`),
    ].join('\n');

    return { type: 'stakeholder-questions', title: 'Questions for Stakeholders', content, generatedAt: new Date(), assessmentId: assessment.id };
  }

  // -------------------------------------------------------------------------
  // Private: Load assessment from DB
  // -------------------------------------------------------------------------

  private loadAssessment(assessmentId: string): AssessmentResult {
    const row = this.db.prepare(
      'SELECT result_json FROM design_lab_assessments WHERE id = ?',
    ).get(assessmentId) as { result_json: string } | undefined;

    if (!row) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    return JSON.parse(row.result_json) as AssessmentResult;
  }
}
