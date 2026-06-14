// Architecture Design Lab — Landing Page
// Implements: Requirements 12.1, 12.2, 12.3, 12.5

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesignLabStore } from '../stores/design-lab-store';

interface SavedAssessment {
  id: string;
  scenarioId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: 'in-progress' | 'complete';
}

interface SavedScenario {
  id: string;
  name: string;
  status: 'draft' | 'complete';
  completeness: number;
  created_at: string;
  updated_at: string;
}

export default function DesignLab() {
  const [assessments, setAssessments] = useState<SavedAssessment[]>([]);
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { reset } = useDesignLabStore();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [assessResult, scenarioResult] = await Promise.all([
        (window as any).archlens.designLab.listSavedAssessments(),
        (window as any).archlens.designLab.listScenarios(),
      ]);

      if (assessResult.success) setAssessments(assessResult.data);
      if (scenarioResult.success) setScenarios(scenarioResult.data);
    } catch (err) {
      console.error('Failed to load Design Lab data:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleNewAssessment() {
    reset();
    navigate('/design-lab/discovery');
  }

  function handleResumeScenario(scenarioId: string) {
    navigate(`/design-lab/wizard/${scenarioId}`);
  }

  function handleViewAssessment(assessmentId: string) {
    navigate(`/design-lab/assessment/${assessmentId}`);
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        Loading Design Lab...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
          🏗️ Architecture Design Lab
        </h1>
        <p style={{ color: '#666', marginTop: '0.4rem', fontSize: '0.9rem' }}>
          Move from requirements and constraints into practical architecture decisions.
          Start with a discovery session or jump straight into a scenario assessment.
        </p>
      </header>

      {/* New Assessment Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={handleNewAssessment}
          style={{
            padding: '0.8rem 1.5rem',
            background: '#4a6cf7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#3b5de7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#4a6cf7'; }}
        >
          + New Assessment
        </button>
      </div>

      {/* In-Progress Scenarios */}
      {scenarios.filter((s) => s.status === 'draft').length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e', marginBottom: '0.75rem' }}>
            In-Progress Scenarios
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {scenarios
              .filter((s) => s.status === 'draft')
              .map((scenario) => (
                <div
                  key={scenario.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.8rem 1rem',
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#1a1a2e' }}>
                      {scenario.name}
                    </span>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>
                        {scenario.completeness}% complete
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>
                        Updated: {new Date(scenario.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResumeScenario(scenario.id)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: '#f0f4ff',
                      color: '#4a6cf7',
                      border: '1px solid #4a6cf7',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Resume
                  </button>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Completed Assessments */}
      {assessments.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e', marginBottom: '0.75rem' }}>
            Completed Assessments
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {assessments.map((assessment) => (
              <div
                key={assessment.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.8rem 1rem',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#1a1a2e' }}>
                    {assessment.name}
                  </span>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <StatusBadge status={assessment.status} />
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>
                      {new Date(assessment.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleViewAssessment(assessment.id)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: '#fff',
                    color: '#4a6cf7',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {assessments.length === 0 && scenarios.filter((s) => s.status === 'draft').length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No assessments yet</p>
          <p style={{ fontSize: '0.85rem' }}>
            Click "New Assessment" to start your first architecture design assessment.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: 'in-progress' | 'complete' }) {
  const isComplete = status === 'complete';
  return (
    <span
      style={{
        padding: '0.15rem 0.5rem',
        background: isComplete ? '#d1fae5' : '#fef3c7',
        color: isComplete ? '#065f46' : '#92400e',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'uppercase',
      }}
    >
      {isComplete ? 'Complete' : 'In Progress'}
    </span>
  );
}
