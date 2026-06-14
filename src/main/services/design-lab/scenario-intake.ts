// Architecture Design Lab — Scenario Intake Service
// Implements: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6

import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import type {
  ScenarioIntakeService as IScenarioIntakeService,
  ScenarioIntake,
  ScenarioSummary,
  WizardValidation,
  CloudPlatformStep,
  ServiceTypeStep,
  UserBaseStep,
  TrafficProfileStep,
  DataSensitivityStep,
  AvailabilityStep,
  RecoveryStep,
  IntegrationStep,
  DeploymentStep,
  TeamCapabilityStep,
  ConstraintsStep,
  NFRStep,
} from './types';
import { ScenarioValidationError } from './types';

// ---------------------------------------------------------------------------
// Step validation rules
// ---------------------------------------------------------------------------

type StepId = keyof ScenarioIntake['steps'];

interface StepValidator {
  stepId: StepId;
  validate(data: unknown): WizardValidation;
}

function createValidation(stepId: string, errors: Array<{ field: string; message: string }>): WizardValidation {
  return { stepId, isValid: errors.length === 0, errors };
}

const STEP_VALIDATORS: StepValidator[] = [
  {
    stepId: 'cloudPlatforms',
    validate(data: unknown): WizardValidation {
      const errors: Array<{ field: string; message: string }> = [];
      const step = data as Partial<CloudPlatformStep>;
      if (!step.noCloudAvailable && (!step.availablePlatforms || step.availablePlatforms.length === 0)) {
        errors.push({ field: 'availablePlatforms', message: 'Select at least one cloud platform or indicate no cloud is available.' });
      }
      return createValidation('cloudPlatforms', errors);
    },
  },
  {
    stepId: 'serviceType',
    validate(data: unknown): WizardValidation {
      const errors: Array<{ field: string; message: string }> = [];
      const step = data as Partial<ServiceTypeStep>;
      if (!step.type) {
        errors.push({ field: 'type', message: 'Select a service type.' });
      }
      if (!step.description || step.description.trim().length < 5) {
        errors.push({ field: 'description', message: 'Provide a brief description of the service (at least 5 characters).' });
      }
      return createValidation('serviceType', errors);
    },
  },
  {
    stepId: 'userBase',
    validate(data: unknown): WizardValidation {
      const errors: Array<{ field: string; message: string }> = [];
      const step = data as Partial<UserBaseStep>;
      if (!step.expectedUsers) {
        errors.push({ field: 'expectedUsers', message: 'Select the expected user base size.' });
      }
      return createValidation('userBase', errors);
    },
  },
  {
    stepId: 'trafficProfile',
    validate(data: unknown): WizardValidation {
      const errors: Array<{ field: string; message: string }> = [];
      const step = data as Partial<TrafficProfileStep>;
      if (!step.pattern) {
        errors.push({ field: 'pattern', message: 'Select a traffic pattern.' });
      }
      return createValidation('trafficProfile', errors);
    },
  },
  {
    stepId: 'dataSensitivity',
    validate(data: unknown): WizardValidation {
      const errors: Array<{ field: string; message: string }> = [];
      const step = data as Partial<DataSensitivityStep>;
      if (!step.classification) {
        errors.push({ field: 'classification', message: 'Select a data sensitivity classification.' });
      }
      if (step.containsPII === undefined) {
        errors.push({ field: 'containsPII', message: 'Indicate whether the system processes personal data.' });
      }
      return createValidation('dataSensitivity', errors);
    },
  },
  {
    stepId: 'availability',
    validate(data: unknown): WizardValidation {
      const errors: Array<{ field: string; message: string }> = [];
      const step = data as Partial<AvailabilityStep>;
      if (!step.targetAvailability) {
        errors.push({ field: 'targetAvailability', message: 'Select a target availability level.' });
      }
      if (step.maintenanceWindow === undefined) {
        errors.push({ field: 'maintenanceWindow', message: 'Indicate whether a maintenance window is acceptable.' });
      }
      return createValidation('availability', errors);
    },
  },
  {
    stepId: 'recovery',
    validate(data: unknown): WizardValidation {
      const errors: Array<{ field: string; message: string }> = [];
      const step = data as Partial<RecoveryStep>;
      if (!step.rto || step.rto.trim().length === 0) {
        errors.push({ field: 'rto', message: 'Specify the Recovery Time Objective (RTO).' });
      }
      if (!step.rpo || step.rpo.trim().length === 0) {
        errors.push({ field: 'rpo', message: 'Specify the Recovery Point Objective (RPO).' });
      }
      return createValidation('recovery', errors);
    },
  },
  {
    stepId: 'integrations',
    validate(data: unknown): WizardValidation {
      // Integrations are optional — no mandatory fields
      return createValidation('integrations', []);
    },
  },
  {
    stepId: 'deployment',
    validate(data: unknown): WizardValidation {
      const errors: Array<{ field: string; message: string }> = [];
      const step = data as Partial<DeploymentStep>;
      if (!step.preference) {
        errors.push({ field: 'preference', message: 'Select a deployment model preference.' });
      }
      return createValidation('deployment', errors);
    },
  },
  {
    stepId: 'teamCapability',
    validate(data: unknown): WizardValidation {
      const errors: Array<{ field: string; message: string }> = [];
      const step = data as Partial<TeamCapabilityStep>;
      if (!step.teamSize) {
        errors.push({ field: 'teamSize', message: 'Select the team size.' });
      }
      if (!step.cloudExperience) {
        errors.push({ field: 'cloudExperience', message: 'Select the team cloud experience level.' });
      }
      return createValidation('teamCapability', errors);
    },
  },
  {
    stepId: 'constraints',
    validate(data: unknown): WizardValidation {
      // Constraints are optional — no mandatory fields
      return createValidation('constraints', []);
    },
  },
  {
    stepId: 'nfrs',
    validate(data: unknown): WizardValidation {
      // NFRs are optional — no mandatory fields
      return createValidation('nfrs', []);
    },
  },
];

// ---------------------------------------------------------------------------
// Default empty steps
// ---------------------------------------------------------------------------

function createEmptySteps(): ScenarioIntake['steps'] {
  return {
    cloudPlatforms: { availablePlatforms: [], noCloudAvailable: false },
    serviceType: { type: 'other', description: '' },
    userBase: { expectedUsers: 'under-100', userTypes: [] },
    trafficProfile: { pattern: 'steady' },
    dataSensitivity: { classification: 'official', containsPII: false, containsSpecialCategory: false },
    availability: { targetAvailability: '99.9', maintenanceWindow: true },
    recovery: { rto: '', rpo: '' },
    integrations: { systems: [], protocols: [] },
    deployment: { preference: 'no-preference' },
    teamCapability: { teamSize: 'small-2-5', cloudExperience: 'basic', relevantSkills: [] },
    constraints: {},
    nfrs: {},
  };
}

// ---------------------------------------------------------------------------
// Mandatory steps (used for completeness calculation)
// ---------------------------------------------------------------------------

const MANDATORY_STEPS: StepId[] = [
  'cloudPlatforms',
  'serviceType',
  'userBase',
  'trafficProfile',
  'dataSensitivity',
  'availability',
  'recovery',
  'deployment',
  'teamCapability',
];

// ---------------------------------------------------------------------------
// Scenario Intake Service Implementation
// ---------------------------------------------------------------------------

export class ScenarioIntakeServiceImpl implements IScenarioIntakeService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  createScenario(name: string): ScenarioIntake {
    const id = randomUUID();
    const now = new Date();
    const steps = createEmptySteps();

    const scenario: ScenarioIntake = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      status: 'draft',
      steps,
    };

    this.db.prepare(`
      INSERT INTO design_lab_scenarios (id, name, status, steps_json, completeness, created_at, updated_at)
      VALUES (?, ?, 'draft', ?, 0, datetime('now'), datetime('now'))
    `).run(id, name, JSON.stringify(steps));

    return scenario;
  }

  saveStep(scenarioId: string, stepId: string, data: unknown): WizardValidation {
    const validator = STEP_VALIDATORS.find((v) => v.stepId === stepId);
    if (!validator) {
      return createValidation(stepId, [{ field: 'stepId', message: `Unknown step: ${stepId}` }]);
    }

    const validation = validator.validate(data);

    // Save regardless of validation (allows partial saves)
    const row = this.db.prepare(
      'SELECT steps_json FROM design_lab_scenarios WHERE id = ?',
    ).get(scenarioId) as { steps_json: string } | undefined;

    if (!row) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const steps = JSON.parse(row.steps_json);
    steps[stepId] = data;

    const completeness = this.calculateCompleteness(steps);

    this.db.prepare(`
      UPDATE design_lab_scenarios
      SET steps_json = ?, completeness = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(JSON.stringify(steps), completeness, scenarioId);

    return validation;
  }

  getScenario(scenarioId: string): ScenarioIntake {
    const row = this.db.prepare(
      'SELECT * FROM design_lab_scenarios WHERE id = ?',
    ).get(scenarioId) as {
      id: string;
      name: string;
      status: 'draft' | 'complete';
      steps_json: string;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!row) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    return {
      id: row.id,
      name: row.name,
      status: row.status,
      steps: JSON.parse(row.steps_json),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  listScenarios(): ScenarioIntake[] {
    const rows = this.db.prepare(
      'SELECT * FROM design_lab_scenarios ORDER BY updated_at DESC',
    ).all() as Array<{
      id: string;
      name: string;
      status: 'draft' | 'complete';
      steps_json: string;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      steps: JSON.parse(row.steps_json),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  deleteScenario(scenarioId: string): void {
    this.db.prepare('DELETE FROM design_lab_scenarios WHERE id = ?').run(scenarioId);
  }

  validateScenario(scenarioId: string): WizardValidation[] {
    const scenario = this.getScenario(scenarioId);
    const results: WizardValidation[] = [];

    for (const validator of STEP_VALIDATORS) {
      const stepData = scenario.steps[validator.stepId];
      results.push(validator.validate(stepData));
    }

    return results;
  }

  getSummary(scenarioId: string): ScenarioSummary {
    const scenario = this.getScenario(scenarioId);
    const steps = scenario.steps;
    const validations = this.validateScenario(scenarioId);

    const missingFields = validations
      .filter((v) => !v.isValid)
      .flatMap((v) => v.errors.map((e) => `${v.stepId}.${e.field}`));

    const completeness = this.calculateCompleteness(steps);

    return {
      scenarioId: scenario.id,
      name: scenario.name,
      cloudPlatforms: steps.cloudPlatforms.noCloudAvailable
        ? ['none']
        : steps.cloudPlatforms.availablePlatforms,
      serviceType: steps.serviceType.type,
      dataClassification: steps.dataSensitivity.classification,
      availability: steps.availability.targetAvailability,
      completeness,
      missingFields,
    };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private calculateCompleteness(steps: Record<string, unknown>): number {
    let validCount = 0;

    for (const stepId of MANDATORY_STEPS) {
      const validator = STEP_VALIDATORS.find((v) => v.stepId === stepId);
      if (validator) {
        const validation = validator.validate(steps[stepId] ?? {});
        if (validation.isValid) {
          validCount++;
        }
      }
    }

    return Math.round((validCount / MANDATORY_STEPS.length) * 100);
  }
}
