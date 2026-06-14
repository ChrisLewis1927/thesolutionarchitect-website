// Architecture Design Lab — Export Panel UI
// Implements: Requirements 10.1, 10.2, 10.5

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const OUTPUT_TYPES = [
  { id: 'architecture-decision-summary', label: 'Architecture Decision Summary', icon: '📋' },
  { id: 'hld-section', label: 'HLD Section', icon: '📐' },
  { id: 'adr-draft', label: 'ADR Draft', icon: '📝' },
  { id: 'governance-briefing', label: 'Governance Board Briefing', icon: '🏛️' },
  { id: 'risk-assumption-log', label: 'Risk & Assumption Log', icon: '⚠️' },
  { id: 'pattern-comparison', label: 'Pattern Comparison Table', icon: '📊' },
  { id: 'stakeholder-questions', label: 'Stakeholder Questions', icon: '❓' },
];

export default function ExportPanel() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate(type: string) {
    if (!assessmentId) return;
    setLoading(true);
    setSelectedType(type);
    setCopied(false);
    try {
      const result = await (window as any).archlens.designLab.generateOutput(assessmentId, type);
      if (result.success) setOutput(result.data);
    } catch (err) { console.error('Generate failed:', err); }
    finally { setLoading(false); }
  }

  async function handleCopy() {
    if (!output) return;
    try {
      await (window as any).archlens.designLab.copyToClipboard(output.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { console.error('Copy failed:', err); }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <button onClick={() => navigate(`/design-lab/assessment/${assessmentId}`)} style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem' }}>← Back to Assessment</button>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '1rem' }}>Export Documents</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {OUTPUT_TYPES.map((type) => (
          <button key={type.id} onClick={() => handleGenerate(type.id)}
            style={{ padding: '0.8rem', background: selectedType === type.id ? '#e8f0fe' : '#fff', border: `1px solid ${selectedType === type.id ? '#4a6cf7' : '#e0e0e0'}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}>
            <span style={{ display: 'block', marginBottom: '0.2rem' }}>{type.icon}</span>
            <span style={{ fontWeight: 500 }}>{type.label}</span>
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#666' }}>Generating...</p>}

      {output && !loading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>{output.title}</h2>
            <button onClick={handleCopy} style={{ padding: '0.4rem 0.8rem', background: copied ? '#d1fae5' : '#4a6cf7', color: copied ? '#065f46' : '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
          <pre style={{ padding: '1rem', background: '#1e293b', color: '#e2e8f0', borderRadius: '8px', fontSize: '0.8rem', overflow: 'auto', maxHeight: '500px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {output.content}
          </pre>
        </div>
      )}
    </div>
  );
}
