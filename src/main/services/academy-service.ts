// ArchLens — Solution Architect Academy Service

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LessonSection {
  heading: string;
  body: string;
}

export interface WorkedExample {
  title: string;
  context: string;
  approach: string;
  outcome: string;
  lessonsLearned: string;
}

export interface CivilServiceScenario {
  title: string;
  background: string;
  challenge: string;
  constraints: string[];
  yourRole: string;
  discussion: string;
}

export interface PracticeArtefact {
  type: string;
  description: string;
  guidance: string;
  modelAnswer: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PracticalExercise {
  title: string;
  scenario: string;
  task: string;
  hints: string[];
  modelAnswer: string;
  assessmentCriteria: string[];
}

export interface AcademyLesson {
  id: string;
  lessonNumber: number;
  title: string;
  level: 'foundation' | 'intermediate' | 'advanced';
  theme: string;
  objectives: string[];
  estimatedMinutes: number;
  prerequisites: string[];
  whyThisMatters: string;
  content: LessonSection[];
  workedExample: WorkedExample;
  civilServiceScenario: CivilServiceScenario;
  practiceArtefact: PracticeArtefact;
  reflectiveQuestions: string[];
  knowledgeCheck: QuizQuestion[];
  practicalExercise: PracticalExercise;
  commonMistakes: string[];
  weakVsStrong: { weak: string; strong: string };
  workplaceSignals: string[];
  recommendedNext: number;
  skillsAddressed: string[];
}

export interface CurriculumLesson {
  lessonNumber: number;
  id: string;
  title: string;
  level: 'foundation' | 'intermediate' | 'advanced';
  theme: string;
  objectives: string[];
  estimatedMinutes: number;
  prerequisites: number[];
  skillsAddressed: string[];
  recommendedNext: number | null;
  contentFile: string | null;
}

export interface CurriculumEntry extends CurriculumLesson {
  status: 'not_started' | 'in_progress' | 'completed';
  quizScore?: number;
  confidenceLevel?: number;
}

export interface SkillAssessment {
  skillName: string;
  currentScore: number;
  lessonsContributing: string[];
}

export interface LessonProgress {
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  quizScore?: number;
  confidenceLevel?: number;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ProgressSummary {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  averageQuizScore: number;
  averageConfidence: number;
  completionPercentage: number;
  levelProgress: {
    foundation: { total: number; completed: number };
    intermediate: { total: number; completed: number };
    advanced: { total: number; completed: number };
  };
}

// ---------------------------------------------------------------------------
// AcademyService
// ---------------------------------------------------------------------------

export class AcademyService {
  private db: Database.Database;
  private lessons: Map<number, AcademyLesson> = new Map();
  private curriculum: CurriculumLesson[] = [];
  private skillAreas: string[] = [];

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Loads the curriculum metadata from curriculum.json.
   */
  loadCurriculum(curriculumPath: string): void {
    if (!fs.existsSync(curriculumPath)) return;
    const raw = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));
    this.curriculum = raw.lessons ?? [];
    this.skillAreas = raw.skillAreas ?? [];

    // Seed lesson metadata into the database
    const upsert = this.db.prepare(
      `INSERT INTO academy_lessons (id, lesson_number, title, level, theme, objectives, estimated_minutes, prerequisites)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         level = excluded.level,
         theme = excluded.theme,
         objectives = excluded.objectives,
         estimated_minutes = excluded.estimated_minutes,
         prerequisites = excluded.prerequisites`,
    );

    const seedAll = this.db.transaction(() => {
      for (const lesson of this.curriculum) {
        upsert.run(
          lesson.id,
          lesson.lessonNumber,
          lesson.title,
          lesson.level,
          lesson.theme,
          JSON.stringify(lesson.objectives),
          lesson.estimatedMinutes,
          JSON.stringify(lesson.prerequisites),
        );
      }
    });
    seedAll();
  }

  /**
   * Loads full lesson content from JSON files in the lessons directory.
   */
  loadLessons(lessonsDir: string): void {
    if (!fs.existsSync(lessonsDir)) return;

    const files = fs.readdirSync(lessonsDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      try {
        const filePath = path.join(lessonsDir, file);
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (raw.lessonNumber) {
          this.lessons.set(raw.lessonNumber, raw as AcademyLesson);
        }
      } catch {
        // Skip malformed lesson files
      }
    }
  }

  /**
   * Seeds the 11 skill areas into the academy_skills table.
   */
  seedSkills(): void {
    const count = this.db.prepare('SELECT COUNT(*) as cnt FROM academy_skills').get() as { cnt: number };
    if (count.cnt > 0) return;

    const insert = this.db.prepare(
      'INSERT INTO academy_skills (id, skill_name, current_score, lessons_contributing, updated_at) VALUES (?, ?, 0, ?, datetime(\'now\'))',
    );

    const skills = [
      'Discovery & Problem Framing',
      'Stakeholder Understanding',
      'Architecture Communication',
      'Design Quality',
      'Non-Functional Thinking',
      'Government Standards Awareness',
      'Security & Risk Awareness',
      'Option Appraisal',
      'Documentation Quality',
      'Decision-Making',
      'Strategic Thinking',
    ];

    const seedAll = this.db.transaction(() => {
      for (const skill of skills) {
        const id = `skill-${crypto.randomUUID()}`;
        insert.run(id, skill, '[]');
      }
    });
    seedAll();
  }

  /**
   * Returns the full curriculum with progress status for each lesson.
   */
  getCurriculum(): CurriculumEntry[] {
    const progressRows = this.db
      .prepare('SELECT lesson_id, status, quiz_score, confidence_level FROM academy_progress')
      .all() as Array<{ lesson_id: string; status: string; quiz_score: number | null; confidence_level: number | null }>;

    const progressMap = new Map(progressRows.map((r) => [r.lesson_id, r]));

    return this.curriculum.map((lesson) => {
      const progress = progressMap.get(lesson.id);
      return {
        ...lesson,
        status: (progress?.status as CurriculumEntry['status']) ?? 'not_started',
        quizScore: progress?.quiz_score ?? undefined,
        confidenceLevel: progress?.confidence_level ?? undefined,
      };
    });
  }

  /**
   * Returns full lesson content for a given lesson number.
   */
  getLesson(lessonNumber: number): AcademyLesson | null {
    return this.lessons.get(lessonNumber) ?? null;
  }

  /**
   * Marks a lesson as in_progress.
   */
  startLesson(lessonId: string): void {
    const existing = this.db
      .prepare('SELECT id FROM academy_progress WHERE lesson_id = ?')
      .get(lessonId) as { id: string } | undefined;

    if (existing) {
      this.db
        .prepare('UPDATE academy_progress SET status = ?, started_at = datetime(\'now\') WHERE lesson_id = ?')
        .run('in_progress', lessonId);
    } else {
      const id = `progress-${crypto.randomUUID()}`;
      this.db
        .prepare(
          'INSERT INTO academy_progress (id, lesson_id, status, started_at) VALUES (?, ?, ?, datetime(\'now\'))',
        )
        .run(id, lessonId, 'in_progress');
    }
  }

  /**
   * Marks a lesson as completed with quiz score and confidence level.
   * Also updates skill scores.
   */
  completeLesson(lessonId: string, quizScore: number, confidenceLevel: number): void {
    const existing = this.db
      .prepare('SELECT id FROM academy_progress WHERE lesson_id = ?')
      .get(lessonId) as { id: string } | undefined;

    if (existing) {
      this.db
        .prepare(
          `UPDATE academy_progress SET status = 'completed', quiz_score = ?, confidence_level = ?, completed_at = datetime('now') WHERE lesson_id = ?`,
        )
        .run(quizScore, confidenceLevel, lessonId);
    } else {
      const id = `progress-${crypto.randomUUID()}`;
      this.db
        .prepare(
          `INSERT INTO academy_progress (id, lesson_id, status, quiz_score, confidence_level, started_at, completed_at)
           VALUES (?, ?, 'completed', ?, ?, datetime('now'), datetime('now'))`,
        )
        .run(id, lessonId, quizScore, confidenceLevel);
    }

    // Update skill scores
    this.updateSkillsForLesson(lessonId, quizScore);
  }

  /**
   * Saves user notes for a lesson.
   */
  saveNotes(lessonId: string, notes: string): void {
    const existing = this.db
      .prepare('SELECT id FROM academy_progress WHERE lesson_id = ?')
      .get(lessonId) as { id: string } | undefined;

    if (existing) {
      this.db
        .prepare('UPDATE academy_progress SET notes = ? WHERE lesson_id = ?')
        .run(notes, lessonId);
    } else {
      const id = `progress-${crypto.randomUUID()}`;
      this.db
        .prepare(
          'INSERT INTO academy_progress (id, lesson_id, status, notes) VALUES (?, ?, \'not_started\', ?)',
        )
        .run(id, lessonId, notes);
    }
  }

  /**
   * Stores an exercise response.
   */
  submitExercise(
    lessonId: string,
    exerciseType: 'quiz' | 'scenario' | 'reflection',
    question: string,
    userAnswer: string,
    modelAnswer: string,
  ): void {
    const id = `exercise-${crypto.randomUUID()}`;
    this.db
      .prepare(
        `INSERT INTO academy_exercises (id, lesson_id, exercise_type, question, user_answer, model_answer, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      )
      .run(id, lessonId, exerciseType, question, userAnswer, modelAnswer);
  }

  /**
   * Returns all 11 skill area scores.
   */
  getSkillAssessment(): SkillAssessment[] {
    const rows = this.db
      .prepare('SELECT skill_name, current_score, lessons_contributing FROM academy_skills ORDER BY skill_name')
      .all() as Array<{ skill_name: string; current_score: number; lessons_contributing: string }>;

    return rows.map((r) => ({
      skillName: r.skill_name,
      currentScore: r.current_score,
      lessonsContributing: JSON.parse(r.lessons_contributing || '[]'),
    }));
  }

  /**
   * Returns the recommended next lesson based on progress and skill gaps.
   * Priority: incomplete prerequisites first, then weakest skill areas, then curriculum sequence.
   */
  getRecommendedNext(): CurriculumEntry | null {
    const curriculum = this.getCurriculum();
    const completedIds = new Set(
      curriculum.filter((l) => l.status === 'completed').map((l) => l.id),
    );

    // Find lessons that are not completed and have content available
    const available = curriculum.filter(
      (l) => l.status !== 'completed' && l.contentFile !== null,
    );

    if (available.length === 0) return null;

    // First priority: lessons with all prerequisites met, in curriculum order
    const ready = available.filter((l) => {
      if (l.prerequisites.length === 0) return true;
      return l.prerequisites.every((prereqNum) => {
        const prereqLesson = curriculum.find((c) => c.lessonNumber === prereqNum);
        return prereqLesson ? completedIds.has(prereqLesson.id) : false;
      });
    });

    if (ready.length === 0) {
      // If no lessons have all prerequisites met, find the earliest prerequisite that's not done
      return available[0];
    }

    // Second priority: among ready lessons, prefer those addressing weakest skills
    const skills = this.getSkillAssessment();
    const skillScores = new Map(skills.map((s) => [s.skillName, s.currentScore]));

    // Score each ready lesson by how much it addresses weak skills
    const scored = ready.map((lesson) => {
      const weaknessScore = lesson.skillsAddressed.reduce((sum, skill) => {
        const score = skillScores.get(skill) ?? 0;
        return sum + (100 - score); // Higher weakness = higher priority
      }, 0);
      return { lesson, weaknessScore };
    });

    // Sort by weakness score (descending), then by lesson number (ascending)
    scored.sort((a, b) => {
      if (b.weaknessScore !== a.weaknessScore) return b.weaknessScore - a.weaknessScore;
      return a.lesson.lessonNumber - b.lesson.lessonNumber;
    });

    return scored[0]?.lesson ?? null;
  }

  /**
   * Returns overall progress summary.
   */
  getProgress(): ProgressSummary {
    const curriculum = this.getCurriculum();
    const totalLessons = curriculum.length;
    const completed = curriculum.filter((l) => l.status === 'completed');
    const inProgress = curriculum.filter((l) => l.status === 'in_progress');

    const quizScores = completed
      .filter((l) => l.quizScore !== undefined)
      .map((l) => l.quizScore!);
    const confidences = completed
      .filter((l) => l.confidenceLevel !== undefined)
      .map((l) => l.confidenceLevel!);

    const avgQuiz = quizScores.length > 0
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;
    const avgConfidence = confidences.length > 0
      ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 10) / 10
      : 0;

    const levelProgress = {
      foundation: {
        total: curriculum.filter((l) => l.level === 'foundation').length,
        completed: completed.filter((l) => l.level === 'foundation').length,
      },
      intermediate: {
        total: curriculum.filter((l) => l.level === 'intermediate').length,
        completed: completed.filter((l) => l.level === 'intermediate').length,
      },
      advanced: {
        total: curriculum.filter((l) => l.level === 'advanced').length,
        completed: completed.filter((l) => l.level === 'advanced').length,
      },
    };

    return {
      totalLessons,
      completedLessons: completed.length,
      inProgressLessons: inProgress.length,
      averageQuizScore: avgQuiz,
      averageConfidence: avgConfidence,
      completionPercentage: totalLessons > 0 ? Math.round((completed.length / totalLessons) * 100) : 0,
      levelProgress,
    };
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private updateSkillsForLesson(lessonId: string, quizScore: number): void {
    const lesson = this.curriculum.find((l) => l.id === lessonId);
    if (!lesson) return;

    const skillsToUpdate = lesson.skillsAddressed;
    const scoreContribution = Math.round(quizScore * 0.2); // Each lesson contributes up to 20 points

    for (const skillName of skillsToUpdate) {
      const row = this.db
        .prepare('SELECT id, current_score, lessons_contributing FROM academy_skills WHERE skill_name = ?')
        .get(skillName) as { id: string; current_score: number; lessons_contributing: string } | undefined;

      if (!row) continue;

      const contributing: string[] = JSON.parse(row.lessons_contributing || '[]');
      if (!contributing.includes(lessonId)) {
        contributing.push(lessonId);
      }

      const newScore = Math.min(100, row.current_score + scoreContribution);

      this.db
        .prepare(
          'UPDATE academy_skills SET current_score = ?, lessons_contributing = ?, updated_at = datetime(\'now\') WHERE id = ?',
        )
        .run(newScore, JSON.stringify(contributing), row.id);
    }
  }
}