// ArchLens — Progress Dashboard page
// Implemented in Task 18.2

import { useState, useEffect, useCallback } from 'react';

interface ProgressSummary {
  totalModulesCompleted: number;
  totalCertificationsEarned: number;
  totalArticlesRead: number;
  completionRates: Record<string, number>;
  diagramModulesCompleted: number;
}

interface TimelineEntry {
  date: string;
  type: 'module' | 'certification' | 'article' | 'journal' | 'diagram-module';
  title: string;
  category?: string;
}

interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
  tags: string[];
}

type Period = 'weekly' | 'monthly' | 'quarterly';

const TYPE_ICONS: Record<string, string> = {
  module: '📚',
  certification: '🎓',
  article: '📰',
  journal: '📝',
  'diagram-module': '📐',
};

export default function Progress() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [period, setPeriod] = useState<Period>('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Journal form
  const [journalContent, setJournalContent] = useState('');
  const [journalTagInput, setJournalTagInput] = useState('');
  const [journalTags, setJournalTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Journal filter
  const [filterTag, setFilterTag] = useState('');

  // Export
  const [exporting, setExporting] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const result = await window.archlens.progress.getSummary();
      const data = (result?.data ?? result) as ProgressSummary;
      setSummary(data);
    } catch { /* best-effort */ }
  }, []);

  const loadTimeline = useCallback(async (p: Period) => {
    try {
      const result = await window.archlens.progress.getTimeline(p);
      const data = (result?.data ?? result) as TimelineEntry[];
      setTimeline(Array.isArray(data) ? data : []);
    } catch { /* best-effort */ }
  }, []);

  const loadJournals = useCallback(async (tag?: string) => {
    try {
      const filter = tag ? { tags: [tag] } : undefined;
      const result = await window.archlens.progress.getJournalEntries(filter);
      const data = (result?.data ?? result) as JournalEntry[];
      setJournals(Array.isArray(data) ? data : []);
    } catch { /* best-effort */ }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSummary(), loadTimeline(period), loadJournals()])
      .finally(() => setLoading(false));
  }, [loadSummary, loadTimeline, loadJournals, period]);

  const handlePeriodChange = useCallback((p: Period) => {
    setPeriod(p);
    loadTimeline(p);
  }, [loadTimeline]);

  const handleAddTag = useCallback(() => {
    const tag = journalTagInput.trim();
    if (tag && !journalTags.includes(tag)) {
      setJournalTags((prev) => [...prev, tag]);
    }
    setJournalTagInput('');
  }, [journalTagInput, journalTags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setJournalTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  const handleSubmitJournal = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await window.archlens.progress.addJournal(journalContent.trim(), journalTags);
      setJournalContent('');
      setJournalTags([]);
      setJournalTagInput('');
      await loadJournals(filterTag || undefined);
      await loadSummary();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save journal entry.');
    } finally {
      setSubmitting(false);
    }
  }, [journalContent, journalTags, loadJournals, loadSummary, filterTag]);

  const handleFilterJournals = useCallback(() => {
    loadJournals(filterTag.trim() || undefined);
  }, [filterTag, loadJournals]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await window.archlens.progress.exportReport(period);
    } catch { /* best-effort */ }
    finally { setExporting(false); }
  }, [period]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>Progress & Journal</h2>
        <button onClick={handleExport} disabled={exporting} aria-label="Export progress report"
          style={{ padding: '0.5rem 1rem', background: exporting ? '#a0a0a0' : '#f0f4ff', color: exporting ? '#fff' : '#4a6cf7', border: '1px solid #4a6cf7', borderRadius: '6px', cursor: exporting ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
          {exporting ? 'Exporting…' : 'Export Report'}
        </button>
      </div>
      <p style={{ color: '#666', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
        Track your learning progress and maintain a development journal
      </p>

      {error && (
        <div role="alert" style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}><p>Loading…</p></div>}

      {!loading && (
        <>
          {/* Summary cards */}
          {summary && <SummaryCards summary={summary} />}

          {/* Completion rates */}
          {summary && Object.keys(summary.completionRates).length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>Completion Rates by Category</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {Object.entries(summary.completionRates).map(([cat, rate]) => (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#444' }}>{cat.replace(/-/g, ' ')}</span>
                      <span style={{ fontSize: '0.85rem', color: '#999' }}>{Math.round(rate)}%</span>
                    </div>
                    <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, Math.max(0, rate))}%`, height: '100%', background: '#4a6cf7', borderRadius: '4px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>Activity Timeline</h3>
              <div role="tablist" aria-label="Timeline period" style={{ display: 'flex', background: '#e5e7eb', borderRadius: '6px', padding: '2px' }}>
                {(['weekly', 'monthly', 'quarterly'] as const).map((p) => (
                  <button key={p} role="tab" aria-selected={period === p} onClick={() => handlePeriodChange(p)}
                    style={{ padding: '0.3rem 0.75rem', background: period === p ? '#fff' : 'transparent', color: period === p ? '#1a1a2e' : '#666', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: period === p ? 600 : 400, textTransform: 'capitalize' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {timeline.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                {timeline.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < timeline.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <span style={{ fontSize: '1rem' }}>{TYPE_ICONS[entry.type] ?? '📌'}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.85rem', color: '#1a1a2e' }}>{entry.title}</span>
                      {entry.category && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#999' }}>{entry.category}</span>}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#999', flexShrink: 0 }}>{formatDate(entry.date)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: '1rem', fontSize: '0.9rem' }}>No activity in this period.</p>
            )}
          </div>

          {/* Journal section */}
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>Development Journal</h3>
            <form onSubmit={handleSubmitJournal}>
              <textarea value={journalContent} onChange={(e) => setJournalContent(e.target.value)}
                placeholder="Write a journal entry about your learning or development…"
                aria-label="Journal entry content" rows={3}
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', marginBottom: '0.5rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                {journalTags.map((tag) => (
                  <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', background: '#f0f4ff', color: '#4a6cf7', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} aria-label={`Remove tag ${tag}`}
                      style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer', fontSize: '0.85rem', padding: '0 0.15rem' }}>×</button>
                  </span>
                ))}
                <input type="text" value={journalTagInput} onChange={(e) => setJournalTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown} onBlur={handleAddTag}
                  placeholder="Add tag…" aria-label="Add tag"
                  style={{ padding: '0.3rem 0.5rem', border: '1px solid #d0d0d0', borderRadius: '4px', fontSize: '0.8rem', width: '100px' }} />
              </div>
              <button type="submit" disabled={submitting || !journalContent.trim()}
                style={{ padding: '0.5rem 1.25rem', background: submitting || !journalContent.trim() ? '#a0a0a0' : '#4a6cf7', color: '#fff', border: 'none', borderRadius: '6px', cursor: submitting || !journalContent.trim() ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                {submitting ? 'Saving…' : 'Save Entry'}
              </button>
            </form>
          </div>

          {/* Journal entries with filter */}
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>Journal Entries</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="text" value={filterTag} onChange={(e) => setFilterTag(e.target.value)}
                  placeholder="Filter by tag…" aria-label="Filter journal entries by tag"
                  style={{ padding: '0.3rem 0.5rem', border: '1px solid #d0d0d0', borderRadius: '4px', fontSize: '0.8rem', width: '120px' }} />
                <button onClick={handleFilterJournals} aria-label="Apply filter"
                  style={{ padding: '0.3rem 0.6rem', background: '#f0f4ff', color: '#4a6cf7', border: '1px solid #4a6cf7', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Filter
                </button>
              </div>
            </div>
            {journals.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {journals.map((entry) => (
                  <div key={entry.id} style={{ padding: '0.75rem', background: '#fafafa', borderRadius: '6px', border: '1px solid #f0f0f0' }}>
                    <p style={{ margin: '0 0 0.35rem', color: '#444', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{entry.content}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: '#999' }}>{formatDate(entry.createdAt)}</span>
                      {entry.tags.map((tag) => (
                        <span key={tag} style={{ padding: '0.1rem 0.4rem', background: '#f0f4ff', color: '#4a6cf7', borderRadius: '3px', fontSize: '0.7rem' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: '1rem', fontSize: '0.9rem' }}>No journal entries yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Summary cards sub-component
// ---------------------------------------------------------------------------

function SummaryCards({ summary }: { summary: ProgressSummary }) {
  const cards = [
    { label: 'Modules Completed', value: summary.totalModulesCompleted, icon: '📚' },
    { label: 'Certifications', value: summary.totalCertificationsEarned, icon: '🎓' },
    { label: 'Articles Read', value: summary.totalArticlesRead, icon: '📰' },
    { label: 'Diagram Modules', value: summary.diagramModulesCompleted, icon: '📐' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
      {cards.map((card) => (
        <div key={card.label} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem' }}>{card.icon}</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', display: 'block' }}>{card.value}</span>
          <span style={{ fontSize: '0.8rem', color: '#999' }}>{card.label}</span>
        </div>
      ))}
    </div>
  );
}
