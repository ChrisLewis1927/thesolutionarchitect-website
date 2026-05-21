// ArchLens — Solution Architect Academy page

import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CurriculumEntry {
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
  status: 'not_started' | 'in_progress' | 'completed';
  quizScore?: number;
  confidenceLevel?: number;
}

interface LessonSection { heading: string; body: string; }
interface WorkedExample { title: string; context: string; approach: string; outcome: string; lessonsLearned: string; }
interface CivilServiceScenario { title: string; background: string; challenge: string; constraints: string[]; yourRole: string; discussion: string; }
interface PracticeArtefact { type: string; description: string; guidance: string; modelAnswer: string; }
interface QuizQuestion { question: string; options: string[]; correctIndex: number; explanation: string; }
interface PracticalExercise { title: string; scenario: string; task: string; hints: string[]; modelAnswer: string; assessmentCriteria: string[]; }

interface AcademyLesson {
  id: string; lessonNumber: number; title: string;
  level: 'foundation' | 'intermediate' | 'advanced';
  theme: string; objectives: string[]; estimatedMinutes: number;
  prerequisites: string[]; whyThisMatters: string;
  content: LessonSection[]; workedExample: WorkedExample;
  civilServiceScenario: CivilServiceScenario; practiceArtefact: PracticeArtefact;
  reflectiveQuestions: string[]; knowledgeCheck: QuizQuestion[];
  practicalExercise: PracticalExercise; commonMistakes: string[];
  weakVsStrong: { weak: string; strong: string }; workplaceSignals: string[];
  recommendedNext: number; skillsAddressed: string[];
}

interface SkillAssessment { skillName: string; currentScore: number; lessonsContributing: string[]; }

interface ProgressSummary {
  totalLessons: number; completedLessons: number; inProgressLessons: number;
  averageQuizScore: number; averageConfidence: number; completionPercentage: number;
  levelProgress: {
    foundation: { total: number; completed: number };
    intermediate: { total: number; completed: number };
    advanced: { total: number; completed: number };
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEVEL_COLORS: Record<string, string> = {
  foundation: '#4a6cf7',
  intermediate: '#f59e0b',
  advanced: '#8b5cf6',
};

const LEVEL_LABELS: Record<string, string> = {
  foundation: 'Foundation',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

type View = 'curriculum' | 'lesson' | 'skills';
type LessonTab = 'content' | 'worked' | 'scenario' | 'artefact' | 'quiz' | 'exercise' | 'reflect' | 'mistakes' | 'signals';

// ---------------------------------------------------------------------------
// Main Academy Component
// ---------------------------------------------------------------------------

export default function Academy() {
  const [view, setView] = useState<View>('curriculum');
  const [curriculum, setCurriculum] = useState<CurriculumEntry[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<AcademyLesson | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CurriculumEntry | null>(null);
  const [skills, setSkills] = useState<SkillAssessment[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [recommended, setRecommended] = useState<CurriculumEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [curRes, skillRes, progRes, recRes] = await Promise.all([
        window.archlens.academy.getCurriculum(),
        window.archlens.academy.getSkillAssessment(),
        window.archlens.academy.getProgress(),
        window.archlens.academy.getRecommendedNext(),
      ]);
      setCurriculum((curRes?.data ?? curRes) as CurriculumEntry[]);
      setSkills((skillRes?.data ?? skillRes) as SkillAssessment[]);
      setProgress((progRes?.data ?? progRes) as ProgressSummary);
      setRecommended((recRes?.data ?? recRes) as CurriculumEntry | null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load academy data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openLesson = useCallback(async (entry: CurriculumEntry) => {
    if (!entry.contentFile) {
      setError(`Lesson ${entry.lessonNumber} content is not yet available.`);
      return;
    }
    setLoading(true);
    try {
      const res = await window.archlens.academy.getLesson(entry.lessonNumber);
      const lesson = (res?.data ?? res) as AcademyLesson | null;
      if (!lesson) {
        setError(`Lesson ${entry.lessonNumber} content could not be loaded.`);
        return;
      }
      setSelectedLesson(lesson);
      setSelectedEntry(entry);
      setView('lesson');
      // Mark as in_progress if not started
      if (entry.status === 'not_started') {
        await window.archlens.academy.startLesson(entry.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson.');
    } finally {
      setLoading(false);
    }
  }, []);

  const goBack = useCallback(() => {
    if (view === 'lesson' || view === 'skills') {
      setView('curriculum');
      setSelectedLesson(null);
      setSelectedEntry(null);
      loadData();
    }
  }, [view, loadData]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        {view !== 'curriculum' && (
          <button onClick={goBack} style={backBtnStyle} aria-label="Go back">← Back</button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 0.25rem' }}>
              🎓 Solution Architect Academy
            </h2>
            <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
              {view === 'curriculum' && 'Structured, progressive lessons for UK Civil Service Solution Architects'}
              {view === 'lesson' && selectedLesson?.title}
              {view === 'skills' && 'Your skill assessment across 11 architecture competencies'}
            </p>
          </div>
          {view === 'curriculum' && (
            <button onClick={() => setView('skills')} style={skillsBtnStyle} aria-label="View skills dashboard">
              📊 Skills
            </button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" style={errorStyle}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}>✕</button>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}><p>Loading…</p></div>}

      {!loading && view === 'curriculum' && (
        <CurriculumView
          curriculum={curriculum}
          progress={progress}
          skills={skills}
          recommended={recommended}
          onOpenLesson={openLesson}
        />
      )}

      {!loading && view === 'lesson' && selectedLesson && selectedEntry && (
        <LessonView
          lesson={selectedLesson}
          entry={selectedEntry}
          onComplete={async (quizScore, confidence) => {
            await window.archlens.academy.completeLesson(selectedEntry.id, quizScore, confidence);
            goBack();
          }}
          onSaveNotes={async (notes) => {
            await window.archlens.academy.saveNotes(selectedEntry.id, notes);
          }}
          onSubmitExercise={async (type, question, answer, model) => {
            await window.archlens.academy.submitExercise(selectedEntry.id, type, question, answer, model);
          }}
        />
      )}

      {!loading && view === 'skills' && (
        <SkillsDashboard skills={skills} curriculum={curriculum} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Curriculum View
// ---------------------------------------------------------------------------

function CurriculumView({
  curriculum, progress, skills, recommended, onOpenLesson,
}: {
  curriculum: CurriculumEntry[];
  progress: ProgressSummary | null;
  skills: SkillAssessment[];
  recommended: CurriculumEntry | null;
  onOpenLesson: (entry: CurriculumEntry) => void;
}) {
  return (
    <div>
      {/* Progress summary */}
      {progress && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <StatCard label="Completed" value={`${progress.completedLessons} / ${progress.totalLessons}`} sub={`${progress.completionPercentage}%`} color="#059669" />
          <StatCard label="In Progress" value={String(progress.inProgressLessons)} sub="lessons" color="#f59e0b" />
          <StatCard label="Avg Quiz Score" value={progress.averageQuizScore > 0 ? `${progress.averageQuizScore}%` : '—'} sub="across completed" color="#4a6cf7" />
          <StatCard label="Avg Confidence" value={progress.averageConfidence > 0 ? `${progress.averageConfidence}/5` : '—'} sub="self-assessed" color="#8b5cf6" />
        </div>
      )}

      {/* Progress bar */}
      {progress && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {(['foundation', 'intermediate', 'advanced'] as const).map((level) => {
              const lp = progress.levelProgress[level];
              return (
                <div key={level} style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                    <span>{LEVEL_LABELS[level]}</span>
                    <span>{lp.completed}/{lp.total}</span>
                  </div>
                  <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${lp.total > 0 ? (lp.completed / lp.total) * 100 : 0}%`, background: LEVEL_COLORS[level], borderRadius: '3px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skill mini-bars */}
      {skills.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' }}>Skill Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
            {skills.map((s) => (
              <div key={s.skillName} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#666', width: '160px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.skillName}</span>
                <div style={{ flex: 1, height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.currentScore}%`, background: s.currentScore > 60 ? '#059669' : s.currentScore > 30 ? '#f59e0b' : '#ef4444', borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#999', width: '28px', textAlign: 'right' }}>{s.currentScore}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended next */}
      {recommended && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: '#92400e', fontSize: '0.9rem' }}>Recommended Next</p>
            <p style={{ margin: '0.15rem 0 0', color: '#92400e', fontSize: '0.85rem' }}>
              Lesson {recommended.lessonNumber}: {recommended.title}
            </p>
          </div>
          <button onClick={() => onOpenLesson(recommended)} style={{ padding: '0.4rem 0.75rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }} aria-label={`Start recommended lesson: ${recommended.title}`}>
            Start →
          </button>
        </div>
      )}

      {/* Lesson list grouped by level */}
      {(['foundation', 'intermediate', 'advanced'] as const).map((level) => {
        const lessons = curriculum.filter((l) => l.level === level);
        if (lessons.length === 0) return null;
        return (
          <div key={level} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: LEVEL_COLORS[level], margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: LEVEL_COLORS[level] }} />
              {LEVEL_LABELS[level]}
            </h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {lessons.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => onOpenLesson(entry)}
                  disabled={!entry.contentFile}
                  aria-label={`Open lesson ${entry.lessonNumber}: ${entry.title}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', textAlign: 'left', padding: '0.85rem 1rem',
                    background: entry.contentFile ? '#fff' : '#f9fafb', border: '1px solid #e0e0e0',
                    borderRadius: '8px', cursor: entry.contentFile ? 'pointer' : 'default',
                    opacity: entry.contentFile ? 1 : 0.6,
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                    borderLeft: `3px solid ${entry.status === 'completed' ? '#059669' : entry.status === 'in_progress' ? '#f59e0b' : '#e0e0e0'}`,
                  }}
                  onMouseEnter={(e) => { if (entry.contentFile) { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = LEVEL_COLORS[level]; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: 600, minWidth: '24px' }}>{entry.lessonNumber}.</span>
                      <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' }}>{entry.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem', marginLeft: '32px', fontSize: '0.75rem', color: '#999' }}>
                      <span>{entry.theme}</span>
                      <span>·</span>
                      <span>~{entry.estimatedMinutes} min</span>
                      {!entry.contentFile && <><span>·</span><span style={{ fontStyle: 'italic' }}>Coming soon</span></>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {entry.status === 'completed' && (
                      <span style={{ padding: '0.15rem 0.5rem', background: '#ecfdf5', color: '#059669', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
                        ✓ {entry.quizScore !== undefined ? `${entry.quizScore}%` : 'Done'}
                      </span>
                    )}
                    {entry.status === 'in_progress' && (
                      <span style={{ padding: '0.15rem 0.5rem', background: '#fffbeb', color: '#d97706', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
                        In Progress
                      </span>
                    )}
                    {entry.confidenceLevel !== undefined && entry.confidenceLevel > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>{'★'.repeat(entry.confidenceLevel)}{'☆'.repeat(5 - entry.confidenceLevel)}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem', borderTop: `3px solid ${color}` }}>
      <p style={{ margin: 0, fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: '0.25rem 0 0', fontSize: '1.25rem', fontWeight: 700, color: '#1a1a2e' }}>{value}</p>
      <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#999' }}>{sub}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lesson View
// ---------------------------------------------------------------------------

function LessonView({
  lesson, entry, onComplete, onSaveNotes, onSubmitExercise,
}: {
  lesson: AcademyLesson;
  entry: CurriculumEntry;
  onComplete: (quizScore: number, confidence: number) => Promise<void>;
  onSaveNotes: (notes: string) => Promise<void>;
  onSubmitExercise: (type: string, question: string, answer: string, model: string) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<LessonTab>('content');
  const [notes, setNotes] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [exerciseAnswer, setExerciseAnswer] = useState('');
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [showArtefactModel, setShowArtefactModel] = useState(false);
  const [completing, setCompleting] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => { onSaveNotes(value); }, 1000);
  }, [onSaveNotes]);

  const quizScore = quizSubmitted
    ? Math.round(
        (Object.entries(quizAnswers).filter(
          ([i, ans]) => ans === lesson.knowledgeCheck[Number(i)]?.correctIndex,
        ).length / lesson.knowledgeCheck.length) * 100,
      )
    : 0;

  const handleComplete = async () => {
    if (confidence === 0) return;
    setCompleting(true);
    try {
      await onComplete(quizScore, confidence);
    } finally {
      setCompleting(false);
    }
  };

  const tabs: { key: LessonTab; label: string }[] = [
    { key: 'content', label: 'Teaching' },
    { key: 'worked', label: 'Worked Example' },
    { key: 'scenario', label: 'Scenario' },
    { key: 'artefact', label: 'Practice' },
    { key: 'quiz', label: 'Quiz' },
    { key: 'exercise', label: 'Exercise' },
    { key: 'reflect', label: 'Reflect' },
    { key: 'mistakes', label: 'Pitfalls' },
    { key: 'signals', label: 'Signals' },
  ];

  return (
    <div>
      {/* Lesson header */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem', borderLeft: `4px solid ${LEVEL_COLORS[lesson.level]}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ padding: '0.1rem 0.5rem', background: LEVEL_COLORS[lesson.level] + '20', color: LEVEL_COLORS[lesson.level], borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                {LEVEL_LABELS[lesson.level]}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>Lesson {lesson.lessonNumber} · {lesson.theme} · ~{lesson.estimatedMinutes} min</span>
            </div>
            <h3 style={{ margin: '0.25rem 0 0.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#1a1a2e' }}>{lesson.title}</h3>
            <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6 }}>
              {lesson.objectives.map((obj, i) => <div key={i} style={{ marginBottom: '0.15rem' }}>• {obj}</div>)}
            </div>
          </div>
        </div>
        {lesson.whyThisMatters && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0f4ff', borderRadius: '6px', fontSize: '0.85rem', color: '#444', lineHeight: 1.6 }}>
            <strong style={{ color: '#4a6cf7' }}>Why this matters:</strong> {lesson.whyThisMatters}
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            aria-label={`Switch to ${tab.label} tab`}
            style={{
              padding: '0.4rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: '6px',
              background: activeTab === tab.key ? '#4a6cf7' : '#fff',
              color: activeTab === tab.key ? '#fff' : '#666',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: activeTab === tab.key ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ marginBottom: '1.5rem' }}>
        {activeTab === 'content' && <TeachingContent sections={lesson.content} />}
        {activeTab === 'worked' && <WorkedExampleView example={lesson.workedExample} />}
        {activeTab === 'scenario' && <ScenarioView scenario={lesson.civilServiceScenario} />}
        {activeTab === 'artefact' && <ArtefactView artefact={lesson.practiceArtefact} showModel={showArtefactModel} onToggleModel={() => setShowArtefactModel(!showArtefactModel)} />}
        {activeTab === 'quiz' && (
          <QuizView
            questions={lesson.knowledgeCheck}
            answers={quizAnswers}
            submitted={quizSubmitted}
            score={quizScore}
            onAnswer={(qi, ai) => setQuizAnswers((prev) => ({ ...prev, [qi]: ai }))}
            onSubmit={() => {
              setQuizSubmitted(true);
              lesson.knowledgeCheck.forEach((q, i) => {
                if (quizAnswers[i] !== undefined) {
                  onSubmitExercise('quiz', q.question, q.options[quizAnswers[i]], q.options[q.correctIndex]);
                }
              });
            }}
          />
        )}
        {activeTab === 'exercise' && (
          <ExerciseView
            exercise={lesson.practicalExercise}
            answer={exerciseAnswer}
            showModel={showModelAnswer}
            onAnswerChange={setExerciseAnswer}
            onToggleModel={() => {
              setShowModelAnswer(!showModelAnswer);
              if (!showModelAnswer && exerciseAnswer.trim()) {
                onSubmitExercise('scenario', lesson.practicalExercise.task, exerciseAnswer, lesson.practicalExercise.modelAnswer);
              }
            }}
          />
        )}
        {activeTab === 'reflect' && <ReflectView questions={lesson.reflectiveQuestions} />}
        {activeTab === 'mistakes' && <MistakesView mistakes={lesson.commonMistakes} weakVsStrong={lesson.weakVsStrong} />}
        {activeTab === 'signals' && <SignalsView signals={lesson.workplaceSignals} />}
      </div>

      {/* Notes section */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' }}>📝 Your Notes</h4>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Write your notes here — they auto-save…"
          aria-label="Lesson notes"
          style={{ width: '100%', minHeight: '100px', padding: '0.75rem', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '0.85rem', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      {/* Confidence & Complete */}
      {entry.status !== 'completed' && (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', fontWeight: 600, color: '#1a1a2e' }}>Confidence Level</p>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setConfidence(star)}
                  aria-label={`Set confidence to ${star} out of 5`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: star <= confidence ? '#f59e0b' : '#d1d5db', transition: 'color 0.15s' }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleComplete}
            disabled={completing || confidence === 0}
            aria-label="Complete lesson"
            style={{
              padding: '0.6rem 1.5rem', background: completing || confidence === 0 ? '#a0a0a0' : '#059669',
              color: '#fff', border: 'none', borderRadius: '6px',
              cursor: completing || confidence === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem', fontWeight: 600,
            }}
          >
            {completing ? 'Saving…' : `Complete Lesson${quizSubmitted ? ` (Quiz: ${quizScore}%)` : ''}`}
          </button>
        </div>
      )}

      {/* Generate Infographic */}
      <InfographicPanel lesson={lesson} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Infographic Panel
// ---------------------------------------------------------------------------

function InfographicPanel({ lesson }: { lesson: AcademyLesson }) {
  const [generating, setGenerating] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if infographic already exists
  useEffect(() => {
    (async () => {
      try {
        const res = await window.archlens.infographics.getImageData(lesson.lessonNumber);
        const imgData = res?.data ?? res;
        // Only set if it's a valid base64 data URL string
        if (imgData && typeof imgData === 'string' && imgData.startsWith('data:image/')) {
          setImageData(imgData);
        } else {
          setImageData(null);
        }
      } catch {
        setImageData(null);
      }
    })();
  }, [lesson.lessonNumber]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const keyPoints = lesson.content.slice(0, 5).map(s => s.heading);
      const genRes = await window.archlens.infographics.generate(lesson.lessonNumber, lesson.title, keyPoints);
      // Check for IPC error
      if (genRes && genRes.success === false && genRes.error) {
        throw new Error(genRes.error.userMessage || genRes.error.message || 'Generation failed');
      }
      // Reload the image
      const res = await window.archlens.infographics.getImageData(lesson.lessonNumber);
      const imgData = res?.data ?? res;
      if (imgData && typeof imgData === 'string' && imgData.startsWith('data:image/')) {
        setImageData(imgData);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate infographic. Check your OpenAI API key in Settings.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      await window.archlens.infographics.download(lesson.lessonNumber);
    } catch { /* user cancelled */ }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginTop: '1rem' }}>
      <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 600, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        🎨 Infographic for Mentoring
      </h4>
      <p style={{ color: '#666', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
        Generate a visually consistent infographic summarising this lesson's key concepts — perfect for sharing with junior staff.
      </p>

      {error && (
        <div style={{ padding: '0.5rem 0.75rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          {error}
        </div>
      )}

      {imageData ? (
        <div>
          <img
            src={imageData}
            alt={`Infographic for Lesson ${lesson.lessonNumber}: ${lesson.title}`}
            style={{ width: '100%', maxWidth: '400px', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '0.75rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleDownload} style={{ padding: '0.4rem 0.75rem', background: '#4a6cf7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              💾 Download PNG
            </button>
            <button onClick={handleGenerate} disabled={generating} style={{ padding: '0.4rem 0.75rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', cursor: generating ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600, opacity: generating ? 0.7 : 1 }}>
              {generating ? '⏳ Regenerating…' : '🔄 Regenerate'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            padding: '0.6rem 1.25rem', background: generating ? '#a0a0a0' : '#4a6cf7',
            color: '#fff', border: 'none', borderRadius: '6px',
            cursor: generating ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem', fontWeight: 600,
          }}
        >
          {generating ? '⏳ Generating infographic (this takes ~30 seconds)…' : '🎨 Generate Infographic'}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Teaching Content
// ---------------------------------------------------------------------------

function TeachingContent({ sections }: { sections: LessonSection[] }) {
  return (
    <div>
      {sections.map((section, i) => (
        <div key={i} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '0.75rem' }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>{section.heading}</h4>
          <div style={{ color: '#444', fontSize: '0.9rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{section.body}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Worked Example
// ---------------------------------------------------------------------------

function WorkedExampleView({ example }: { example: WorkedExample }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
      <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>🔍 {example.title}</h4>
      <Section label="Context" text={example.context} />
      <Section label="Approach" text={example.approach} />
      <Section label="Outcome" text={example.outcome} />
      <Section label="Lessons Learned" text={example.lessonsLearned} color="#059669" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenario
// ---------------------------------------------------------------------------

function ScenarioView({ scenario }: { scenario: CivilServiceScenario }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
      <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>🏛️ {scenario.title}</h4>
      <Section label="Background" text={scenario.background} />
      <Section label="Challenge" text={scenario.challenge} />
      <div style={{ margin: '0.75rem 0' }}>
        <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e', margin: '0 0 0.25rem' }}>Constraints:</p>
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {scenario.constraints.map((c, i) => <li key={i} style={{ color: '#444', fontSize: '0.85rem', lineHeight: 1.6 }}>{c}</li>)}
        </ul>
      </div>
      <Section label="Your Role" text={scenario.yourRole} color="#4a6cf7" />
      <Section label="Discussion" text={scenario.discussion} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Practice Artefact
// ---------------------------------------------------------------------------

function ArtefactView({ artefact, showModel, onToggleModel }: { artefact: PracticeArtefact; showModel: boolean; onToggleModel: () => void }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
      <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>📋 Practice: {artefact.type}</h4>
      <Section label="Task" text={artefact.description} />
      <Section label="Guidance" text={artefact.guidance} color="#4a6cf7" />
      <button onClick={onToggleModel} style={revealBtnStyle} aria-label={showModel ? 'Hide model answer' : 'Show model answer'}>
        {showModel ? 'Hide Model Answer' : 'Reveal Model Answer'}
      </button>
      {showModel && (
        <div style={{ marginTop: '0.75rem', padding: '1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
          <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#059669', margin: '0 0 0.5rem' }}>Model Answer:</p>
          <div style={{ color: '#444', fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{artefact.modelAnswer}</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

function QuizView({
  questions, answers, submitted, score, onAnswer, onSubmit,
}: {
  questions: QuizQuestion[];
  answers: Record<number, number>;
  submitted: boolean;
  score: number;
  onAnswer: (qi: number, ai: number) => void;
  onSubmit: () => void;
}) {
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div>
      {submitted && (
        <div style={{ padding: '1rem', background: score >= 80 ? '#ecfdf5' : score >= 60 ? '#fffbeb' : '#fef2f2', border: `1px solid ${score >= 80 ? '#a7f3d0' : score >= 60 ? '#fcd34d' : '#fca5a5'}`, borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626' }}>
            Score: {score}%
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#666' }}>
            {score >= 80 ? 'Excellent understanding!' : score >= 60 ? 'Good — review the explanations below.' : 'Review the teaching content and try again.'}
          </p>
        </div>
      )}
      {questions.map((q, qi) => {
        const userAnswer = answers[qi];
        const isCorrect = userAnswer === q.correctIndex;
        return (
          <div key={qi} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#1a1a2e' }}>
              {qi + 1}. {q.question}
            </p>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              {q.options.map((opt, oi) => {
                let bg = '#f9fafb';
                let border = '1px solid #e0e0e0';
                let color = '#444';
                if (submitted) {
                  if (oi === q.correctIndex) { bg = '#ecfdf5'; border = '1px solid #a7f3d0'; color = '#059669'; }
                  else if (oi === userAnswer && !isCorrect) { bg = '#fef2f2'; border = '1px solid #fca5a5'; color = '#dc2626'; }
                } else if (userAnswer === oi) {
                  bg = '#f0f4ff'; border = '1px solid #4a6cf7'; color = '#4a6cf7';
                }
                return (
                  <button
                    key={oi}
                    onClick={() => !submitted && onAnswer(qi, oi)}
                    disabled={submitted}
                    aria-label={`Option ${oi + 1}: ${opt}`}
                    style={{ textAlign: 'left', padding: '0.5rem 0.75rem', background: bg, border, borderRadius: '6px', cursor: submitted ? 'default' : 'pointer', color, fontSize: '0.85rem', lineHeight: 1.5 }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#f0f4ff', borderRadius: '6px', fontSize: '0.8rem', color: '#444', lineHeight: 1.5 }}>
                <strong>{isCorrect ? '✓ Correct' : '✗ Incorrect'}:</strong> {q.explanation}
              </div>
            )}
          </div>
        );
      })}
      {!submitted && (
        <button onClick={onSubmit} disabled={!allAnswered} style={{ ...revealBtnStyle, background: allAnswered ? '#4a6cf7' : '#a0a0a0', cursor: allAnswered ? 'pointer' : 'not-allowed' }} aria-label="Submit quiz answers">
          Submit Answers
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exercise
// ---------------------------------------------------------------------------

function ExerciseView({
  exercise, answer, showModel, onAnswerChange, onToggleModel,
}: {
  exercise: PracticalExercise;
  answer: string;
  showModel: boolean;
  onAnswerChange: (v: string) => void;
  onToggleModel: () => void;
}) {
  const [showHints, setShowHints] = useState(false);
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
      <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>✍️ {exercise.title}</h4>
      <Section label="Scenario" text={exercise.scenario} />
      <Section label="Task" text={exercise.task} color="#4a6cf7" />

      <button onClick={() => setShowHints(!showHints)} style={{ ...revealBtnStyle, background: '#f59e0b', marginBottom: '0.75rem' }} aria-label={showHints ? 'Hide hints' : 'Show hints'}>
        {showHints ? 'Hide Hints' : 'Show Hints'}
      </button>
      {showHints && (
        <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.25rem' }}>
          {exercise.hints.map((h, i) => <li key={i} style={{ color: '#92400e', fontSize: '0.85rem', lineHeight: 1.6 }}>{h}</li>)}
        </ul>
      )}

      <textarea
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Write your response here…"
        aria-label="Exercise response"
        style={{ width: '100%', minHeight: '200px', padding: '0.75rem', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '0.85rem', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.75rem' }}
      />

      <button onClick={onToggleModel} style={revealBtnStyle} aria-label={showModel ? 'Hide model answer' : 'Show model answer'}>
        {showModel ? 'Hide Model Answer' : 'Reveal Model Answer'}
      </button>

      {showModel && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ padding: '1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', marginBottom: '0.75rem' }}>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#059669', margin: '0 0 0.5rem' }}>Model Answer:</p>
            <div style={{ color: '#444', fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{exercise.modelAnswer}</div>
          </div>
          <div style={{ padding: '0.75rem', background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '6px' }}>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#4a6cf7', margin: '0 0 0.25rem' }}>Assessment Criteria:</p>
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {exercise.assessmentCriteria.map((c, i) => <li key={i} style={{ color: '#444', fontSize: '0.85rem', lineHeight: 1.6 }}>{c}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reflective Questions
// ---------------------------------------------------------------------------

function ReflectView({ questions }: { questions: string[] }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
      <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>🤔 Reflective Questions</h4>
      <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Take a moment to consider these questions honestly. There are no right answers — the value is in the reflection.</p>
      {questions.map((q, i) => (
        <div key={i} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#444', lineHeight: 1.6 }}>
          {i + 1}. {q}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Common Mistakes & Weak vs Strong
// ---------------------------------------------------------------------------

function MistakesView({ mistakes, weakVsStrong }: { mistakes: string[]; weakVsStrong: { weak: string; strong: string } }) {
  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '0.75rem' }}>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#dc2626' }}>⚠️ Common Mistakes</h4>
        {mistakes.map((m, i) => (
          <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#fef2f2', borderRadius: '6px', marginBottom: '0.35rem', fontSize: '0.85rem', color: '#991b1b', lineHeight: 1.6 }}>
            {m}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#dc2626' }}>❌ Weak SA</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b', lineHeight: 1.6 }}>{weakVsStrong.weak}</p>
        </div>
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#059669' }}>✓ Strong SA</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#065f46', lineHeight: 1.6 }}>{weakVsStrong.strong}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workplace Signals
// ---------------------------------------------------------------------------

function SignalsView({ signals }: { signals: string[] }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
      <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>📡 Workplace Signals</h4>
      <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.75rem' }}>You know you're applying this lesson well when:</p>
      {signals.map((s, i) => (
        <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#f0f4ff', borderRadius: '6px', marginBottom: '0.35rem', fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <span style={{ color: '#4a6cf7', flexShrink: 0 }}>✦</span> {s}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skills Dashboard
// ---------------------------------------------------------------------------

function SkillsDashboard({ skills, curriculum }: { skills: SkillAssessment[]; curriculum: CurriculumEntry[] }) {
  const maxScore = Math.max(...skills.map((s) => s.currentScore), 1);
  const weakest = [...skills].sort((a, b) => a.currentScore - b.currentScore).slice(0, 3);

  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e' }}>Skill Assessment</h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {skills.map((s) => (
            <div key={s.skillName}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1a1a2e' }}>{s.skillName}</span>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>{s.currentScore}/100</span>
              </div>
              <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${s.currentScore}%`,
                  background: s.currentScore > 60 ? '#059669' : s.currentScore > 30 ? '#f59e0b' : '#ef4444',
                  borderRadius: '4px',
                  transition: 'width 0.3s',
                }} />
              </div>
              {s.lessonsContributing.length > 0 && (
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.7rem', color: '#999' }}>
                  Contributing lessons: {s.lessonsContributing.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weakest areas */}
      <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#92400e' }}>Areas to Focus On</h4>
        {weakest.map((s) => {
          const relevantLessons = curriculum.filter((l) =>
            l.skillsAddressed.includes(s.skillName) && l.status !== 'completed' && l.contentFile,
          );
          return (
            <div key={s.skillName} style={{ marginBottom: '0.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: '#92400e' }}>
                {s.skillName} ({s.currentScore}/100)
              </p>
              {relevantLessons.length > 0 && (
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#b45309' }}>
                  Try: {relevantLessons.slice(0, 3).map((l) => `Lesson ${l.lessonNumber}`).join(', ')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Skill-to-lesson mapping */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' }}>Skill → Lesson Map</h4>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {skills.map((s) => {
            const lessons = curriculum.filter((l) => l.skillsAddressed.includes(s.skillName));
            return (
              <div key={s.skillName} style={{ padding: '0.5rem 0.75rem', background: '#f9fafb', borderRadius: '6px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: '#1a1a2e' }}>{s.skillName}</p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#666' }}>
                  {lessons.map((l) => `${l.lessonNumber}. ${l.title}`).join(' · ')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function Section({ label, text, color }: { label: string; text: string; color?: string }) {
  return (
    <div style={{ margin: '0.75rem 0' }}>
      <p style={{ fontWeight: 600, fontSize: '0.85rem', color: color ?? '#1a1a2e', margin: '0 0 0.25rem' }}>{label}:</p>
      <div style={{ color: '#444', fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{text}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const backBtnStyle: React.CSSProperties = {
  padding: '0.3rem 0.6rem', background: 'transparent', color: '#4a6cf7',
  border: 'none', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block',
};

const skillsBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem', background: '#4a6cf7', color: '#fff', border: 'none',
  borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0,
};

const errorStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5',
  borderRadius: '6px', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.9rem',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};

const revealBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem', background: '#4a6cf7', color: '#fff', border: 'none',
  borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
};
