// ArchLens — Learning Modules page
// Implemented in Task 17.2

import { useState, useEffect, useCallback } from 'react';

interface ContentSection {
  heading: string;
  body: string;
}

interface ModuleContent {
  sections: ContentSection[];
  keyTakeaways: string[];
  practicalExamples: string[];
}

interface LearningModule {
  id: string;
  title: string;
  category: string;
  sequenceOrder: number;
  estimatedMinutes: number;
  content: ModuleContent;
  completed?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  'aws-well-architected': 'AWS Well-Architected',
  'azure-well-architected': 'Azure Well-Architected',
  togaf: 'TOGAF',
  'gds-service-standard': 'GDS Service Standard',
  'secure-by-design': 'Secure by Design',
  'zero-trust': 'Zero Trust',
  'enterprise-architecture': 'Enterprise Architecture',
  'solution-architecture': 'Solution Architecture',
};

const CATEGORY_ICONS: Record<string, string> = {
  'aws-well-architected': '☁️',
  'azure-well-architected': '🔷',
  togaf: '🏛️',
  'gds-service-standard': '🇬🇧',
  'secure-by-design': '🔒',
  'zero-trust': '🛡️',
  'enterprise-architecture': '🏢',
  'solution-architecture': '🧩',
};

type View = 'categories' | 'modules' | 'content';

export default function Learning() {
  const [view, setView] = useState<View>('categories');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [nextRecommended, setNextRecommended] = useState<LearningModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.archlens.learning.getCategories();
        const data = (result?.data ?? result) as string[];
        setCategories(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load categories.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadModules = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.archlens.learning.getModules(category);
      const data = (result?.data ?? result) as LearningModule[];
      setModules(Array.isArray(data) ? data : []);
      setSelectedCategory(category);
      setView('modules');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load modules.');
    } finally {
      setLoading(false);
    }
  }, []);

  const openModule = useCallback((mod: LearningModule) => {
    setSelectedModule(mod);
    setView('content');
  }, []);

  const handleComplete = useCallback(async () => {
    if (!selectedModule || !selectedCategory) return;
    setCompleting(true);
    try {
      await window.archlens.learning.completeModule(selectedModule.id);
      setSelectedModule((prev) => prev ? { ...prev, completed: true } : prev);
      // Fetch next recommended
      const result = await window.archlens.learning.getNextRecommended(selectedCategory);
      const data = (result?.data ?? result) as LearningModule | null;
      setNextRecommended(data);
    } catch {
      // Silently handle — completion is best-effort
    } finally {
      setCompleting(false);
    }
  }, [selectedModule, selectedCategory]);

  const goBack = useCallback(() => {
    if (view === 'content') {
      setView('modules');
      setSelectedModule(null);
      setNextRecommended(null);
      // Refresh modules to update completion status
      if (selectedCategory) loadModules(selectedCategory);
    } else if (view === 'modules') {
      setView('categories');
      setSelectedCategory(null);
      setModules([]);
    }
  }, [view, selectedCategory, loadModules]);

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header with breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        {view !== 'categories' && (
          <button
            onClick={goBack}
            aria-label="Go back"
            style={{
              padding: '0.3rem 0.6rem',
              background: 'transparent',
              color: '#4a6cf7',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              marginBottom: '0.5rem',
              display: 'block',
            }}
          >
            ← Back
          </button>
        )}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a2e', margin: '0 0 0.25rem' }}>
          Learning Modules
        </h2>
        <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
          {view === 'categories' && 'Choose a topic category to start learning'}
          {view === 'modules' && selectedCategory && `${CATEGORY_LABELS[selectedCategory] ?? selectedCategory}`}
          {view === 'content' && selectedModule && selectedModule.title}
        </p>
      </div>

      {error && (
        <div role="alert" style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <p>Loading…</p>
        </div>
      )}

      {/* Category list */}
      {!loading && view === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => loadModules(cat)}
              aria-label={`View ${CATEGORY_LABELS[cat] ?? cat} modules`}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '1rem 1.25rem', background: '#fff', border: '1px solid #e0e0e0',
                borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#4a6cf7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
            >
              <span style={{ fontSize: '1.5rem' }}>{CATEGORY_ICONS[cat] ?? '📖'}</span>
              <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.95rem' }}>
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
            </button>
          ))}
          {categories.length === 0 && (
            <p style={{ color: '#999', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
              No categories available yet.
            </p>
          )}
        </div>
      )}

      {/* Module list */}
      {!loading && view === 'modules' && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => openModule(mod)}
              aria-label={`Open module: ${mod.title}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', textAlign: 'left', padding: '1rem 1.25rem',
                background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px',
                cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#4a6cf7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
            >
              <div>
                <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.95rem' }}>
                  {mod.title}
                </span>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.8rem', color: '#999' }}>
                  <span>~{mod.estimatedMinutes} min</span>
                  <span>·</span>
                  <span>Module {mod.sequenceOrder}</span>
                </div>
              </div>
              {mod.completed && (
                <span style={{ padding: '0.2rem 0.6rem', background: '#ecfdf5', color: '#059669', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500, flexShrink: 0 }}>
                  ✓ Completed
                </span>
              )}
            </button>
          ))}
          {modules.length === 0 && (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
              No modules available in this category yet.
            </p>
          )}
        </div>
      )}

      {/* Module content */}
      {!loading && view === 'content' && selectedModule && (
        <ModuleContentView
          module={selectedModule}
          completing={completing}
          nextRecommended={nextRecommended}
          onComplete={handleComplete}
          onOpenNext={(mod) => { setSelectedModule(mod); setNextRecommended(null); }}
        />
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Module content sub-component
// ---------------------------------------------------------------------------

interface LearningModule {
  id: string;
  title: string;
  category: string;
  sequenceOrder: number;
  estimatedMinutes: number;
  content: { sections: { heading: string; body: string }[]; keyTakeaways: string[]; practicalExamples: string[] };
  completed?: boolean;
}

function ModuleContentView({
  module: mod,
  completing,
  nextRecommended,
  onComplete,
  onOpenNext,
}: {
  module: LearningModule;
  completing: boolean;
  nextRecommended: LearningModule | null;
  onComplete: () => void;
  onOpenNext: (mod: LearningModule) => void;
}) {
  return (
    <div>
      {/* Module header */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e' }}>{mod.title}</h3>
            <p style={{ margin: '0.25rem 0 0', color: '#999', fontSize: '0.8rem' }}>
              ~{mod.estimatedMinutes} min · Module {mod.sequenceOrder}
            </p>
          </div>
          {mod.completed ? (
            <span style={{ padding: '0.3rem 0.75rem', background: '#ecfdf5', color: '#059669', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500 }}>
              ✓ Completed
            </span>
          ) : (
            <button
              onClick={onComplete}
              disabled={completing}
              aria-label="Mark module as complete"
              style={{
                padding: '0.5rem 1rem', background: completing ? '#a0a0a0' : '#4a6cf7',
                color: '#fff', border: 'none', borderRadius: '6px',
                cursor: completing ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600,
              }}
            >
              {completing ? 'Saving…' : 'Mark Complete'}
            </button>
          )}
        </div>
      </div>

      {/* Sections */}
      {mod.content.sections.map((section, i) => (
        <div key={i} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '0.75rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>
            {section.heading}
          </h4>
          <div style={{ color: '#444', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {section.body}
          </div>
        </div>
      ))}

      {/* Key takeaways */}
      {mod.content.keyTakeaways.length > 0 && (
        <div style={{ background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '1.25rem', marginBottom: '0.75rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>
            Key Takeaways
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {mod.content.keyTakeaways.map((t, i) => (
              <li key={i} style={{ color: '#444', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.25rem' }}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Practical examples */}
      {mod.content.practicalExamples.length > 0 && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '1.25rem', marginBottom: '0.75rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>
            Practical Examples
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {mod.content.practicalExamples.map((ex, i) => (
              <li key={i} style={{ color: '#444', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.25rem' }}>{ex}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Next recommended */}
      {nextRecommended && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '1rem 1.25rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: '#92400e', fontSize: '0.9rem' }}>
              Next recommended
            </p>
            <p style={{ margin: '0.15rem 0 0', color: '#92400e', fontSize: '0.85rem' }}>
              {nextRecommended.title}
            </p>
          </div>
          <button
            onClick={() => onOpenNext(nextRecommended)}
            aria-label={`Open next module: ${nextRecommended.title}`}
            style={{
              padding: '0.4rem 0.75rem', background: '#f59e0b', color: '#fff',
              border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 600, flexShrink: 0,
            }}
          >
            Start Next
          </button>
        </div>
      )}
    </div>
  );
}
