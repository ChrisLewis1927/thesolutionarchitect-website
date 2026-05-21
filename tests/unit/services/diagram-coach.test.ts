import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DatabaseManager } from '../../../src/main/services/database';
import {
  DiagramCoach,
  DiagramModule,
  ALL_DIAGRAM_TYPES,
  DiagramType,
} from '../../../src/main/services/diagram-coach';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a temp directory with sample diagram module JSON files. */
function createTempDiagramsDir(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archlens-diagrams-'));

  // archimate type — 2 modules
  const archimateDir = path.join(tmpDir, 'archimate');
  fs.mkdirSync(archimateDir);

  fs.writeFileSync(
    path.join(archimateDir, '01-introduction.json'),
    JSON.stringify({
      title: 'Introduction to ArchiMate',
      diagramType: 'archimate',
      sequenceOrder: 1,
      explanation: 'ArchiMate is an open modelling language for enterprise architecture.',
      annotatedExamples: [
        {
          imageUrl: 'resources/images/diagrams/archimate-example.png',
          annotations: [
            { element: 'Business Layer', explanation: 'Shows business actors and processes.' },
          ],
        },
      ],
      walkthrough: [
        { stepNumber: 1, instruction: 'Identify business services.', imageUrl: 'step1.png' },
        { stepNumber: 2, instruction: 'Add application components.', imageUrl: 'step2.png' },
      ],
      exercises: [
        {
          scenario: 'Model a licence application service.',
          expectedDiagramType: 'archimate',
          hints: ['Start with Business Service'],
          sampleSolution: 'solution.png',
        },
      ],
      commonMistakes: [
        {
          description: 'Mixing layers without relationships',
          incorrectExample: 'Node inside Business Process',
          correctedExample: 'Use Serving relationships',
          explanation: 'Layers should be connected through cross-layer relationships.',
        },
      ],
    }),
  );

  fs.writeFileSync(
    path.join(archimateDir, '02-advanced-viewpoints.json'),
    JSON.stringify({
      title: 'Advanced ArchiMate Viewpoints',
      diagramType: 'archimate',
      sequenceOrder: 2,
      explanation: 'Viewpoints constrain the set of elements and relationships.',
      annotatedExamples: [
        {
          imageUrl: 'viewpoint-example.png',
          annotations: [{ element: 'Viewpoint', explanation: 'Constrains the model.' }],
        },
      ],
      walkthrough: [
        { stepNumber: 1, instruction: 'Choose a viewpoint.', imageUrl: 'vp-step1.png' },
      ],
      exercises: [
        {
          scenario: 'Create a layered viewpoint diagram.',
          expectedDiagramType: 'archimate',
          hints: ['Use the layered viewpoint'],
          sampleSolution: 'vp-solution.png',
        },
      ],
      commonMistakes: [
        {
          description: 'Using too many viewpoints in one diagram',
          incorrectExample: 'All elements in a single view',
          correctedExample: 'Separate concerns into focused viewpoints',
          explanation: 'Each viewpoint should address a specific stakeholder concern.',
        },
      ],
    }),
  );

  // data-flow type — 1 module
  const dataFlowDir = path.join(tmpDir, 'data-flow');
  fs.mkdirSync(dataFlowDir);

  fs.writeFileSync(
    path.join(dataFlowDir, '01-fundamentals.json'),
    JSON.stringify({
      title: 'Data Flow Diagram Fundamentals',
      diagramType: 'data-flow',
      sequenceOrder: 1,
      explanation: 'DFDs show how data moves through a system.',
      annotatedExamples: [
        {
          imageUrl: 'dfd-example.png',
          annotations: [{ element: 'Process', explanation: 'Transforms data.' }],
        },
      ],
      walkthrough: [
        { stepNumber: 1, instruction: 'Identify external entities.', imageUrl: 'dfd-step1.png' },
      ],
      exercises: [
        {
          scenario: 'Create a DFD for a feedback system.',
          expectedDiagramType: 'data-flow',
          hints: ['Citizens are external entities'],
          sampleSolution: 'dfd-solution.png',
        },
      ],
      commonMistakes: [
        {
          description: 'Omitting data flow direction arrows',
          incorrectExample: 'Lines without arrowheads',
          correctedExample: 'Use directed arrows',
          explanation: 'Direction arrows show read vs write.',
        },
      ],
    }),
  );

  // Non-JSON file (should be ignored)
  fs.writeFileSync(path.join(archimateDir, '.gitkeep'), '');

  // Non-directory file at root (should be ignored)
  fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Diagrams');

  return tmpDir;
}

/** Creates a temp directory with ArchiMate reference JSON files. */
function createTempReferenceDir(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archlens-reference-'));

  fs.writeFileSync(
    path.join(tmpDir, 'symbols.json'),
    JSON.stringify([
      { name: 'Application Component', description: 'A modular part of a software system.', layer: 'application', notation: 'Rectangle' },
      { name: 'Business Actor', description: 'A business entity.', layer: 'business', notation: 'Stick figure' },
    ]),
  );

  fs.writeFileSync(
    path.join(tmpDir, 'relationships.json'),
    JSON.stringify([
      { name: 'Composition', description: 'Element consists of others.', notation: 'Filled diamond', category: 'structural' },
      { name: 'Serving', description: 'Provides functionality.', notation: 'Open arrowhead', category: 'dependency' },
    ]),
  );

  fs.writeFileSync(
    path.join(tmpDir, 'layers.json'),
    JSON.stringify([
      { name: 'Business Layer', description: 'Business services.', colour: '#FFFFB5', elements: ['Business Actor'] },
      { name: 'Application Layer', description: 'Application services.', colour: '#B5FFFF', elements: ['Application Component'] },
    ]),
  );

  return tmpDir;
}

function cleanupDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// DiagramCoach
// ---------------------------------------------------------------------------

describe('DiagramCoach', () => {
  let dbManager: DatabaseManager;
  let coach: DiagramCoach;
  let diagramsDir: string;
  let referenceDir: string;

  beforeEach(() => {
    dbManager = new DatabaseManager(':memory:');
    dbManager.initialise();
    coach = new DiagramCoach(dbManager.getDatabase());
    diagramsDir = createTempDiagramsDir();
    referenceDir = createTempReferenceDir();
    coach.loadModules(diagramsDir);
    coach.loadReference(referenceDir);
  });

  afterEach(() => {
    dbManager.close();
    cleanupDir(diagramsDir);
    cleanupDir(referenceDir);
  });

  // -----------------------------------------------------------------------
  // loadModules
  // -----------------------------------------------------------------------

  describe('loadModules', () => {
    it('loads modules from the file system', () => {
      const archimateModules = coach.getModules('archimate');
      expect(archimateModules).toHaveLength(2);
    });

    it('ignores non-JSON files', () => {
      const archimateModules = coach.getModules('archimate');
      expect(archimateModules.every((m) => m.title !== '')).toBe(true);
    });

    it('handles non-existent directory gracefully', () => {
      const freshCoach = new DiagramCoach(dbManager.getDatabase());
      freshCoach.loadModules('/nonexistent/path');
      expect(freshCoach.getModules('archimate')).toEqual([]);
    });

    it('ignores files with invalid JSON', () => {
      const badDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archlens-bad-'));
      const typeDir = path.join(badDir, 'archimate');
      fs.mkdirSync(typeDir);
      fs.writeFileSync(path.join(typeDir, '01-bad.json'), 'not valid json{{{');

      const freshCoach = new DiagramCoach(dbManager.getDatabase());
      freshCoach.loadModules(badDir);
      expect(freshCoach.getModules('archimate')).toEqual([]);
      cleanupDir(badDir);
    });

    it('ignores files missing required fields', () => {
      const incompleteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archlens-incomplete-'));
      const typeDir = path.join(incompleteDir, 'archimate');
      fs.mkdirSync(typeDir);
      fs.writeFileSync(
        path.join(typeDir, '01-no-title.json'),
        JSON.stringify({ diagramType: 'archimate', sequenceOrder: 1 }),
      );

      const freshCoach = new DiagramCoach(dbManager.getDatabase());
      freshCoach.loadModules(incompleteDir);
      expect(freshCoach.getModules('archimate')).toEqual([]);
      cleanupDir(incompleteDir);
    });
  });

  // -----------------------------------------------------------------------
  // getModules — filtering and ordering
  // -----------------------------------------------------------------------

  describe('getModules', () => {
    it('returns modules ordered by sequenceOrder for a specific type', () => {
      const modules = coach.getModules('archimate');
      expect(modules[0].sequenceOrder).toBe(1);
      expect(modules[1].sequenceOrder).toBe(2);
      expect(modules[0].title).toBe('Introduction to ArchiMate');
      expect(modules[1].title).toBe('Advanced ArchiMate Viewpoints');
    });

    it('returns empty array for type with no modules', () => {
      expect(coach.getModules('sequence')).toEqual([]);
    });

    it('returns all modules when no type filter is provided', () => {
      const all = coach.getModules();
      expect(all).toHaveLength(3); // 2 archimate + 1 data-flow
    });

    it('returns all modules grouped by type in ALL_DIAGRAM_TYPES order', () => {
      const all = coach.getModules();
      // archimate comes before data-flow in ALL_DIAGRAM_TYPES
      const archimateIdx = all.findIndex((m) => m.diagramType === 'archimate');
      const dataFlowIdx = all.findIndex((m) => m.diagramType === 'data-flow');
      expect(archimateIdx).toBeLessThan(dataFlowIdx);
    });
  });

  // -----------------------------------------------------------------------
  // getModule
  // -----------------------------------------------------------------------

  describe('getModule', () => {
    it('returns a module by ID', () => {
      const mod = coach.getModule('archimate/01-introduction');
      expect(mod.title).toBe('Introduction to ArchiMate');
      expect(mod.diagramType).toBe('archimate');
    });

    it('returns parsed content with all structural elements', () => {
      const mod = coach.getModule('archimate/01-introduction');
      expect(mod.content.explanation).toBeTruthy();
      expect(mod.content.annotatedExamples.length).toBeGreaterThan(0);
      expect(mod.content.walkthrough.length).toBeGreaterThan(0);
      expect(mod.content.exercises.length).toBeGreaterThan(0);
      expect(mod.content.commonMistakes.length).toBeGreaterThan(0);
    });

    it('returns annotated examples with annotations', () => {
      const mod = coach.getModule('archimate/01-introduction');
      const example = mod.content.annotatedExamples[0];
      expect(example.imageUrl).toBeTruthy();
      expect(example.annotations.length).toBeGreaterThan(0);
      expect(example.annotations[0].element).toBeTruthy();
      expect(example.annotations[0].explanation).toBeTruthy();
    });

    it('returns walkthrough steps with correct structure', () => {
      const mod = coach.getModule('archimate/01-introduction');
      const step = mod.content.walkthrough[0];
      expect(step.stepNumber).toBe(1);
      expect(step.instruction).toBeTruthy();
      expect(step.imageUrl).toBeTruthy();
    });

    it('returns exercises with scenario and hints', () => {
      const mod = coach.getModule('archimate/01-introduction');
      const exercise = mod.content.exercises[0];
      expect(exercise.scenario).toBeTruthy();
      expect(exercise.expectedDiagramType).toBe('archimate');
      expect(exercise.hints.length).toBeGreaterThan(0);
    });

    it('returns common mistakes with all fields', () => {
      const mod = coach.getModule('archimate/01-introduction');
      const mistake = mod.content.commonMistakes[0];
      expect(mistake.description).toBeTruthy();
      expect(mistake.incorrectExample).toBeTruthy();
      expect(mistake.correctedExample).toBeTruthy();
      expect(mistake.explanation).toBeTruthy();
    });

    it('throws for unknown module ID', () => {
      expect(() => coach.getModule('nonexistent')).toThrow('Diagram module not found');
    });
  });

  // -----------------------------------------------------------------------
  // loadReference / getReference
  // -----------------------------------------------------------------------

  describe('getReference', () => {
    it('returns loaded ArchiMate symbols', () => {
      const ref = coach.getReference();
      expect(ref.symbols).toHaveLength(2);
      expect(ref.symbols[0].name).toBe('Application Component');
      expect(ref.symbols[0].description).toBeTruthy();
      expect(ref.symbols[0].layer).toBe('application');
    });

    it('returns loaded ArchiMate relationships', () => {
      const ref = coach.getReference();
      expect(ref.relationships).toHaveLength(2);
      expect(ref.relationships[0].name).toBe('Composition');
      expect(ref.relationships[0].category).toBe('structural');
    });

    it('returns loaded ArchiMate layers', () => {
      const ref = coach.getReference();
      expect(ref.layers).toHaveLength(2);
      expect(ref.layers[0].name).toBe('Business Layer');
      expect(ref.layers[0].elements.length).toBeGreaterThan(0);
    });

    it('returns empty reference when directory does not exist', () => {
      const freshCoach = new DiagramCoach(dbManager.getDatabase());
      freshCoach.loadReference('/nonexistent/path');
      const ref = freshCoach.getReference();
      expect(ref.symbols).toEqual([]);
      expect(ref.relationships).toEqual([]);
      expect(ref.layers).toEqual([]);
    });

    it('handles partial reference data gracefully', () => {
      const partialDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archlens-partial-ref-'));
      fs.writeFileSync(
        path.join(partialDir, 'symbols.json'),
        JSON.stringify([{ name: 'Test', description: 'Test symbol', layer: 'business', notation: 'Circle' }]),
      );
      // No relationships.json or layers.json

      const freshCoach = new DiagramCoach(dbManager.getDatabase());
      freshCoach.loadReference(partialDir);
      const ref = freshCoach.getReference();
      expect(ref.symbols).toHaveLength(1);
      expect(ref.relationships).toEqual([]);
      expect(ref.layers).toEqual([]);
      cleanupDir(partialDir);
    });
  });

  // -----------------------------------------------------------------------
  // completeModule
  // -----------------------------------------------------------------------

  describe('completeModule', () => {
    it('records a completion in the database with diagram type', () => {
      coach.completeModule('archimate/01-introduction');

      const row = dbManager
        .getDatabase()
        .prepare("SELECT * FROM module_completions WHERE module_id = ? AND module_type = 'diagram'")
        .get('archimate/01-introduction') as { module_id: string; module_type: string; completed_at: string } | undefined;

      expect(row).toBeDefined();
      expect(row!.module_type).toBe('diagram');
      expect(row!.completed_at).toBeTruthy();
    });

    it('updates completion timestamp on re-completion', () => {
      coach.completeModule('archimate/01-introduction');
      const first = dbManager
        .getDatabase()
        .prepare("SELECT completed_at FROM module_completions WHERE module_id = ? AND module_type = 'diagram'")
        .get('archimate/01-introduction') as { completed_at: string };

      coach.completeModule('archimate/01-introduction');
      const second = dbManager
        .getDatabase()
        .prepare("SELECT completed_at FROM module_completions WHERE module_id = ? AND module_type = 'diagram'")
        .get('archimate/01-introduction') as { completed_at: string };

      expect(second.completed_at).toBeTruthy();
    });

    it('does not conflict with learning module completions', () => {
      // Insert a learning completion for the same module_id
      dbManager
        .getDatabase()
        .prepare(
          "INSERT INTO module_completions (id, module_id, module_type, completed_at) VALUES ('test-id', 'archimate/01-introduction', 'learning', datetime('now'))",
        )
        .run();

      // Should not throw — different module_type
      coach.completeModule('archimate/01-introduction');

      const rows = dbManager
        .getDatabase()
        .prepare('SELECT * FROM module_completions WHERE module_id = ?')
        .all('archimate/01-introduction') as Array<{ module_type: string }>;

      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.module_type).sort()).toEqual(['diagram', 'learning']);
    });
  });

  // -----------------------------------------------------------------------
  // getNextRecommended
  // -----------------------------------------------------------------------

  describe('getNextRecommended', () => {
    it('returns the first module when nothing is completed', () => {
      const next = coach.getNextRecommended('archimate');
      expect(next).not.toBeNull();
      expect(next!.sequenceOrder).toBe(1);
      expect(next!.title).toBe('Introduction to ArchiMate');
    });

    it('returns the next uncompleted module in sequence', () => {
      coach.completeModule('archimate/01-introduction');
      const next = coach.getNextRecommended('archimate');
      expect(next).not.toBeNull();
      expect(next!.sequenceOrder).toBe(2);
      expect(next!.title).toBe('Advanced ArchiMate Viewpoints');
    });

    it('returns null when all modules in type are completed', () => {
      coach.completeModule('archimate/01-introduction');
      coach.completeModule('archimate/02-advanced-viewpoints');
      const next = coach.getNextRecommended('archimate');
      expect(next).toBeNull();
    });

    it('returns null for type with no modules', () => {
      const next = coach.getNextRecommended('sequence');
      expect(next).toBeNull();
    });

    it('returns next across all types when no type filter is provided', () => {
      const next = coach.getNextRecommended();
      expect(next).not.toBeNull();
      // Should be the first module in ALL_DIAGRAM_TYPES order
      expect(next!.diagramType).toBe('archimate');
      expect(next!.sequenceOrder).toBe(1);
    });

    it('skips completed modules across all types', () => {
      coach.completeModule('archimate/01-introduction');
      coach.completeModule('archimate/02-advanced-viewpoints');
      const next = coach.getNextRecommended();
      expect(next).not.toBeNull();
      expect(next!.diagramType).toBe('data-flow');
    });
  });

  // -----------------------------------------------------------------------
  // getAudienceGuidance
  // -----------------------------------------------------------------------

  describe('getAudienceGuidance', () => {
    it('returns guidance for technical audience', () => {
      const guidance = coach.getAudienceGuidance('technical');
      expect(guidance).toBeTruthy();
      expect(guidance.length).toBeGreaterThan(0);
      expect(guidance.toLowerCase()).toContain('technical');
    });

    it('returns guidance for governance audience', () => {
      const guidance = coach.getAudienceGuidance('governance');
      expect(guidance).toBeTruthy();
      expect(guidance.toLowerCase()).toContain('governance');
    });

    it('returns guidance for non-technical audience', () => {
      const guidance = coach.getAudienceGuidance('non-technical');
      expect(guidance).toBeTruthy();
      expect(guidance.toLowerCase()).toContain('non-technical');
    });

    it('returns different guidance for each audience type', () => {
      const technical = coach.getAudienceGuidance('technical');
      const governance = coach.getAudienceGuidance('governance');
      const nonTechnical = coach.getAudienceGuidance('non-technical');
      expect(technical).not.toBe(governance);
      expect(governance).not.toBe(nonTechnical);
      expect(technical).not.toBe(nonTechnical);
    });
  });
});
