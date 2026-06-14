// Architecture Design Lab — Discovery Generator
// Implements: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9

import { randomUUID } from 'crypto';
import type {
  DiscoveryGenerator as IDiscoveryGenerator,
  DiscoveryOutput,
  DiscoveryRequirement,
  FunctionalCategory,
  NonFunctionalCategory,
  ScenarioIntake,
  SolutionPremise,
} from './types';

// ---------------------------------------------------------------------------
// Keyword-to-category mapping for rule-based text analysis
// ---------------------------------------------------------------------------

interface KeywordRule {
  keywords: string[];
  category: FunctionalCategory | NonFunctionalCategory;
  type: 'functional' | 'non-functional';
  templateDescription: string;
  templateRationale: string;
  discoveryQuestions: string[];
}

const FUNCTIONAL_RULES: KeywordRule[] = [
  {
    keywords: ['user', 'citizen', 'customer', 'login', 'register', 'account', 'portal', 'form', 'submit'],
    category: 'user-interactions',
    type: 'functional',
    templateDescription: 'The system shall provide user-facing interactions allowing users to access, submit, and manage information through a digital interface.',
    templateRationale: 'The premise implies direct user interaction with the system, requiring consideration of user journeys, accessibility, and usability.',
    discoveryQuestions: [
      'Who are the primary user groups and what are their digital literacy levels?',
      'What are the key user journeys through the system?',
      'Are there accessibility requirements beyond WCAG 2.1 AA?',
    ],
  },
  {
    keywords: ['data', 'store', 'database', 'record', 'process', 'calculate', 'transform', 'report', 'analytics'],
    category: 'data-processing',
    type: 'functional',
    templateDescription: 'The system shall process, store, and manage data according to defined business rules, supporting both transactional operations and reporting needs.',
    templateRationale: 'The premise implies data processing requirements that need careful consideration of data models, retention, and processing patterns.',
    discoveryQuestions: [
      'What data entities are central to the system?',
      'What are the data retention and archival requirements?',
      'Are there real-time processing requirements or is batch processing acceptable?',
    ],
  },
  {
    keywords: ['integrate', 'api', 'connect', 'interface', 'external', 'third-party', 'legacy', 'feed', 'sync'],
    category: 'integrations',
    type: 'functional',
    templateDescription: 'The system shall integrate with external systems and services, exchanging data through defined interfaces and protocols.',
    templateRationale: 'The premise implies integration needs that require understanding of external system dependencies, data formats, and synchronisation patterns.',
    discoveryQuestions: [
      'What external systems need to be integrated and who owns them?',
      'What protocols and data formats do the external systems support?',
      'What are the SLAs and availability guarantees of external dependencies?',
    ],
  },
  {
    keywords: ['approve', 'workflow', 'rule', 'policy', 'validate', 'check', 'decision', 'notify', 'alert', 'schedule'],
    category: 'business-rules',
    type: 'functional',
    templateDescription: 'The system shall enforce business rules governing workflows, approvals, validations, and automated decision-making processes.',
    templateRationale: 'The premise implies business logic that needs to be captured, validated with stakeholders, and implemented consistently.',
    discoveryQuestions: [
      'What are the key business rules and who defines them?',
      'Are there approval workflows and what are the escalation paths?',
      'How frequently do business rules change and who authorises changes?',
    ],
  },
];

const NON_FUNCTIONAL_RULES: KeywordRule[] = [
  {
    keywords: ['fast', 'performance', 'response time', 'latency', 'throughput', 'speed', 'real-time'],
    category: 'performance',
    type: 'non-functional',
    templateDescription: 'The system shall meet defined performance targets for response times, throughput, and resource utilisation under expected and peak load conditions.',
    templateRationale: 'Performance requirements directly impact architecture choices around caching, scaling, and infrastructure sizing.',
    discoveryQuestions: [
      'What are the acceptable response times for key user interactions?',
      'What is the expected peak load and how does it compare to average load?',
      'Are there batch processing windows with specific completion time requirements?',
    ],
  },
  {
    keywords: ['secure', 'security', 'encrypt', 'auth', 'protect', 'sensitive', 'classified', 'pii', 'gdpr'],
    category: 'security',
    type: 'non-functional',
    templateDescription: 'The system shall implement security controls appropriate to the data classification, protecting against unauthorised access, data breaches, and cyber threats.',
    templateRationale: 'Security requirements are fundamental to UK government systems and must be addressed from the outset following Secure by Design principles.',
    discoveryQuestions: [
      'What is the data classification (OFFICIAL, OFFICIAL-SENSITIVE, SECRET)?',
      'Does the system process personal data subject to UK GDPR?',
      'What authentication and authorisation model is required?',
    ],
  },
  {
    keywords: ['available', 'uptime', 'downtime', '24/7', 'always-on', 'resilient', 'failover'],
    category: 'availability',
    type: 'non-functional',
    templateDescription: 'The system shall maintain defined availability targets with appropriate resilience measures to minimise unplanned downtime.',
    templateRationale: 'Availability requirements drive decisions about redundancy, disaster recovery, and operational support models.',
    discoveryQuestions: [
      'What is the target availability percentage (e.g., 99.9%)?',
      'Is there an acceptable maintenance window?',
      'What is the business impact of unplanned downtime?',
    ],
  },
  {
    keywords: ['scale', 'grow', 'expand', 'elastic', 'peak', 'burst', 'capacity'],
    category: 'scalability',
    type: 'non-functional',
    templateDescription: 'The system shall scale to accommodate growth in users, data volume, and transaction throughput without degradation of service quality.',
    templateRationale: 'Scalability requirements influence the choice of compute model, data storage, and architectural patterns.',
    discoveryQuestions: [
      'What is the expected growth trajectory over the next 1-3 years?',
      'Are there seasonal or event-driven traffic spikes?',
      'Should the system scale automatically or is manual scaling acceptable?',
    ],
  },
  {
    keywords: ['accessible', 'wcag', 'disability', 'inclusive', 'usable', 'user experience', 'ux'],
    category: 'usability',
    type: 'non-functional',
    templateDescription: 'The system shall be accessible and usable by all users, meeting WCAG 2.1 AA standards and following GDS design patterns.',
    templateRationale: 'UK government services must meet accessibility requirements by law and follow the GDS Service Standard.',
    discoveryQuestions: [
      'Are there specific user groups with additional accessibility needs?',
      'Will the service undergo a GDS service assessment?',
      'Are there existing design patterns or component libraries to follow?',
    ],
  },
  {
    keywords: ['maintain', 'support', 'update', 'deploy', 'release', 'patch', 'upgrade', 'technical debt'],
    category: 'maintainability',
    type: 'non-functional',
    templateDescription: 'The system shall be designed for ease of maintenance, supporting regular updates, patching, and evolution without excessive operational burden.',
    templateRationale: 'Maintainability requirements affect technology choices, code quality standards, and the long-term cost of ownership.',
    discoveryQuestions: [
      'What is the expected lifespan of the system?',
      'What team will maintain the system post-delivery?',
      'Are there constraints on technology choices that affect maintainability?',
    ],
  },
  {
    keywords: ['comply', 'regulation', 'standard', 'audit', 'governance', 'policy', 'legal', 'retention'],
    category: 'compliance',
    type: 'non-functional',
    templateDescription: 'The system shall comply with applicable regulations, standards, and organisational policies, supporting audit and governance requirements.',
    templateRationale: 'Compliance requirements are non-negotiable in government and must be identified early to avoid costly rework.',
    discoveryQuestions: [
      'What regulations apply (UK GDPR, sector-specific, departmental)?',
      'Are there audit trail requirements?',
      'What governance approvals are needed before go-live?',
    ],
  },
  {
    keywords: ['monitor', 'operate', 'incident', 'alert', 'log', 'observe', 'on-call', 'sla'],
    category: 'operability',
    type: 'non-functional',
    templateDescription: 'The system shall be designed for operational excellence with appropriate monitoring, alerting, logging, and incident response capabilities.',
    templateRationale: 'Operability requirements determine the support model, tooling needs, and ongoing operational costs.',
    discoveryQuestions: [
      'What is the support model (in-hours, extended hours, 24/7)?',
      'What monitoring and alerting tools are already in use?',
      'What are the incident response and escalation requirements?',
    ],
  },
];

// ---------------------------------------------------------------------------
// Ambiguity detection keywords
// ---------------------------------------------------------------------------

const AMBIGUITY_INDICATORS = [
  'might', 'maybe', 'possibly', 'could', 'some', 'various',
  'etc', 'and so on', 'tbd', 'to be determined', 'unclear',
  'not sure', 'perhaps', 'likely', 'probably',
];

// ---------------------------------------------------------------------------
// Discovery Generator Implementation
// ---------------------------------------------------------------------------

export class DiscoveryGeneratorImpl implements IDiscoveryGenerator {
  private outputs: Map<string, DiscoveryOutput> = new Map();

  /**
   * Analyses a solution premise and produces categorised functional and
   * non-functional requirements with discovery questions.
   */
  analyse(premise: SolutionPremise): DiscoveryOutput {
    if (!premise.description || premise.description.trim().length < 10) {
      throw new Error('Solution premise must be at least 10 characters long.');
    }

    const text = `${premise.description} ${premise.additionalContext ?? ''}`.toLowerCase();
    const functionalReqs = this.extractRequirements(text, FUNCTIONAL_RULES);
    const nonFunctionalReqs = this.extractRequirements(text, NON_FUNCTIONAL_RULES);

    // Always include security and compliance for government systems
    if (!nonFunctionalReqs.some((r) => r.category === 'security')) {
      nonFunctionalReqs.push(this.createDefaultRequirement('security', NON_FUNCTIONAL_RULES));
    }
    if (!nonFunctionalReqs.some((r) => r.category === 'compliance')) {
      nonFunctionalReqs.push(this.createDefaultRequirement('compliance', NON_FUNCTIONAL_RULES));
    }

    // Detect ambiguity in the premise
    const ambiguousAreas = this.detectAmbiguity(text);
    const globalDiscoveryQuestions = this.generateGlobalQuestions(text, ambiguousAreas);

    // Mark requirements as ambiguous if the premise is vague in their area
    for (const req of [...functionalReqs, ...nonFunctionalReqs]) {
      if (this.isAreaAmbiguous(text, req.category)) {
        req.isAmbiguous = true;
        req.ambiguityNote = `The premise does not provide specific detail about ${req.category.replace(/-/g, ' ')}. Stakeholder input is needed to refine this requirement.`;
      }
    }

    const output: DiscoveryOutput = {
      premiseId: randomUUID(),
      premise: premise.description,
      functionalRequirements: functionalReqs,
      nonFunctionalRequirements: nonFunctionalReqs,
      discoveryQuestions: globalDiscoveryQuestions,
      generatedAt: new Date(),
    };

    this.outputs.set(output.premiseId, output);
    return output;
  }

  /**
   * Updates a specific requirement within a discovery output.
   */
  updateRequirement(
    outputId: string,
    reqId: string,
    updated: Partial<DiscoveryRequirement>,
  ): DiscoveryOutput {
    const output = this.getOutput(outputId);
    const allReqs = [...output.functionalRequirements, ...output.nonFunctionalRequirements];
    const req = allReqs.find((r) => r.id === reqId);

    if (!req) {
      throw new Error(`Requirement ${reqId} not found in output ${outputId}`);
    }

    Object.assign(req, updated);
    output.functionalRequirements = output.functionalRequirements.map((r) =>
      r.id === reqId ? { ...r, ...updated } : r,
    );
    output.nonFunctionalRequirements = output.nonFunctionalRequirements.map((r) =>
      r.id === reqId ? { ...r, ...updated } : r,
    );

    this.outputs.set(outputId, output);
    return output;
  }

  /**
   * Removes a requirement from a discovery output.
   */
  removeRequirement(outputId: string, reqId: string): DiscoveryOutput {
    const output = this.getOutput(outputId);

    output.functionalRequirements = output.functionalRequirements.filter(
      (r) => r.id !== reqId,
    );
    output.nonFunctionalRequirements = output.nonFunctionalRequirements.filter(
      (r) => r.id !== reqId,
    );

    this.outputs.set(outputId, output);
    return output;
  }

  /**
   * Adds a new requirement to a discovery output.
   */
  addRequirement(
    outputId: string,
    req: Omit<DiscoveryRequirement, 'id'>,
  ): DiscoveryOutput {
    const output = this.getOutput(outputId);
    const newReq: DiscoveryRequirement = { ...req, id: randomUUID() };

    if (newReq.type === 'functional') {
      output.functionalRequirements.push(newReq);
    } else {
      output.nonFunctionalRequirements.push(newReq);
    }

    this.outputs.set(outputId, output);
    return output;
  }

  /**
   * Exports the discovery output as formatted text suitable for
   * discovery session packs and stakeholder workshops.
   */
  exportForDiscoveryPack(output: DiscoveryOutput): string {
    const lines: string[] = [];

    lines.push('# Discovery Requirements');
    lines.push('');
    lines.push(`## Solution Premise`);
    lines.push('');
    lines.push(output.premise);
    lines.push('');

    lines.push('## Functional Requirements');
    lines.push('');
    for (const req of output.functionalRequirements) {
      lines.push(`### ${req.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`);
      lines.push('');
      lines.push(`**Requirement:** ${req.description}`);
      lines.push('');
      lines.push(`**Rationale:** ${req.rationale}`);
      lines.push('');
      if (req.isAmbiguous && req.ambiguityNote) {
        lines.push(`⚠️ **Ambiguity:** ${req.ambiguityNote}`);
        lines.push('');
      }
      if (req.discoveryQuestions.length > 0) {
        lines.push('**Discovery Questions:**');
        for (const q of req.discoveryQuestions) {
          lines.push(`- ${q}`);
        }
        lines.push('');
      }
    }

    lines.push('## Non-Functional Requirements');
    lines.push('');
    for (const req of output.nonFunctionalRequirements) {
      lines.push(`### ${req.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`);
      lines.push('');
      lines.push(`**Requirement:** ${req.description}`);
      lines.push('');
      lines.push(`**Rationale:** ${req.rationale}`);
      lines.push('');
      if (req.isAmbiguous && req.ambiguityNote) {
        lines.push(`⚠️ **Ambiguity:** ${req.ambiguityNote}`);
        lines.push('');
      }
      if (req.discoveryQuestions.length > 0) {
        lines.push('**Discovery Questions:**');
        for (const q of req.discoveryQuestions) {
          lines.push(`- ${q}`);
        }
        lines.push('');
      }
    }

    if (output.discoveryQuestions.length > 0) {
      lines.push('## General Discovery Questions');
      lines.push('');
      for (const q of output.discoveryQuestions) {
        lines.push(`- ${q}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Maps discovery output to a partial ScenarioIntake for pre-filling
   * the scenario intake wizard.
   */
  toScenarioIntakePreFill(output: DiscoveryOutput): Partial<ScenarioIntake> {
    const partial: Partial<ScenarioIntake> = {
      name: output.premise.slice(0, 80),
      steps: {} as ScenarioIntake['steps'],
    };

    // Pre-fill NFR step from non-functional requirements
    const nfrStep: Partial<ScenarioIntake['steps']['nfrs']> = {};
    for (const req of output.nonFunctionalRequirements) {
      switch (req.category) {
        case 'performance':
          nfrStep.performanceRequirements = req.description;
          break;
        case 'security':
          nfrStep.securityRequirements = req.description;
          break;
        case 'compliance':
          nfrStep.complianceRequirements = req.description;
          break;
        case 'usability':
          nfrStep.accessibilityRequirements = req.description;
          break;
      }
    }

    if (Object.keys(nfrStep).length > 0) {
      (partial.steps as Partial<ScenarioIntake['steps']>).nfrs = nfrStep as ScenarioIntake['steps']['nfrs'];
    }

    return partial;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private getOutput(outputId: string): DiscoveryOutput {
    const output = this.outputs.get(outputId);
    if (!output) {
      throw new Error(`Discovery output ${outputId} not found`);
    }
    return { ...output };
  }

  private extractRequirements(text: string, rules: KeywordRule[]): DiscoveryRequirement[] {
    const requirements: DiscoveryRequirement[] = [];

    for (const rule of rules) {
      const matched = rule.keywords.some((kw) => text.includes(kw));
      if (matched) {
        requirements.push({
          id: randomUUID(),
          category: rule.category,
          type: rule.type,
          description: rule.templateDescription,
          rationale: rule.templateRationale,
          discoveryQuestions: [...rule.discoveryQuestions],
          isAmbiguous: false,
        });
      }
    }

    return requirements;
  }

  private createDefaultRequirement(
    category: NonFunctionalCategory,
    rules: KeywordRule[],
  ): DiscoveryRequirement {
    const rule = rules.find((r) => r.category === category);
    if (!rule) {
      return {
        id: randomUUID(),
        category,
        type: 'non-functional',
        description: `The system shall address ${category} requirements appropriate to a UK government service.`,
        rationale: `${category} is a mandatory consideration for government digital services.`,
        discoveryQuestions: [`What specific ${category} requirements apply to this service?`],
        isAmbiguous: true,
        ambiguityNote: `No specific ${category} information was provided in the premise. This needs stakeholder clarification.`,
      };
    }

    return {
      id: randomUUID(),
      category: rule.category,
      type: rule.type,
      description: rule.templateDescription,
      rationale: rule.templateRationale,
      discoveryQuestions: [...rule.discoveryQuestions],
      isAmbiguous: true,
      ambiguityNote: `No specific ${category} information was provided in the premise. This is a default requirement for government services.`,
    };
  }

  private detectAmbiguity(text: string): string[] {
    return AMBIGUITY_INDICATORS.filter((indicator) => text.includes(indicator));
  }

  private isAreaAmbiguous(text: string, category: string): boolean {
    // If the text is short or contains ambiguity indicators near the category keywords, mark as ambiguous
    const categoryKeywords = [...FUNCTIONAL_RULES, ...NON_FUNCTIONAL_RULES]
      .find((r) => r.category === category)?.keywords ?? [];

    const hasStrongSignal = categoryKeywords.filter((kw) => text.includes(kw)).length >= 2;
    return !hasStrongSignal;
  }

  private generateGlobalQuestions(text: string, ambiguousAreas: string[]): string[] {
    const questions: string[] = [
      'What is the expected timeline for delivery?',
      'What budget constraints apply to this project?',
      'Who are the key stakeholders and decision-makers?',
    ];

    if (ambiguousAreas.length > 0) {
      questions.push(
        'Several areas of the premise are ambiguous. Can you provide more specific detail on the scope and boundaries of the system?',
      );
    }

    if (!text.includes('team') && !text.includes('staff')) {
      questions.push('What team will build and maintain this system? What are their skills and capacity?');
    }

    if (!text.includes('cloud') && !text.includes('hosting') && !text.includes('infrastructure')) {
      questions.push('What hosting and infrastructure is available or preferred?');
    }

    return questions;
  }
}
