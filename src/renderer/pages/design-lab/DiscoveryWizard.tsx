// Architecture Design Lab — Discovery Generator UI
// Implements: Requirements 1.1, 1.2, 1.3, 1.7, 1.8, 1.9

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DiscoveryWizard() {
  const [premise, setPremise] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleAnalyse() {
    if (premise.trim().length < 10) {
      setError('Please enter at least 10 characters describing your solution.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await (window as any).archlens.designLab.analyseDiscovery({ description: premise });
      if (result.success) {
        setOutput(result.data);
      } else {
        setError(result.error?.userMessage ?? 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to analyse premise');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!output) return;
    try {
      const result = await (window as any).archlens.designLab.exportDiscoveryPack(output);
      if (result.success) {
        await (window as any).archlens.designLab.copyToClipboard(result.data);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  }

  function handleProceedToIntake() {
    navigate('/design-lab/wizard/new');
  }

  async function handleRemoveRequirement(reqId: string) {
    if (!output) return;
    try {
      const result = await (window as any).archlens.designLab.removeDiscoveryRequirement(output.premiseId, reqId);
      if (result.success) setOutput(result.data);
    } catch (err) {
      console.error('Remove failed:', err);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/design-lab')}
        style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer', fontSize: '0.9rem', padding: '0.4rem 0', marginBottom: '1rem' }}
      >
        ← Back to Design Lab
      </button>

      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.5rem' }}>
        Discovery Requirements Generator
      </h1>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Describe your solution premise and receive structured requirements for a discovery session.
      </p>

      {/* Premise Input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#333' }}>
          Solution Premise
        </label>
        <textarea
          value={premise}
          onChange={(e) => setPremise(e.target.value)}
          placeholder="Describe the solution you're designing. For example: 'A citizen-facing service that allows people to apply for a licence online, integrating with existing back-office case management systems...'"
          rows={5}
          style={{ width: '100%', padding: '0.8rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      {error && (
        <div style={{ padding: '0.6rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleAnalyse}
        disabled={loading}
        style={{ padding: '0.7rem 1.2rem', background: loading ? '#94a3b8' : '#4a6cf7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '2rem' }}
      >
        {loading ? 'Analysing...' : 'Generate Requirements'}
      </button>

      {/* Output */}
      {output && (
        <div>
          {/* Functional Requirements */}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e', marginBottom: '0.75rem' }}>
            Functional Requirements ({output.functionalRequirements.length})
          </h2>
          {output.functionalRequirements.map((req: any) => (
            <RequirementCard key={req.id} req={req} onRemove={() => handleRemoveRequirement(req.id)} />
          ))}

          {/* Non-Functional Requirements */}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e', margin: '1.5rem 0 0.75rem' }}>
            Non-Functional Requirements ({output.nonFunctionalRequirements.length})
          </h2>
          {output.nonFunctionalRequirements.map((req: any) => (
            <RequirementCard key={req.id} req={req} onRemove={() => handleRemoveRequirement(req.id)} />
          ))}

          {/* Discovery Questions */}
          {output.discoveryQuestions.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e', margin: '1.5rem 0 0.75rem' }}>
                Discovery Questions
              </h2>
              <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                {output.discoveryQuestions.map((q: string, i: number) => (
                  <li key={i} style={{ marginBottom: '0.4rem', fontSize: '0.9rem', color: '#333' }}>{q}</li>
                ))}
              </ul>
            </>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <button onClick={handleExport} style={{ padding: '0.6rem 1rem', background: '#fff', color: '#4a6cf7', border: '1px solid #4a6cf7', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
              📋 Copy to Clipboard
            </button>
            <button onClick={handleProceedToIntake} style={{ padding: '0.6rem 1rem', background: '#4a6cf7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
              Proceed to Scenario Intake →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RequirementCard({ req, onRemove }: { req: any; onRemove: () => void }) {
  return (
    <div style={{ padding: '0.8rem 1rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ padding: '0.1rem 0.4rem', background: '#f1f5f9', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
              {req.category}
            </span>
            {req.isAmbiguous && (
              <span style={{ padding: '0.1rem 0.4rem', background: '#fef3c7', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 600, color: '#92400e' }}>
                ⚠️ Ambiguous
              </span>
            )}
          </div>
          <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#333', lineHeight: 1.5 }}>{req.description}</p>
          {req.ambiguityNote && (
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#92400e', fontStyle: 'italic' }}>{req.ambiguityNote}</p>
          )}
        </div>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem' }}>✕</button>
      </div>
    </div>
  );
}
