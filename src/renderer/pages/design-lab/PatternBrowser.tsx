// Architecture Design Lab — Pattern Library Browser UI
// Implements: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PatternBrowser() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPattern, setSelectedPattern] = useState<any>(null);
  const [filterProvider, setFilterProvider] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadPatterns(); }, []);

  async function loadPatterns() {
    try {
      const result = await (window as any).archlens.designLab.getAllPatterns();
      if (result.success) setPatterns(result.data);
    } catch (err) { console.error('Failed to load patterns:', err); }
    finally { setLoading(false); }
  }

  async function handleSearch() {
    try {
      const filter = filterProvider ? { cloudProvider: filterProvider } : undefined;
      const result = await (window as any).archlens.designLab.searchPatterns(searchQuery, filter);
      if (result.success) setPatterns(result.data.map((r: any) => r.pattern));
    } catch (err) { console.error('Search failed:', err); }
  }

  useEffect(() => { if (searchQuery || filterProvider) handleSearch(); else loadPatterns(); }, [searchQuery, filterProvider]);

  if (loading) return <div style={{ padding: '2rem', color: '#666' }}>Loading patterns...</div>;

  if (selectedPattern) {
    return (
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <button onClick={() => setSelectedPattern(null)} style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem' }}>← Back to Patterns</button>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.5rem' }}>{selectedPattern.name}</h1>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{selectedPattern.description}</p>

        <Section title="When to Use">{selectedPattern.whenToUse?.map((item: string, i: number) => <li key={i}>{item}</li>)}</Section>
        <Section title="When NOT to Use">{selectedPattern.whenNotToUse?.map((item: string, i: number) => <li key={i}>{item}</li>)}</Section>
        <Section title="Security Controls">{selectedPattern.securityControls?.map((item: string, i: number) => <li key={i}>{item}</li>)}</Section>
        <Section title="Resilience Considerations">{selectedPattern.resilienceConsiderations?.map((item: string, i: number) => <li key={i}>{item}</li>)}</Section>
        <Section title="Cost Considerations">{selectedPattern.costConsiderations?.map((item: string, i: number) => <li key={i}>{item}</li>)}</Section>
        <Section title="Common Mistakes">{selectedPattern.commonMistakes?.map((item: string, i: number) => <li key={i}>{item}</li>)}</Section>

        {selectedPattern.cloudServiceExamples?.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Cloud Service Examples</h3>
            {selectedPattern.cloudServiceExamples.map((ex: any, i: number) => (
              <div key={i} style={{ marginBottom: '0.75rem', padding: '0.6rem', background: '#f8fafc', borderRadius: '6px' }}>
                <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>{ex.platform}</strong>
                <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1rem' }}>
                  {ex.services?.map((s: any, j: number) => (
                    <li key={j} style={{ fontSize: '0.8rem' }}><strong>{s.name}</strong> — {s.purpose}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <button onClick={() => navigate('/design-lab')} style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem' }}>← Back to Design Lab</button>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '1rem' }}>Pattern Library</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search patterns..." style={{ flex: 1, padding: '0.6rem 1rem', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '0.9rem' }} />
        <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} style={{ padding: '0.6rem', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '0.85rem' }}>
          <option value="">All Providers</option>
          <option value="aws">AWS</option>
          <option value="azure">Azure</option>
          <option value="gcp">GCP</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {patterns.map((pattern) => (
          <button key={pattern.id} onClick={() => setSelectedPattern(pattern)} style={{ padding: '1rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4a6cf7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a2e', display: 'block', marginBottom: '0.3rem' }}>{pattern.name}</span>
            <span style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.4 }}>{pattern.description?.slice(0, 100)}...</span>
          </button>
        ))}
      </div>

      {patterns.length === 0 && <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>No patterns match your search</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1a1a2e', marginBottom: '0.4rem' }}>{title}</h3>
      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: 1.6 }}>{children}</ul>
    </div>
  );
}
