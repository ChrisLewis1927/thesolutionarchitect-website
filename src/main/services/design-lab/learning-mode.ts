// Architecture Design Lab — Learning Mode Service
// Implements: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6

import { readFileSync } from 'fs';
import { join } from 'path';
import type {
  LearningModeService as ILearningModeService,
  LearningContent,
  AntiPattern,
  ArchitectureDomain,
} from './types';
import { ContentNotFoundError } from './types';

// ---------------------------------------------------------------------------
// Learning Mode Service Implementation
// ---------------------------------------------------------------------------

export class LearningModeServiceImpl implements ILearningModeService {
  private contentPath: string;
  private antiPatternCache: Map<ArchitectureDomain, AntiPattern[]> = new Map();
  private governanceCache: Map<ArchitectureDomain, string[]> = new Map();

  constructor(contentPath: string) {
    this.contentPath = contentPath;
  }

  /**
   * Returns learning content for a specific domain and pattern combination.
   */
  getContent(domain: ArchitectureDomain, patternName: string): LearningContent {
    const antiPatterns = this.getAntiPatterns(domain);
    const governanceExpectations = this.getGovernanceExpectations(domain);
    const stakeholderChallenges = this.loadStakeholderChallenges(domain);

    return {
      domain,
      patternName,
      whySelected: this.buildWhySelected(domain, patternName),
      whenInappropriate: this.buildWhenInappropriate(domain, patternName),
      architectQuestions: this.buildArchitectQuestions(domain),
      antiPatterns,
      stakeholderChallenges,
      governanceExpectations,
    };
  }

  /**
   * Returns anti-patterns for a specific domain.
   */
  getAntiPatterns(domain: ArchitectureDomain): AntiPattern[] {
    if (this.antiPatternCache.has(domain)) {
      return this.antiPatternCache.get(domain)!;
    }

    try {
      const filePath = join(this.contentPath, 'learning', 'anti-patterns', `${domain}.json`);
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as { antiPatterns: AntiPattern[] };
      const antiPatterns = data.antiPatterns ?? [];
      this.antiPatternCache.set(domain, antiPatterns);
      return antiPatterns;
    } catch {
      // Return sensible defaults if content file not found
      const defaults = this.getDefaultAntiPatterns(domain);
      this.antiPatternCache.set(domain, defaults);
      return defaults;
    }
  }

  /**
   * Returns governance expectations for a specific domain.
   */
  getGovernanceExpectations(domain: ArchitectureDomain): string[] {
    if (this.governanceCache.has(domain)) {
      return this.governanceCache.get(domain)!;
    }

    try {
      const filePath = join(this.contentPath, 'learning', 'governance-expectations', `${domain}.json`);
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as { expectations: string[] };
      const expectations = data.expectations ?? [];
      this.governanceCache.set(domain, expectations);
      return expectations;
    } catch {
      const defaults = this.getDefaultGovernanceExpectations(domain);
      this.governanceCache.set(domain, defaults);
      return defaults;
    }
  }

  // -------------------------------------------------------------------------
  // Private: Content builders
  // -------------------------------------------------------------------------

  private buildWhySelected(domain: ArchitectureDomain, patternName: string): string {
    return `The "${patternName}" pattern was selected for ${domain.replace(/-/g, ' ')} because it aligns with the scenario inputs, ` +
      `balances operational complexity with capability requirements, and follows UK government best practices ` +
      `including the Technology Code of Practice and Secure by Design principles.`;
  }

  private buildWhenInappropriate(domain: ArchitectureDomain, patternName: string): string[] {
    const domainSpecific: Record<string, string[]> = {
      'hosting-compute': [
        'When the workload has extreme low-latency requirements that managed services cannot meet',
        'When regulatory requirements mandate specific hardware or location controls',
        'When the team has no cloud experience and no training budget',
      ],
      'data-persistence': [
        'When data volumes exceed the capacity of the recommended storage tier',
        'When complex graph relationships are the primary access pattern',
        'When real-time streaming is the dominant data flow',
      ],
      'security-controls': [
        'When the data classification changes to SECRET or above',
        'When cross-domain connectivity is required',
        'When the threat model identifies nation-state actors as primary threat',
      ],
    };

    return domainSpecific[domain] ?? [
      `When the scenario inputs change significantly from the current assessment`,
      `When team capability or budget constraints make the pattern impractical`,
      `When new regulatory requirements invalidate the current approach`,
    ];
  }

  private buildArchitectQuestions(domain: ArchitectureDomain): string[] {
    const questions: Record<string, string[]> = {
      'hosting-compute': [
        'What happens when this component fails? Is there a fallback?',
        'How does this scale under 10x the expected load?',
        'What is the blast radius if this component is compromised?',
      ],
      'data-persistence': [
        'What is the data lifecycle from creation to deletion?',
        'How do we handle data migration if we need to change storage technology?',
        'What happens to data integrity during a partial failure?',
      ],
      'security-controls': [
        'What is the attack surface and how is it minimised?',
        'How do we detect and respond to a breach?',
        'What is the principle of least privilege implementation?',
      ],
      'resilience-dr': [
        'What is the recovery procedure and has it been tested?',
        'What data loss is acceptable in a disaster scenario?',
        'How long can the business operate without this service?',
      ],
    };

    return questions[domain] ?? [
      `What are the failure modes for this ${domain.replace(/-/g, ' ')} approach?`,
      'What evidence supports this being the right choice?',
      'What would an experienced architect challenge about this decision?',
    ];
  }

  // -------------------------------------------------------------------------
  // Private: Stakeholder challenges
  // -------------------------------------------------------------------------

  private loadStakeholderChallenges(domain: ArchitectureDomain): LearningContent['stakeholderChallenges'] {
    try {
      const filePath = join(this.contentPath, 'learning', 'stakeholder-challenges', `${domain}.json`);
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as { challenges: LearningContent['stakeholderChallenges'] };
      return data.challenges ?? this.getDefaultStakeholderChallenges();
    } catch {
      return this.getDefaultStakeholderChallenges();
    }
  }

  private getDefaultStakeholderChallenges(): LearningContent['stakeholderChallenges'] {
    return [
      {
        stakeholder: 'security',
        typicalChallenges: [
          'How does this meet Secure by Design principles?',
          'What is the threat model?',
          'How are secrets managed?',
        ],
      },
      {
        stakeholder: 'operations',
        typicalChallenges: [
          'How do we monitor and alert on this?',
          'What is the support model?',
          'How do we patch and update?',
        ],
      },
      {
        stakeholder: 'delivery',
        typicalChallenges: [
          'Can we deliver this within the timeline?',
          'Do we have the skills in the team?',
          'What are the dependencies?',
        ],
      },
      {
        stakeholder: 'finance',
        typicalChallenges: [
          'What are the ongoing running costs?',
          'How does cost scale with usage?',
          'Are there cheaper alternatives?',
        ],
      },
    ];
  }

  // -------------------------------------------------------------------------
  // Private: Default content
  // -------------------------------------------------------------------------

  private getDefaultAntiPatterns(domain: ArchitectureDomain): AntiPattern[] {
    return [
      {
        name: 'Premature optimisation',
        description: `Over-engineering the ${domain.replace(/-/g, ' ')} solution before understanding actual requirements.`,
        whyProblematic: 'Adds complexity and cost without proven benefit. Makes the system harder to change.',
        betterApproach: 'Start simple, measure, then optimise based on evidence.',
      },
      {
        name: 'Ignoring operational burden',
        description: 'Choosing a technically elegant solution without considering who will operate it.',
        whyProblematic: 'Leads to unsupported systems, incidents, and eventual replacement.',
        betterApproach: 'Always consider the operational model alongside the technical design.',
      },
    ];
  }

  private getDefaultGovernanceExpectations(domain: ArchitectureDomain): string[] {
    return [
      `Evidence that ${domain.replace(/-/g, ' ')} approach aligns with the Technology Code of Practice`,
      'Risk assessment with mitigations for identified risks',
      'Cost estimate covering both transition and ongoing running costs',
      'Confirmation that the approach has been reviewed by relevant stakeholders',
      'Evidence of compliance with applicable standards and regulations',
    ];
  }
}
