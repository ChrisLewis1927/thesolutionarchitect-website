// ArchLens — Diagram Training page
// Implemented in Task 17.3

import { useState, useEffect, useCallback } from 'react';

interface AnnotatedExample {
  imageUrl: string;
  annotations: Array<{ element: string; explanation: string }>;
}

interface WalkthroughStep {
  stepNumber: number;
  instruction: string;
  imageUrl: string;
}

interface Exercise {
  scenario: string;
  expectedDiagramType: string;
  hints: string[];
  sampleSolution: string;
}

interface Mistake {
  description: string;
  incorrectExample: string;
  correctedExample: string;
  explanation: string;
}

interface DiagramContent {
  explanation: string;
  annotatedExamples: AnnotatedExample[];
  walkthrough: WalkthroughStep[];
  exercises: Exercise[];
  commonMistakes: Mistake[];
}

interface DiagramModule {
  id: string;
  title: string;
  diagramType: string;
  content: DiagramContent;
  sequenceOrder: number;
  completed?: boolean;
}

interface ArchiMateSymbol {
  name: string;
  description: string;
  layer?: string;
  notation?: string;
}

interface ArchiMateRelationship {
  name: string;
  description: string;
  notation?: string;
}

interface ArchiMateLayer {
  name: string;
  description: string;
  color?: string;
}

interface ArchiMateReference {
  symbols: ArchiMateSymbol[];
  relationships: ArchiMateRelationship[];
  layers: ArchiMateLayer[];
}

const DIAGRAM_TYPE_LABELS: Record<string, string> = {
  archimate: 'ArchiMate',
  'solution-overview': 'Solution Overview',
  'data-flow': 'Data Flow',
  sequence: 'Sequence',
  'network-topology': 'Network Topology',
  deployment: 'Deployment',
};

const DIAGRAM_TYPE_ICONS: Record<string, string> = {
  archimate: '🏗️',
  'solution-overview': '🗺️',
  'data-flow': '🔄',
  sequence: '📋',
  'network-topology': '🌐',
  deployment: '🚀',
};

type View = 'types' | 'modules' | 'content' | 'reference';

export default function Diagrams() {
  const [view, setView] = useState<View>('types');
  const [diagramTypes] = useState(Object.keys(DIAGRAM_TYPE_LABELS));
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [modules, setModules] = useState<DiagramModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<DiagramModule | null>(null);
  const [reference, setReference] = useState<ArchiMateReference | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [contentTab, setContentTab] = useState<'overview' | 'examples' | 'walkthrough' | 'exercises' | 'mistakes'>('overview');

  const loadModules = useCallback(async (type: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.archlens.diagrams.getModules(type);
      const data = (result?.data ?? result) as DiagramModule[];
      setModules(Array.isArray(data) ? data : []);
      setSelectedType(type);
      setView('modules');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load modules.');
    } finally {
      setLoading(false);
    }
  }, []);

  const openModule = useCallback(async (modId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.archlens.diagrams.getModule(modId);
      const data = (result?.data ?? result) as DiagramModule;
      setSelectedModule(data);
      setContentTab('overview');
      setView('content');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load module.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReference = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.archlens.diagrams.getReference();
      const data = (result?.data ?? result) as ArchiMateReference;
      setReference(data);
      setView('reference');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load reference library.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleComplete = useCallback(async () => {
    if (!selectedModule) return;
    setCompleting(true);
    try {
      await window.archlens.diagrams.completeModule(selectedModule.id);
      setSelectedModule((prev) => prev ? { ...prev, completed: true } : prev);
    } catch { /* best-effort */ }
    finally { setCompleting(false); }
  }, [selectedModule]);

  const goBack = useCallback(() => {
    if (view === 'content') {
      setView('modules');
      setSelectedModule(null);
      if (selectedType) loadModules(selectedType);
    } else if (view === 'modules' || view === 'reference') {
      setView('types');
      setSelectedType(null);
      setModules([]);
      setReference(null);
    }
  }, [view, selectedType, loadModules]);

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        {view !== 'types' && (
          <button onClick={goBack} aria-label="Go back" style={{ padding: '0.3rem 0.6rem', background: 'transparent', color: '#4a6cf7', border: 'none', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>
            ← Back
          </button>
        )}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a2e', margin: '0 0 0.25rem' }}>
          Diagram Training
        </h2>
        <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
          {view === 'types' && 'Learn architecture diagramming techniques and ArchiMate notation'}
          {view === 'modules' && selectedType && DIAGRAM_TYPE_LABELS[selectedType]}
          {view === 'content' && selectedModule && selectedModule.title}
          {view === 'reference' && 'ArchiMate Reference Library'}
        </p>
      </div>

      {error && (
        <div role="alert" style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}><p>Loading…</p></div>}

      {/* Diagram type browser */}
      {!loading && view === 'types' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            {diagramTypes.map((type) => (
              <button key={type} onClick={() => loadModules(type)}
                aria-label={`View ${DIAGRAM_TYPE_LABELS[type]} modules`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'box-shadow 0.15s, border-color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#4a6cf7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
              >
                <span style={{ fontSize: '1.5rem' }}>{DIAGRAM_TYPE_ICONS[type] ?? '📐'}</span>
                <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.95rem' }}>{DIAGRAM_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>
          {/* ArchiMate Reference Library button */}
          <button onClick={loadReference}
            aria-label="Open ArchiMate Reference Library"
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', background: '#f0f4ff', border: '1px solid #4a6cf7', borderRadius: '8px', cursor: 'pointer', width: '100%', textAlign: 'left' }}
          >
            <span style={{ fontSize: '1.5rem' }}>📖</span>
            <div>
              <span style={{ fontWeight: 600, color: '#4a6cf7', fontSize: '0.95rem', display: 'block' }}>ArchiMate Reference Library</span>
              <span style={{ color: '#666', fontSize: '0.8rem' }}>Symbols, relationships, and layer definitions</span>
            </div>
          </button>
        </div>
      )}

      {/* Module list */}
      {!loading && view === 'modules' && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {modules.map((mod) => (
            <button key={mod.id} onClick={() => openModule(mod.id)}
              aria-label={`Open module: ${mod.title}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', padding: '1rem 1.25rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#4a6cf7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
            >
              <div>
                <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.95rem' }}>{mod.title}</span>
                <p style={{ margin: '0.25rem 0 0', color: '#999', fontSize: '0.8rem' }}>Module {mod.sequenceOrder}</p>
              </div>
              {mod.completed && (
                <span style={{ padding: '0.2rem 0.6rem', background: '#ecfdf5', color: '#059669', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500, flexShrink: 0 }}>✓ Completed</span>
              )}
            </button>
          ))}
          {modules.length === 0 && <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No modules available for this diagram type yet.</p>}
        </div>
      )}

      {/* Module content */}
      {!loading && view === 'content' && selectedModule && (
        <DiagramModuleContent module={selectedModule} contentTab={contentTab} setContentTab={setContentTab} completing={completing} onComplete={handleComplete} />
      )}

      {/* ArchiMate Reference */}
      {!loading && view === 'reference' && reference && (
        <ReferenceLibrary reference={reference} />
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Diagram module content sub-component
// ---------------------------------------------------------------------------

function DiagramModuleContent({
  module: mod,
  contentTab,
  setContentTab,
  completing,
  onComplete,
}: {
  module: { id: string; title: string; diagramType: string; content: DiagramContent; sequenceOrder: number; completed?: boolean };
  contentTab: 'overview' | 'examples' | 'walkthrough' | 'exercises' | 'mistakes';
  setContentTab: (tab: 'overview' | 'examples' | 'walkthrough' | 'exercises' | 'mistakes') => void;
  completing: boolean;
  onComplete: () => void;
}) {
  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'examples' as const, label: 'Examples' },
    { key: 'walkthrough' as const, label: 'Walkthrough' },
    { key: 'exercises' as const, label: 'Exercises' },
    { key: 'mistakes' as const, label: 'Common Mistakes' },
  ];

  return (
    <div>
      {/* Header with complete button */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e' }}>{mod.title}</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#999', fontSize: '0.8rem' }}>
            {DIAGRAM_TYPE_LABELS[mod.diagramType] ?? mod.diagramType} · Module {mod.sequenceOrder}
          </p>
        </div>
        {mod.completed ? (
          <span style={{ padding: '0.3rem 0.75rem', background: '#ecfdf5', color: '#059669', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500 }}>✓ Completed</span>
        ) : (
          <button onClick={onComplete} disabled={completing}
            style={{ padding: '0.5rem 1rem', background: completing ? '#a0a0a0' : '#4a6cf7', color: '#fff', border: 'none', borderRadius: '6px', cursor: completing ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            {completing ? 'Saving…' : 'Mark Complete'}
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div role="tablist" aria-label="Module content sections" style={{ display: 'flex', gap: '0', marginBottom: '1rem', background: '#e5e7eb', borderRadius: '8px', padding: '3px', overflowX: 'auto' }}>
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={contentTab === t.key} onClick={() => setContentTab(t.key)}
            style={{ padding: '0.5rem 1rem', background: contentTab === t.key ? '#fff' : 'transparent', color: contentTab === t.key ? '#1a1a2e' : '#666', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: contentTab === t.key ? 600 : 400, boxShadow: contentTab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {contentTab === 'overview' && (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ color: '#444', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{mod.content.explanation}</div>
        </div>
      )}

      {/* Annotated examples */}
      {contentTab === 'examples' && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {mod.content.annotatedExamples.map((ex, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
              {ex.imageUrl && <div style={{ marginBottom: '0.75rem', color: '#999', fontSize: '0.85rem' }}>📷 {ex.imageUrl}</div>}
              {ex.annotations.map((ann, j) => (
                <div key={j} style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem', background: '#f0f4ff', borderRadius: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#4a6cf7', fontSize: '0.85rem' }}>{ann.element}</span>
                  <p style={{ margin: '0.15rem 0 0', color: '#444', fontSize: '0.85rem' }}>{ann.explanation}</p>
                </div>
              ))}
            </div>
          ))}
          {mod.content.annotatedExamples.length === 0 && <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No annotated examples available.</p>}
        </div>
      )}

      {/* Walkthrough */}
      {contentTab === 'walkthrough' && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {mod.content.walkthrough.map((step) => (
            <div key={step.stepNumber} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#4a6cf7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>
                {step.stepNumber}
              </span>
              <div>
                <p style={{ margin: 0, color: '#444', fontSize: '0.9rem', lineHeight: 1.6 }}>{step.instruction}</p>
                {step.imageUrl && <p style={{ margin: '0.5rem 0 0', color: '#999', fontSize: '0.8rem' }}>📷 {step.imageUrl}</p>}
              </div>
            </div>
          ))}
          {mod.content.walkthrough.length === 0 && <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No walkthrough steps available.</p>}
        </div>
      )}

      {/* Exercises */}
      {contentTab === 'exercises' && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {mod.content.exercises.map((ex, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 600, color: '#1a1a2e' }}>Exercise {i + 1}</h4>
              <p style={{ margin: '0 0 0.5rem', color: '#444', fontSize: '0.9rem', lineHeight: 1.6 }}>{ex.scenario}</p>
              <p style={{ margin: '0 0 0.5rem', color: '#999', fontSize: '0.8rem' }}>Expected diagram type: {DIAGRAM_TYPE_LABELS[ex.expectedDiagramType] ?? ex.expectedDiagramType}</p>
              {ex.hints.length > 0 && (
                <div style={{ background: '#fffbeb', borderRadius: '6px', padding: '0.75rem', marginTop: '0.5rem' }}>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '0.85rem', color: '#92400e' }}>Hints</p>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                    {ex.hints.map((h, j) => <li key={j} style={{ color: '#92400e', fontSize: '0.85rem', lineHeight: 1.5 }}>{h}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {mod.content.exercises.length === 0 && <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No exercises available.</p>}
        </div>
      )}

      {/* Common mistakes */}
      {contentTab === 'mistakes' && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {mod.content.commonMistakes.map((m, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 600, color: '#b91c1c' }}>⚠️ {m.description}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ background: '#fef2f2', borderRadius: '6px', padding: '0.75rem' }}>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '0.8rem', color: '#b91c1c' }}>❌ Incorrect</p>
                  <p style={{ margin: 0, color: '#444', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{m.incorrectExample}</p>
                </div>
                <div style={{ background: '#ecfdf5', borderRadius: '6px', padding: '0.75rem' }}>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '0.8rem', color: '#059669' }}>✓ Correct</p>
                  <p style={{ margin: 0, color: '#444', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{m.correctedExample}</p>
                </div>
              </div>
              <p style={{ margin: 0, color: '#444', fontSize: '0.85rem', lineHeight: 1.6 }}>{m.explanation}</p>
            </div>
          ))}
          {mod.content.commonMistakes.length === 0 && <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No common mistakes documented.</p>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ArchiMate Reference Library sub-component
// ---------------------------------------------------------------------------

function ReferenceLibrary({ reference }: { reference: ArchiMateReference }) {
  const [tab, setTab] = useState<'symbols' | 'relationships' | 'layers'>('symbols');

  return (
    <div>
      <div role="tablist" aria-label="Reference sections" style={{ display: 'flex', gap: '0', marginBottom: '1rem', background: '#e5e7eb', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
        {(['symbols', 'relationships', 'layers'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            style={{ padding: '0.5rem 1.25rem', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#1a1a2e' : '#666', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: tab === t ? 600 : 400, boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'symbols' && (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {reference.symbols.map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' }}>{s.name}</span>
              {s.layer && <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', background: '#f0f4ff', color: '#4a6cf7', borderRadius: '4px', fontSize: '0.75rem' }}>{s.layer}</span>}
              <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.85rem' }}>{s.description}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'relationships' && (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {reference.relationships.map((r, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' }}>{r.name}</span>
              {r.notation && <span style={{ marginLeft: '0.5rem', color: '#999', fontSize: '0.8rem' }}>{r.notation}</span>}
              <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.85rem' }}>{r.description}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'layers' && (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {reference.layers.map((l, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '0.75rem 1rem', borderLeft: l.color ? `4px solid ${l.color}` : undefined }}>
              <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' }}>{l.name}</span>
              <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.85rem' }}>{l.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
