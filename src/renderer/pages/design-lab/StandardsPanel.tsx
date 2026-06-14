// Architecture Design Lab — Standards Alignment Panel UI
// Implements: Requirements 9.1, 9.2, 9.3, 9.4

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function StandardsPanel() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [standards, setStandards] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (assessmentId) loadData(); }, [assessmentId]);

  async function loadData() {
    try {
      const [stdResult, statusResult] = await Promise.all([
        (window as any).archlens.designLab.getApplicableStandards(assessmentId),
        (window as any).archlens.designLab.getStandardReviewStatuses(assessmentId),
      ]);
      if (stdResult.success) setStandards(stdResult.data);
      if (statusResult.success) setStatuses(statusResult.data);
    } catch (err) { console.error('Failed to load standards:', err); }
    finally { setLoading(false); }
  }

  async function handleStatusChange(standardId: string, status: string, note?: string) {
    try {
      await (window as any).archlens.designLab.setStandardReviewStatus(assessmentId, standardId, status, note);
      setStatuses((prev) => {
        const existing = prev.findIndex((s) => s.standardId === standardId);
        const updated = { standardId, assessmentId, status, note };
        if (existing >= 0) { const copy = [...prev]; copy[existing] = updated; return copy; }
        return [...prev, updated];
      });
    } catch (err) { console.error('Failed to update status:', err); }
  }

  if (loading) return <div style={{ padding: '2rem', color: '#666' }}>Loading standards...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate(`/design-lab/assessment/${assessmentId}`)} style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem' }}>← Back to Assessment</button>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.5rem' }}>Standards Alignment</h1>
      <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Review applicable standards and mark their status.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {standards.map((standard) => {
          const currentStatus = statuses.find((s) => s.standardId === standard.id);
          return (
            <div key={standard.id} style={{ padding: '0.8rem 1rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#1a1a2e' }}>{standard.name}</span>
                  <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.2rem 0' }}>{standard.description}</p>
                  <span style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>{standard.category}</span>
                </div>
                <select
                  value={currentStatus?.status ?? 'not-reviewed'}
                  onChange={(e) => handleStatusChange(standard.id, e.target.value)}
                  style={{ padding: '0.3rem 0.5rem', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.8rem' }}
                >
                  <option value="not-reviewed">Not Reviewed</option>
                  <option value="reviewed">Reviewed ✓</option>
                  <option value="not-applicable">Not Applicable</option>
                  <option value="action-required">Action Required ⚠️</option>
                </select>
              </div>
              {currentStatus?.status === 'action-required' && (
                <input
                  type="text"
                  placeholder="Describe the outstanding action..."
                  defaultValue={currentStatus?.note ?? ''}
                  onBlur={(e) => handleStatusChange(standard.id, 'action-required', e.target.value)}
                  style={{ width: '100%', marginTop: '0.5rem', padding: '0.4rem', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '0.8rem', background: '#fef3c7' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {standards.length === 0 && <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>No applicable standards found for this assessment.</p>}
    </div>
  );
}
