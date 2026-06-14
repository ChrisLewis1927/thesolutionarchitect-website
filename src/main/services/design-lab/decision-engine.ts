// Architecture Design Lab — Decision Engine
// Implements: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 11.1, 11.2, 11.3

import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import type Database from 'better-sqlite3';
import type {
  DecisionEngine as IDecisionEngine,
  ScenarioIntake,
  AssessmentResult,
  DomainAssessment,
  ArchitectureDomain,
  MissingInformation,
  CandidateTechnology,
  RiskAssumption,
  OperationalBurden,
  CostConsideration,
  ViableOption,
  AssessmentLabels,
} from './types';

// ---------------------------------------------------------------------------
// All architecture domains
// ---------------------------------------------------------------------------

const ALL_DOMAINS: ArchitectureDomain[] = [
  'hosting-compute',
  'data-persistence',
  'integration-apis',
  'networking-edge',
  'identity-access',
  'security-controls',
  'resilience-dr',
  'observability-operations',
  'deployment-release',
  'cost-sustainability',
  'compliance-assurance',
];

// ---------------------------------------------------------------------------
// Decision rule file schema
// ---------------------------------------------------------------------------

interface DecisionRuleFile {
  domain: ArchitectureDomain;
  rules: DecisionRule[];
  defaultPattern: string;
  defaultTechnologies: RuleTechnology[];
  standards: string[];
  artefacts: string[];
}

interface DecisionRule {
  condition: RuleCondition;
  pattern: string;
  technologies: RuleTechnology[];
  rationale: string;
  alternativesRationale: string;
  risks: Array<{ type: 'risk' | 'assumption'; description: string; severity: 'high' | 'medium' | 'low'; mitigation?: string }>;
  operationalComplexity: 'low' | 'medium' | 'high';
}

interface RuleCondition {
  field: string;
  operator: 'equals' | 'includes' | 'greaterThan' | 'lessThan' | 'any';
  value: unknown;
}

interface RuleTechnology {
  name: string;
  category: string;
  platform: 'aws' | 'azure' | 'gcp' | 'on-premises' | 'saas' | 'multi-cloud';
  isRecommended: boolean;
  rationale: string;
}

// ---------------------------------------------------------------------------
// Decision Engine Implementation
// ---------------------------------------------------------------------------

export class DecisionEngineImpl implements IDecisionEngine {
  private db: Database.Database;
  private contentPath: string;
  private ruleCache: Map<ArchitectureDomain, DecisionRuleFile> = new Map();

  constructor(db: Database.Database, contentPath: string) {
    this.db = db;
    this.contentPath = contentPath;
  }

  /**
   * Produces a full assessment across all 11 architecture domains.
   */
  assess(scenario: ScenarioIntake): AssessmentResult {
    const domains: DomainAssessment[] = [];
    const missingInfo: MissingInformation[] = [];

    // Detect missing information first
    const missing = this.detectMissingInformation(scenario);
    missingInfo.push(...missing);

    // Assess each domain
    for (const domain of ALL_DOMAINS) {
      const assessment = this.assessDomain(domain, scenario);
      domains.push(assessment);
    }

    const result: AssessmentResult = {
      id: randomUUID(),
      scenarioId: scenario.id,
      domains,
      missingInformation: missingInfo,
      generatedAt: new Date(),
    };

    // Persist
    this.db.prepare(`
      INSERT INTO design_lab_assessments (id, scenario_id, result_json, status, created_at, updated_at)
      VALUES (?, ?, ?, 'complete', datetime('now'), datetime('now'))
    `).run(result.id, scenario.id, JSON.stringify(result));

    return result;
  }

  /**
   * Re-runs assessment with updated scenario data.
   */
  reassess(scenarioId: string, updatedScenario: ScenarioIntake): AssessmentResult {
    return this.assess(updatedScenario);
  }

  /**
   * Retrieves a single domain assessment from a stored result.
   */
  getDomainAssessment(assessmentId: string, domain: ArchitectureDomain): DomainAssessment {
    const result = this.loadAssessment(assessmentId);
    const domainAssessment = result.domains.find((d) => d.domain === domain);
    if (!domainAssessment) {
      throw new Error(`Domain ${domain} not found in assessment ${assessmentId}`);
    }
    return domainAssessment;
  }

  /**
   * Returns missing information entries for a stored assessment.
   */
  getMissingInformation(assessmentId: string): MissingInformation[] {
    const result = this.loadAssessment(assessmentId);
    return result.missingInformation;
  }

  // -------------------------------------------------------------------------
  // Private: Domain assessment logic
  // -------------------------------------------------------------------------

  private assessDomain(domain: ArchitectureDomain, scenario: ScenarioIntake): DomainAssessment {
    const rules = this.loadRules(domain);
    const matchedRule = this.findMatchingRule(rules, scenario);

    const platforms = scenario.steps.cloudPlatforms;
    const noCloud = platforms.noCloudAvailable;
    const availablePlatforms = platforms.availablePlatforms;

    // Extract recommendation data from matched rule or default
    const ruleData: any = matchedRule
      ? (matchedRule as any).recommendation ?? matchedRule
      : (rules as any).defaultRecommendation ?? { pattern: rules.defaultPattern, candidateTechnologies: rules.defaultTechnologies };

    // Get candidate technologies, filtered by platform constraints
    let technologies = (ruleData.candidateTechnologies ?? rules.defaultTechnologies ?? []).map((t: any) => ({
      name: t.name ?? 'Unknown',
      category: t.category ?? 'general',
      platform: t.platform ?? 'multi-cloud',
      isRecommended: t.isRecommended ?? true,
      rationale: t.rationale ?? ruleData.rationale ?? '',
    }));

    technologies = this.filterByPlatform(technologies, availablePlatforms, noCloud);

    // Build viable options
    const viableOptions = this.buildViableOptions(rules, scenario);

    // Build labels
    const labels = this.buildLabels(scenario, domain, ruleData);

    // Build operational burden
    const operationalBurden = ruleData.operationalBurden
      ? {
          staffingImplications: ruleData.operationalBurden.staffingImplications ?? '',
          skillsRequired: ruleData.operationalBurden.skillsRequired ?? [],
          toolingRequired: ruleData.operationalBurden.toolingRequired ?? [],
          ongoingMaintenance: ruleData.operationalBurden.ongoingMaintenance ?? '',
          complexity: ruleData.operationalBurden.complexity ?? 'medium',
        }
      : this.buildOperationalBurden(null, scenario);

    // Build cost considerations
    const costConsiderations = ruleData.costConsiderations
      ? {
          runningCosts: ruleData.costConsiderations.runningCosts ?? '',
          transitionCosts: ruleData.costConsiderations.transitionCosts ?? '',
          costDrivers: ruleData.costConsiderations.costDrivers ?? [],
          optimisationOpportunities: ruleData.costConsiderations.optimisationOpportunities ?? [],
        }
      : this.buildCostConsiderations(domain, scenario);

    // Build risks
    const risks: RiskAssumption[] = [
      { type: 'assumption', description: `Assessment based on provided scenario inputs for ${domain}`, severity: 'medium' },
    ];

    // Ensure high-severity risks have mitigations
    for (const risk of risks) {
      if (risk.severity === 'high' && !risk.mitigation) {
        risk.mitigation = `Conduct detailed analysis and stakeholder review for this ${risk.type} before proceeding.`;
      }
    }

    // Get standards and artefacts from rule file
    const relevantStandards = (rules as any).relevantStandards ?? rules.standards ?? ['UK Government TCoP'];
    const artefactsToProduce = (rules as any).artefactsToProduce ?? rules.artefacts ?? ['Architecture Decision Record'];

    return {
      domain,
      recommendedPattern: ruleData.pattern ?? rules.defaultPattern ?? 'Managed Service',
      candidateTechnologies: technologies,
      rationale: ruleData.rationale ?? `Default recommendation for ${domain} based on scenario inputs.`,
      alternativesRationale: ruleData.alternativesRationale ?? 'Alternative options exist but may not align with the stated requirements.',
      risksAndAssumptions: risks,
      questionsToAskNext: (rules as any).commonQuestions ?? this.generateQuestions(domain, scenario),
      evidenceNeeded: (rules as any).evidenceNeeded ?? this.generateEvidenceNeeded(domain),
      artefactsToProduce,
      relevantStandards,
      operationalBurden,
      costConsiderations,
      viableOptions,
      labels,
    };
  }

  // -------------------------------------------------------------------------
  // Private: Rule matching
  // -------------------------------------------------------------------------

  private loadRules(domain: ArchitectureDomain): DecisionRuleFile {
    if (this.ruleCache.has(domain)) {
      return this.ruleCache.get(domain)!;
    }

    try {
      const filePath = join(this.contentPath, 'decision-rules', `${domain}.json`);
      const content = readFileSync(filePath, 'utf-8');
      const rules = JSON.parse(content) as DecisionRuleFile;
      this.ruleCache.set(domain, rules);
      return rules;
    } catch {
      // Return a minimal default if file not found
      const fallback: DecisionRuleFile = {
        domain,
        rules: [],
        defaultPattern: 'managed-service',
        defaultTechnologies: [
          { name: 'Managed Service', category: 'general', platform: 'multi-cloud', isRecommended: true, rationale: 'Managed services reduce operational burden.' },
        ],
        standards: ['UK Government TCoP', 'Secure by Design'],
        artefacts: ['Architecture Decision Record', 'High-Level Design section'],
      };
      this.ruleCache.set(domain, fallback);
      return fallback;
    }
  }

  private findMatchingRule(ruleFile: DecisionRuleFile, scenario: ScenarioIntake): DecisionRule | null {
    for (const rule of ruleFile.rules) {
      if (this.evaluateRuleCondition(rule.condition, scenario)) {
        return rule;
      }
    }
    return null;
  }

  private evaluateRuleCondition(condition: any, scenario: ScenarioIntake): boolean {
    if (!condition) return false;

    // Handle nested "all" array format from content files
    if (condition.all && Array.isArray(condition.all)) {
      return condition.all.every((c: any) => this.evaluateSingleCondition(c, scenario));
    }

    // Handle flat condition format
    return this.evaluateSingleCondition(condition, scenario);
  }

  private evaluateSingleCondition(condition: any, scenario: ScenarioIntake): boolean {
    if (!condition || !condition.field) return false;
    const value = this.resolveField(condition.field, scenario);
    if (value === undefined) return false;

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'includes':
        return Array.isArray(value) && value.includes(condition.value);
      case 'in':
        // "in" operator: check if the field value is in the provided values array
        return Array.isArray(condition.values) && condition.values.includes(value);
      case 'any':
        return true;
      default:
        return false;
    }
  }

  private resolveField(field: string, scenario: ScenarioIntake): unknown {
    if (!field || typeof field !== 'string') return undefined;
    const parts = field.split('.');
    let current: unknown = scenario.steps;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  }

  // -------------------------------------------------------------------------
  // Private: Platform filtering (Requirements 3.9, 3.10)
  // -------------------------------------------------------------------------

  private filterByPlatform(
    technologies: RuleTechnology[],
    availablePlatforms: string[],
    noCloud: boolean,
  ): RuleTechnology[] {
    if (noCloud) {
      // Exclude cloud-specific technologies
      return technologies.filter(
        (t) => t.platform === 'on-premises' || t.platform === 'saas' || t.platform === 'multi-cloud',
      );
    }

    if (availablePlatforms.length === 0) {
      return technologies;
    }

    // Keep technologies on available platforms, plus on-premises, saas, multi-cloud
    return technologies.filter(
      (t) =>
        availablePlatforms.includes(t.platform) ||
        t.platform === 'on-premises' ||
        t.platform === 'saas' ||
        t.platform === 'multi-cloud',
    );
  }

  // -------------------------------------------------------------------------
  // Private: Viable options (Requirement 3.4)
  // -------------------------------------------------------------------------

  private buildViableOptions(ruleFile: DecisionRuleFile, scenario: ScenarioIntake): ViableOption[] {
    const options: ViableOption[] = [];

    // Always include managed service option
    options.push({
      name: 'Managed Service',
      description: 'Use cloud-managed services to minimise operational burden.',
      tradeOffs: [
        { advantage: 'Lower operational overhead', disadvantage: 'Less control over configuration' },
        { advantage: 'Built-in resilience', disadvantage: 'Potential vendor lock-in' },
      ],
      suitabilityScore: 75,
    });

    // Add self-managed option if team has capacity
    if (scenario.steps.teamCapability.cloudExperience !== 'none') {
      options.push({
        name: 'Self-Managed Infrastructure',
        description: 'Deploy and manage infrastructure directly for maximum control.',
        tradeOffs: [
          { advantage: 'Full control over configuration', disadvantage: 'Higher operational burden' },
          { advantage: 'No vendor lock-in', disadvantage: 'Requires skilled team' },
        ],
        suitabilityScore: scenario.steps.teamCapability.cloudExperience === 'advanced' ? 60 : 30,
      });
    }

    // Add SaaS option
    options.push({
      name: 'SaaS Solution',
      description: 'Adopt a software-as-a-service product to meet the requirement.',
      tradeOffs: [
        { advantage: 'Fastest time to value', disadvantage: 'Limited customisation' },
        { advantage: 'No infrastructure management', disadvantage: 'Data sovereignty considerations' },
      ],
      suitabilityScore: 50,
    });

    return options;
  }

  // -------------------------------------------------------------------------
  // Private: Labels (Requirement 3.3, 11.2)
  // -------------------------------------------------------------------------

  private buildLabels(scenario: ScenarioIntake, domain: ArchitectureDomain, ruleData: any): AssessmentLabels {
    const facts: string[] = [];
    const assumptions: string[] = [];
    const recommendations: string[] = [];

    // Facts from scenario inputs
    if (scenario.steps.cloudPlatforms.availablePlatforms.length > 0) {
      facts.push(`Available cloud platforms: ${scenario.steps.cloudPlatforms.availablePlatforms.join(', ')}`);
    }
    facts.push(`Service type: ${scenario.steps.serviceType.type}`);
    facts.push(`Data classification: ${scenario.steps.dataSensitivity.classification}`);
    facts.push(`Target availability: ${scenario.steps.availability.targetAvailability}%`);

    // Assumptions
    assumptions.push(`Team has capacity to adopt recommended approach for ${domain}`);
    assumptions.push('Budget is available for the recommended technology choices');

    // Recommendations
    if (ruleData && ruleData.rationale) {
      recommendations.push(ruleData.rationale);
    } else {
      recommendations.push(`Use managed services for ${domain} to reduce operational burden`);
    }
    recommendations.push('Validate assumptions with stakeholders before committing to this approach');

    return { facts, assumptions, recommendations };
  }

  // -------------------------------------------------------------------------
  // Private: Operational burden (Requirement 3.5)
  // -------------------------------------------------------------------------

  private buildOperationalBurden(rule: DecisionRule | null, scenario: ScenarioIntake): OperationalBurden {
    const complexity = rule?.operationalComplexity ?? 'medium';

    return {
      staffingImplications: complexity === 'high'
        ? 'Requires dedicated operations team with specialist skills'
        : complexity === 'medium'
          ? 'Requires part-time operational support with cloud skills'
          : 'Minimal operational overhead with managed services',
      skillsRequired: this.getRequiredSkills(scenario),
      toolingRequired: ['Monitoring and alerting platform', 'CI/CD pipeline', 'Infrastructure as Code tooling'],
      ongoingMaintenance: complexity === 'high'
        ? 'Regular patching, capacity planning, and performance tuning required'
        : 'Periodic review and update of managed service configurations',
      complexity,
    };
  }

  private getRequiredSkills(scenario: ScenarioIntake): string[] {
    const skills: string[] = ['Cloud platform fundamentals'];

    if (scenario.steps.cloudPlatforms.availablePlatforms.includes('aws')) {
      skills.push('AWS service configuration');
    }
    if (scenario.steps.cloudPlatforms.availablePlatforms.includes('azure')) {
      skills.push('Azure service configuration');
    }
    if (scenario.steps.deployment.preference === 'containerised') {
      skills.push('Container orchestration (Kubernetes/ECS)');
    }
    if (scenario.steps.deployment.preference === 'serverless') {
      skills.push('Serverless architecture patterns');
    }

    return skills;
  }

  // -------------------------------------------------------------------------
  // Private: Cost considerations (Requirement 3.6)
  // -------------------------------------------------------------------------

  private buildCostConsiderations(domain: ArchitectureDomain, scenario: ScenarioIntake): CostConsideration {
    return {
      runningCosts: `Ongoing costs for ${domain} depend on usage patterns and chosen service tier.`,
      transitionCosts: 'Initial setup, migration, and team training costs apply.',
      costDrivers: [
        'Compute/storage usage',
        'Data transfer volumes',
        'Number of environments (dev, test, staging, production)',
        'Support tier selected',
      ],
      optimisationOpportunities: [
        'Reserved capacity for predictable workloads',
        'Right-sizing based on actual usage data',
        'Consolidation of non-production environments',
      ],
    };
  }

  // -------------------------------------------------------------------------
  // Private: Missing information detection (Requirement 11.1)
  // -------------------------------------------------------------------------

  private detectMissingInformation(scenario: ScenarioIntake): MissingInformation[] {
    const missing: MissingInformation[] = [];
    const steps = scenario.steps;

    if (!steps.recovery.rto || steps.recovery.rto.trim() === '') {
      missing.push({
        domain: 'resilience-dr',
        missingFields: ['recovery.rto'],
        impact: 'Cannot recommend appropriate disaster recovery strategy without RTO.',
        question: 'What is the maximum acceptable time to recover the service after a failure?',
      });
    }

    if (!steps.recovery.rpo || steps.recovery.rpo.trim() === '') {
      missing.push({
        domain: 'resilience-dr',
        missingFields: ['recovery.rpo'],
        impact: 'Cannot recommend appropriate backup strategy without RPO.',
        question: 'What is the maximum acceptable data loss in the event of a failure?',
      });
    }

    if (steps.integrations.systems.length === 0 && steps.integrations.protocols.length === 0) {
      missing.push({
        domain: 'integration-apis',
        missingFields: ['integrations.systems', 'integrations.protocols'],
        impact: 'Integration architecture cannot be fully assessed without knowing external dependencies.',
        question: 'What external systems does this service need to integrate with?',
      });
    }

    if (steps.cloudPlatforms.availablePlatforms.length === 0 && !steps.cloudPlatforms.noCloudAvailable) {
      missing.push({
        domain: 'hosting-compute',
        missingFields: ['cloudPlatforms.availablePlatforms'],
        impact: 'Cannot recommend specific cloud services without knowing available platforms.',
        question: 'Which cloud platforms does your organisation have access to (AWS, Azure, GCP)?',
      });
    }

    return missing;
  }

  // -------------------------------------------------------------------------
  // Private: Questions and evidence
  // -------------------------------------------------------------------------

  private generateQuestions(domain: ArchitectureDomain, scenario: ScenarioIntake): string[] {
    const questions: string[] = [
      `Has the ${domain.replace(/-/g, ' ')} approach been validated with the technical team?`,
      `Are there existing patterns or precedents for ${domain.replace(/-/g, ' ')} in your organisation?`,
    ];

    if (domain === 'security-controls' && scenario.steps.dataSensitivity.classification === 'official-sensitive') {
      questions.push('Has a security risk assessment been conducted for OFFICIAL-SENSITIVE data?');
    }

    if (domain === 'compliance-assurance') {
      questions.push('What governance approvals are required before implementation?');
    }

    return questions;
  }

  private generateEvidenceNeeded(domain: ArchitectureDomain): string[] {
    return [
      `Stakeholder sign-off on ${domain.replace(/-/g, ' ')} approach`,
      'Cost estimate for recommended option',
      'Proof of concept or spike results (if applicable)',
    ];
  }

  // -------------------------------------------------------------------------
  // Private: Persistence
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
