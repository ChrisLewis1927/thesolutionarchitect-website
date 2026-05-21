// ArchLens — Career Growth page
// Implemented in Task 18.1

import { useState, useEffect, useCallback } from 'react';

interface Certification {
  id: string;
  name: string;
  provider: string;
  dateEarned: string;
  expiryDate?: string;
}

type DDATLevel = 'awareness' | 'working' | 'practitioner' | 'expert';

interface Recommendation {
  type: 'certification' | 'course' | 'learning-path';
  title: string;
  provider: string;
  url?: string;
  relevantCapability: string;
}

interface SkillGap {
  capability: string;
  currentLevel: DDATLevel;
  targetLevel: DDATLevel;
  recommendations: Recommendation[];
}

interface CapabilityCoverage {
  capabilities: Array<{
    name: string;
    currentLevel: DDATLevel;
    targetLevel: DDATLevel;
    coveragePercent: number;
  }>;
  overallCoveragePercent: number;
}

const LEVEL_ORDER: DDATLevel[] = ['awareness', 'working', 'practitioner', 'expert'];
const LEVEL_COLORS: Record<DDATLevel, { bg: string; text: string }> = {
  awareness: { bg: '#fef2f2', text: '#dc2626' },
  working: { bg: '#fffbeb', text: '#d97706' },
  practitioner: { bg: '#f0f4ff', text: '#4a6cf7' },
  expert: { bg: '#ecfdf5', text: '#059669' },
};

type Tab = 'certifications' | 'gaps' | 'recommendations' | 'coverage';

export default function Career() {
  const [tab, setTab] = useState<Tab>('certifications');
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [coverage, setCoverage] = useState<CapabilityCoverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetRole] = useState('lead-solution-architect');

  // Form state
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCertifications = useCallback(async () => {
    try {
      const result = await window.archlens.career.getCertifications();
      const data = (result?.data ?? result) as Certification[];
      setCertifications(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load certifications.');
    }
  }, []);

  const loadGaps = useCallback(async () => {
    try {
      const result = await window.archlens.career.analyseGaps(targetRole);
      const data = (result?.data ?? result) as SkillGap[];
      setGaps(Array.isArray(data) ? data : []);
    } catch { /* best-effort */ }
  }, [targetRole]);

  const loadRecommendations = useCallback(async () => {
    try {
      const result = await window.archlens.career.getRecommendations(targetRole);
      const data = (result?.data ?? result) as Recommendation[];
      setRecommendations(Array.isArray(data) ? data : []);
    } catch { /* best-effort */ }
  }, [targetRole]);

  const loadCoverage = useCallback(async () => {
    try {
      const result = await window.archlens.career.getCoverage(targetRole);
      const data = (result?.data ?? result) as CapabilityCoverage;
      setCoverage(data);
    } catch { /* best-effort */ }
  }, [targetRole]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCertifications(), loadGaps(), loadRecommendations(), loadCoverage()])
      .finally(() => setLoading(false));
  }, [loadCertifications, loadGaps, loadRecommendations, loadCoverage]);

  const handleAddCert = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formProvider.trim() || !formDate) return;
    setSubmitting(true);
    setError(null);
    try {
      const cert = {
        name: formName.trim(),
        provider: formProvider.trim(),
        dateEarned: formDate,
        expiryDate: formExpiry || undefined,
      };
      await window.archlens.career.addCertification(cert);
      setFormName('');
      setFormProvider('');
      setFormDate('');
      setFormExpiry('');
      // Refresh all data
      await Promise.all([loadCertifications(), loadGaps(), loadRecommendations(), loadCoverage()]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add certification.');
    } finally {
      setSubmitting(false);
    }
  }, [formName, formProvider, formDate, formExpiry, loadCertifications, loadGaps, loadRecommendations, loadCoverage]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'certifications', label: 'Certifications' },
    { key: 'gaps', label: 'Gap Analysis' },
    { key: 'recommendations', label: 'Recommendations' },
    { key: 'coverage', label: 'Coverage' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a2e', margin: '0 0 0.25rem' }}>Career Growth</h2>
      <p style={{ color: '#666', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
        Track certifications and get DDAT-aligned career recommendations
      </p>

      {error && (
        <div role="alert" style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div role="tablist" aria-label="Career sections" style={{ display: 'flex', gap: '0', marginBottom: '1.25rem', background: '#e5e7eb', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            style={{ padding: '0.5rem 1.25rem', background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#1a1a2e' : '#666', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: tab === t.key ? 600 : 400, boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}><p>Loading…</p></div>}

      {/* Certifications tab */}
      {!loading && tab === 'certifications' && (
        <div>
          {/* Add certification form */}
          <form onSubmit={handleAddCert} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>Add Certification</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#444', marginBottom: '0.25rem' }}>Name *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required
                  placeholder="e.g. AWS Solutions Architect Professional"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#444', marginBottom: '0.25rem' }}>Provider *</label>
                <input type="text" value={formProvider} onChange={(e) => setFormProvider(e.target.value)} required
                  placeholder="e.g. AWS"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#444', marginBottom: '0.25rem' }}>Date Earned *</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#444', marginBottom: '0.25rem' }}>Expiry Date</label>
                <input type="date" value={formExpiry} onChange={(e) => setFormExpiry(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button type="submit" disabled={submitting}
              style={{ marginTop: '0.75rem', padding: '0.5rem 1.25rem', background: submitting ? '#a0a0a0' : '#4a6cf7', color: '#fff', border: 'none', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              {submitting ? 'Adding…' : 'Add Certification'}
            </button>
          </form>

          {/* Certification list */}
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {certifications.map((cert) => (
              <div key={cert.id} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' }}>{cert.name}</span>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.15rem', fontSize: '0.8rem', color: '#999' }}>
                    <span>{cert.provider}</span>
                    <span>·</span>
                    <span>Earned {typeof cert.dateEarned === 'string' ? cert.dateEarned : new Date(cert.dateEarned).toLocaleDateString()}</span>
                    {cert.expiryDate && <><span>·</span><span>Expires {typeof cert.expiryDate === 'string' ? cert.expiryDate : new Date(cert.expiryDate).toLocaleDateString()}</span></>}
                  </div>
                </div>
              </div>
            ))}
            {certifications.length === 0 && <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No certifications added yet.</p>}
          </div>
        </div>
      )}

      {/* Gap Analysis tab */}
      {!loading && tab === 'gaps' && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {gaps.map((gap, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem 1.25rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 600, color: '#1a1a2e' }}>{gap.capability}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <LevelBadge level={gap.currentLevel} label="Current" />
                <span style={{ color: '#999' }}>→</span>
                <LevelBadge level={gap.targetLevel} label="Target" />
              </div>
              {gap.recommendations.length > 0 && (
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                  {gap.recommendations.map((rec, j) => (
                    <li key={j} style={{ color: '#444', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.15rem' }}>
                      {rec.title} ({rec.provider})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {gaps.length === 0 && <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No skill gaps identified. Add certifications to see your gap analysis.</p>}
        </div>
      )}

      {/* Recommendations tab */}
      {!loading && tab === 'recommendations' && (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {recommendations.map((rec, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem', flex: 1 }}>{rec.title}</span>
                <span style={{ padding: '0.15rem 0.5rem', background: '#f0f4ff', color: '#4a6cf7', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500, textTransform: 'capitalize' }}>{rec.type.replace(/-/g, ' ')}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.8rem', color: '#999' }}>
                <span>{rec.provider}</span>
                <span>·</span>
                <span>{rec.relevantCapability}</span>
              </div>
            </div>
          ))}
          {recommendations.length === 0 && <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No recommendations available. Add certifications to get personalised suggestions.</p>}
        </div>
      )}

      {/* Coverage tab */}
      {!loading && tab === 'coverage' && coverage && (
        <CoverageView coverage={coverage} />
      )}
      {!loading && tab === 'coverage' && !coverage && (
        <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Coverage data not available.</p>
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LevelBadge({ level, label }: { level: DDATLevel; label: string }) {
  const colors = LEVEL_COLORS[level] ?? { bg: '#f3f4f6', text: '#6b7280' };
  return (
    <span style={{ padding: '0.15rem 0.5rem', background: colors.bg, color: colors.text, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
      {label}: {level}
    </span>
  );
}

function CoverageView({ coverage }: { coverage: CapabilityCoverage }) {
  return (
    <div>
      {/* Overall coverage */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem', textAlign: 'center' }}>
        <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#1a1a2e', fontSize: '1rem' }}>Overall Capability Coverage</p>
        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#4a6cf7" strokeWidth="3"
              strokeDasharray={`${coverage.overallCoveragePercent} ${100 - coverage.overallCoveragePercent}`}
              strokeLinecap="round" />
          </svg>
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 700, fontSize: '1.1rem', color: '#1a1a2e' }}>
            {Math.round(coverage.overallCoveragePercent)}%
          </span>
        </div>
      </div>

      {/* Per-capability bars */}
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {coverage.capabilities.map((cap, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.85rem' }}>{cap.name}</span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <LevelBadge level={cap.currentLevel} label="Now" />
                <LevelBadge level={cap.targetLevel} label="Target" />
              </div>
            </div>
            <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.max(0, cap.coveragePercent))}%`,
                height: '100%',
                background: cap.coveragePercent >= 80 ? '#22c55e' : cap.coveragePercent >= 50 ? '#f59e0b' : '#ef4444',
                borderRadius: '4px',
                transition: 'width 0.3s',
              }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.15rem', display: 'block' }}>
              {Math.round(cap.coveragePercent)}% coverage
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
