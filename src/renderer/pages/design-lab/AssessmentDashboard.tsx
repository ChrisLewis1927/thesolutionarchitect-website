// Architecture Design Lab — Assessment Dashboard UI
// Implements: Requirements 3.1, 3.2, 3.3, 3.4, 5.7, 11.1, 11.2, 11.3

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDesignLabStore } from '../../stores/design-lab-store';

const RAG_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  green: { bg: '#d1fae5', color: '#065f46', label: 'High Confidence' },
  amber: { bg: '#fef3c7', color: '#92400e', label: 'Partial Confidence' },
  red: { bg: '#fee2e2', color: '#991b1b', label: 'Low Confidence' },
  grey: { bg: '#f1f5f9', color: '#475569', label: 'Not Assessed' },
  na: { bg: '#f9fafb', color: '#9ca3af', label: 'Not Applicable' },
};

export default function AssessmentDashboard() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { setAssessmentResult, setConfidenceSummary, selectedDomain, selectDomain, activeTab, setActiveTab } = useDesignLabStore();
  const [assessment, setAssessment] = useState<any>(null);
  const [confidence, setConfidence] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assessmentId) loadAssessment(assessmentId);
  }, [assessmentId]);

  async function loadAssessment(id: string) {
    try {
      const [assessResult, confResult] = await Promise.all([
        (window as any).archlens.designLab.getAssessment(id),
        (window as any).archlens.designLab.getConfidenceSummary(id),
      ]);
      if (assessResult.success) { setAssessment(assessResult.data); setAssessmentResult(assessResult.data); }
      if (confResult.success) { setConfidence(confResult.data); setConfidenceSummary(confResult.data); }
    } catch (err) {
      console.error('Failed to load assessment:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: '2rem', color: '#666' }}>Loading assessment...</div>;
  if (!assessment) return <div style={{ padding: '2rem', color: '#dc2626' }}>Assessment not found</div>;

  const selectedDomainData = selectedDomain ? assessment.domains.find((d: any) => d.domain === selectedDomain) : null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <button onClick={() => navigate('/design-lab')} style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem' }}>
        ← Back to Design Lab
      </button>

      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.5rem' }}>Assessment Dashboard</h1>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.5rem', borderBottom: '1px solid #e0e0e0', paddingBottom: '0.5rem' }}>
        {(['assessment', 'patterns', 'standards', 'export', 'learning'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ padding: '0.4rem 0.8rem', background: activeTab === tab ? '#4a6cf7' : 'transparent', color: activeTab === tab ? '#fff' : '#666', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: activeTab === tab ? 600 : 400, textTransform: 'capitalize' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'assessment' && (
        <>
          {/* RAG Summary Grid */}
          {confidence && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Design Confidence</h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>🟢 {confidence.greenCount}</span>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>🟡 {confidence.amberCount}</span>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>🔴 {confidence.redCount}</span>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>⚪ {confidence.greyCount}</span>
                <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '0.5rem' }}>Maturity: {confidence.overallMaturity}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                {confidence.scores.map((score: any) => {
                  const rag = RAG_COLORS[score.status] ?? RAG_COLORS.grey;
                  return (
                    <button
                      key={score.domain}
                      onClick={() => selectDomain(score.domain)}
                      style={{ padding: '0.6rem', background: rag.bg, border: selectedDomain === score.domain ? '2px solid #4a6cf7' : '1px solid transparent', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: rag.color, display: 'block' }}>
                        {score.domain.replace(/-/g, ' ')}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: rag.color }}>{rag.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Domain Detail */}
          {selectedDomainData && (
            <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e', marginBottom: '0.75rem' }}>
                {selectedDomainData.domain.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ fontSize: '0.85rem' }}>Recommended Pattern:</strong>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#4a6cf7' }}>{selectedDomainData.recommendedPattern}</span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ fontSize: '0.85rem' }}>Rationale:</strong>
                <p style={{ fontSize: '0.85rem', color: '#333', margin: '0.3rem 0', lineHeight: 1.5 }}>{selectedDomainData.rationale}</p>
              </div>

              {/* Labels */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <LabelSection title="Facts" items={selectedDomainData.labels.facts} color="#065f46" bg="#d1fae5" />
                <LabelSection title="Assumptions" items={selectedDomainData.labels.assumptions} color="#92400e" bg="#fef3c7" />
                <LabelSection title="Recommendations" items={selectedDomainData.labels.recommendations} color="#1e40af" bg="#dbeafe" />
              </div>

              {/* Viable Options */}
              {selectedDomainData.viableOptions.length > 1 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ fontSize: '0.85rem' }}>Viable Options:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                    {selectedDomainData.viableOptions.map((opt: any, i: number) => (
                      <div key={i} style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '4px', fontSize: '0.8rem' }}>
                        <strong>{opt.name}</strong> (Score: {opt.suitabilityScore}/100)
                        <span style={{ display: 'block', color: '#666', marginTop: '0.2rem' }}>{opt.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks */}
              {selectedDomainData.risksAndAssumptions.length > 0 && (
                <div>
                  <strong style={{ fontSize: '0.85rem' }}>Risks & Assumptions:</strong>
                  <ul style={{ paddingLeft: '1rem', margin: '0.4rem 0' }}>
                    {selectedDomainData.risksAndAssumptions.map((r: any, i: number) => (
                      <li key={i} style={{ fontSize: '0.8rem', marginBottom: '0.3rem', color: r.severity === 'high' ? '#dc2626' : '#333' }}>
                        [{r.severity}] {r.description}{r.mitigation ? ` — ${r.mitigation}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Missing Information */}
          {assessment.missingInformation.length > 0 && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#92400e', marginBottom: '0.5rem' }}>⚠️ Missing Information</h3>
              {assessment.missingInformation.map((m: any, i: number) => (
                <p key={i} style={{ fontSize: '0.8rem', color: '#92400e', margin: '0.3rem 0' }}>
                  <strong>{m.domain}:</strong> {m.question}
                </p>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'patterns' && (
        <div style={{ padding: '1rem', color: '#666' }}>
          <p>Pattern Library — <button onClick={() => navigate('/design-lab/patterns')} style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer' }}>Open Pattern Browser</button></p>
        </div>
      )}

      {activeTab === 'standards' && (
        <div style={{ padding: '1rem', color: '#666' }}>
          <p>Standards Panel — <button onClick={() => navigate(`/design-lab/standards/${assessmentId}`)} style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer' }}>Open Standards Panel</button></p>
        </div>
      )}

      {activeTab === 'export' && (
        <div style={{ padding: '1rem', color: '#666' }}>
          <p>Export Panel — <button onClick={() => navigate(`/design-lab/export/${assessmentId}`)} style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer' }}>Open Export Panel</button></p>
        </div>
      )}

      {activeTab === 'learning' && selectedDomain && (
        <div style={{ padding: '1rem', color: '#666' }}>
          <p>Learning Mode for {selectedDomain} — <button onClick={() => navigate(`/design-lab/learning/${assessmentId}/${selectedDomain}`)} style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer' }}>Open Learning Mode</button></p>
        </div>
      )}
    </div>
  );
}

function LabelSection({ title, items, color, bg }: { title: string; items: string[]; color: string; bg: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ flex: 1, minWidth: '200px' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color, display: 'block', marginBottom: '0.3rem' }}>{title}</span>
      {items.slice(0, 3).map((item, i) => (
        <div key={i} style={{ padding: '0.2rem 0.4rem', background: bg, borderRadius: '3px', fontSize: '0.7rem', color, marginBottom: '0.2rem' }}>
          {item}
        </div>
      ))}
    </div>
  );
}
