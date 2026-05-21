// ArchLens — Diagram Coach
// Implemented in Task 11.1

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DiagramType =
  | 'archimate'
  | 'solution-overview'
  | 'data-flow'
  | 'sequence'
  | 'network-topology'
  | 'deployment';

export const ALL_DIAGRAM_TYPES: DiagramType[] = [
  'archimate',
  'solution-overview',
  'data-flow',
  'sequence',
  'network-topology',
  'deployment',
];

export interface AnnotatedExample {
  imageUrl: string;
  annotations: Array<{ element: string; explanation: string }>;
}

export interface WalkthroughStep {
  stepNumber: number;
  instruction: string;
  imageUrl: string;
}

export interface Exercise {
  scenario: string;
  expectedDiagramType: DiagramType;
  hints: string[];
  sampleSolution: string;
}

export interface Mistake {
  description: string;
  incorrectExample: string;
  correctedExample: string;
  explanation: string;
}

export interface DiagramContent {
  explanation: string;
  annotatedExamples: AnnotatedExample[];
  walkthrough: WalkthroughStep[];
  exercises: Exercise[];
  commonMistakes: Mistake[];
}

export interface DiagramModule {
  id: string;
  title: string;
  diagramType: DiagramType;
  sequenceOrder: number;
  content: DiagramContent;
}

export interface ArchiMateSymbol {
  name: string;
  description: string;
  layer: string;
  notation: string;
}

export interface ArchiMateRelationship {
  name: string;
  description: string;
  notation: string;
  category: string;
}

export interface ArchiMateLayer {
  name: string;
  description: string;
  colour: string;
  elements: string[];
}

export interface ArchiMateReference {
  symbols: ArchiMateSymbol[];
  relationships: ArchiMateRelationship[];
  layers: ArchiMateLayer[];
}

// ---------------------------------------------------------------------------
// Audience guidance content
// ---------------------------------------------------------------------------

const AUDIENCE_GUIDANCE: Record<'technical' | 'governance' | 'non-technical', string> = {
  technical:
    'For technical audiences, include detailed component names, protocols, port numbers, and technology-specific notation. ' +
    'Use standard notations (UML, ArchiMate) consistently. Show internal architecture details, API contracts, and data flows. ' +
    'Technical teams expect precision — label every connection and include version numbers where relevant.',
  governance:
    'For governance boards, focus on compliance alignment and risk. Highlight how the architecture meets GDS Service Standard, ' +
    'Secure by Design, and Zero Trust requirements. Use traffic-light indicators where appropriate. Keep technical detail moderate — ' +
    'show major components and their security boundaries without internal implementation details. Include references to relevant ' +
    'frameworks and standards in annotations.',
  'non-technical':
    'For non-technical stakeholders, simplify the diagram to show the user journey and key system boundaries. ' +
    'Use plain language labels instead of technical jargon. Group related components into logical blocks with descriptive names. ' +
    'Focus on what the system does rather than how it works. Use colour coding to distinguish different areas and keep the ' +
    'total number of elements to a minimum for clarity.',
};

// ---------------------------------------------------------------------------
// DiagramCoach
// ---------------------------------------------------------------------------

export class DiagramCoach {
  private db: Database.Database;
  private modules: Map<string, DiagramModule> = new Map();
  private typeIndex: Map<DiagramType, DiagramModule[]> = new Map();
  private reference: ArchiMateReference = { symbols: [], relationships: [], layers: [] };

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Loads and parses all diagram training modules from the given directory.
   * Each subdirectory corresponds to a DiagramType and contains JSON module files.
   */
  loadModules(diagramsDir: string): void {
    this.modules.clear();
    this.typeIndex.clear();

    if (!fs.existsSync(diagramsDir)) return;

    const typeDirs = fs.readdirSync(diagramsDir, { withFileTypes: true });

    for (const entry of typeDirs) {
      if (!entry.isDirectory()) continue;

      const typePath = path.join(diagramsDir, entry.name);
      const files = fs.readdirSync(typePath).filter((f) => f.endsWith('.json'));

      for (const file of files) {
        const filePath = path.join(typePath, file);
        const mod = this.parseModuleFile(filePath, file);
        if (mod) {
          this.modules.set(mod.id, mod);
        }
      }
    }

    // Build type index sorted by sequenceOrder
    for (const mod of this.modules.values()) {
      const list = this.typeIndex.get(mod.diagramType) ?? [];
      list.push(mod);
      this.typeIndex.set(mod.diagramType, list);
    }

    for (const list of this.typeIndex.values()) {
      list.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    }
  }

  /**
   * Loads ArchiMate reference data (symbols, relationships, layers) from JSON files.
   */
  loadReference(referenceDir: string): void {
    this.reference = { symbols: [], relationships: [], layers: [] };

    if (!fs.existsSync(referenceDir)) return;

    const symbolsPath = path.join(referenceDir, 'symbols.json');
    const relationshipsPath = path.join(referenceDir, 'relationships.json');
    const layersPath = path.join(referenceDir, 'layers.json');

    if (fs.existsSync(symbolsPath)) {
      this.reference.symbols = JSON.parse(fs.readFileSync(symbolsPath, 'utf-8'));
    }
    if (fs.existsSync(relationshipsPath)) {
      this.reference.relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf-8'));
    }
    if (fs.existsSync(layersPath)) {
      this.reference.layers = JSON.parse(fs.readFileSync(layersPath, 'utf-8'));
    }
  }

  /**
   * Returns diagram modules, optionally filtered by diagram type.
   * Modules are ordered by sequenceOrder within each type.
   */
  getModules(type?: DiagramType): DiagramModule[] {
    if (type) {
      return this.typeIndex.get(type) ?? [];
    }
    // Return all modules, grouped by type and ordered by sequence
    const all: DiagramModule[] = [];
    for (const dt of ALL_DIAGRAM_TYPES) {
      const mods = this.typeIndex.get(dt) ?? [];
      all.push(...mods);
    }
    return all;
  }

  /**
   * Returns a single diagram module by ID.
   * @throws Error if the module is not found.
   */
  getModule(id: string): DiagramModule {
    const mod = this.modules.get(id);
    if (!mod) {
      throw new Error(`Diagram module not found: ${id}`);
    }
    return mod;
  }

  /**
   * Returns the ArchiMate reference library.
   */
  getReference(): ArchiMateReference {
    return this.reference;
  }

  /**
   * Records a diagram module completion in the database.
   */
  completeModule(moduleId: string): void {
    const id = crypto.randomUUID();
    this.db
      .prepare(
        `INSERT INTO module_completions (id, module_id, module_type, completed_at)
         VALUES (?, ?, 'diagram', datetime('now'))
         ON CONFLICT(module_id, module_type) DO UPDATE SET completed_at = datetime('now')`,
      )
      .run(id, moduleId);
  }

  /**
   * Returns the next recommended diagram module for a given type (or across all types),
   * based on the user's completions. Returns null if all modules are completed.
   */
  getNextRecommended(type?: DiagramType): DiagramModule | null {
    const modules = this.getModules(type);
    if (modules.length === 0) return null;

    const completedIds = this.getCompletedModuleIds();

    for (const mod of modules) {
      if (!completedIds.has(mod.id)) {
        return mod;
      }
    }

    return null;
  }

  /**
   * Returns audience-specific diagramming guidance.
   */
  getAudienceGuidance(audience: 'technical' | 'governance' | 'non-technical'): string {
    return AUDIENCE_GUIDANCE[audience];
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /** Returns the set of completed diagram module IDs. */
  private getCompletedModuleIds(): Set<string> {
    const rows = this.db
      .prepare(
        `SELECT module_id FROM module_completions WHERE module_type = 'diagram'`,
      )
      .all() as Array<{ module_id: string }>;

    return new Set(rows.map((r) => r.module_id));
  }

  /** Parses a single JSON file into a DiagramModule. */
  private parseModuleFile(filePath: string, filename: string): DiagramModule | null {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);

      if (!data.title || !data.diagramType || data.sequenceOrder == null) return null;

      const diagramType = data.diagramType as DiagramType;
      if (!ALL_DIAGRAM_TYPES.includes(diagramType)) return null;

      const id = `${diagramType}/${filename.replace(/\.json$/, '')}`;

      const content: DiagramContent = {
        explanation: data.explanation ?? '',
        annotatedExamples: Array.isArray(data.annotatedExamples) ? data.annotatedExamples : [],
        walkthrough: Array.isArray(data.walkthrough) ? data.walkthrough : [],
        exercises: Array.isArray(data.exercises) ? data.exercises : [],
        commonMistakes: Array.isArray(data.commonMistakes) ? data.commonMistakes : [],
      };

      return {
        id,
        title: data.title,
        diagramType,
        sequenceOrder: data.sequenceOrder,
        content,
      };
    } catch {
      // Skip files that can't be parsed
      return null;
    }
  }
}
