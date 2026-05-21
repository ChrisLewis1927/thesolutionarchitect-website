// ArchLens — AI Guardrails page
// Implemented in Task 18.3

import { useState, useEffect, useCallback } from 'react';

interface GuardrailsTopic {
  id: string;
  title: string;
  category: 'governance' | 'security' | 'data-protection';
  content: string;
  lastUpdated: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  governance: 'AI Governance',
  security: 'Security',
  'data-protection': 'Data Protection',
};

const CATEGORY_ICONS: Record<string, string> = {
  governance: '🏛️',
  security: '🔒',
  'data-protection': '🛡️',
};

const CATEGORY_ORDER = ['governance', 'security', 'data-protection'];

export default function Guardrails() {
  const [topics, setTopics] = useState<GuardrailsTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<GuardrailsTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTopic, setLoadingTopic] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.archlens.guardrails.getTopics();
        const data = (result?.data ?? result) as GuardrailsTopic[];
        setTopics(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load topics.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelectTopic = useCallback(async (topicId: string) => {
    setLoadingTopic(true);
    setError(null);
    try {
      const result = await window.archlens.guardrails.getTopic(topicId);
      const data = (result?.data ?? result) as GuardrailsTopic;
      setSelectedTopic(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load topic.');
    } finally {
      setLoadingTopic(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setSelectedTopic(null);
  }, []);

  // Group topics by category
  const grouped = CATEGORY_ORDER.reduce<Record<string, GuardrailsTopic[]>>((acc, cat) => {
    acc[cat] = topics.filter((t) => t.category === cat);
    return acc;
  }, {});

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        {selectedTopic && (
          <button onClick={handleBack} aria-label="Go back to topics"
            style={{ padding: '0.3rem 0.6rem', background: 'transparent', color: '#4a6cf7', border: 'none', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>
            ← Back
          </button>
        )}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a2e', margin: '0 0 0.25rem' }}>
          AI Guardrails
        </h2>
        <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
          {selectedTopic ? selectedTopic.title : 'AI governance, security, and data protection guidance'}
        </p>
      </div>

      {error && (
        <div role="alert" style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {(loading || loadingTopic) && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}><p>Loading…</p></div>
      )}

      {/* Topic list grouped by category */}
      {!loading && !loadingTopic && !selectedTopic && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {CATEGORY_ORDER.map((cat) => {
            const catTopics = grouped[cat] ?? [];
            if (catTopics.length === 0) return null;
            return (
              <div key={cat}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{CATEGORY_ICONS[cat] ?? '📄'}</span>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>
                    {CATEGORY_LABELS[cat] ?? cat}
                  </h3>
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {catTopics.map((topic) => (
                    <button key={topic.id} onClick={() => handleSelectTopic(topic.id)}
                      aria-label={`Read topic: ${topic.title}`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', textAlign: 'left', padding: '0.75rem 1rem',
                        background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px',
                        cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#4a6cf7'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
                    >
                      <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' }}>{topic.title}</span>
                      <span style={{ fontSize: '0.75rem', color: '#999', flexShrink: 0 }}>
                        Updated {formatDate(topic.lastUpdated)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {topics.length === 0 && (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No guardrails content available yet.</p>
          )}
        </div>
      )}

      {/* Topic content (rendered from Markdown) */}
      {!loadingTopic && selectedTopic && (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ padding: '0.15rem 0.5rem', background: '#f0f4ff', color: '#4a6cf7', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
              {CATEGORY_LABELS[selectedTopic.category] ?? selectedTopic.category}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#999' }}>
              Updated {formatDate(selectedTopic.lastUpdated)}
            </span>
          </div>
          <MarkdownContent content={selectedTopic.content} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Simple Markdown renderer
// ---------------------------------------------------------------------------

function MarkdownContent({ content }: { content: string }) {
  // Basic Markdown-to-HTML conversion for headings, bold, lists, paragraphs
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ color: '#444', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.2rem' }}>
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ul>,
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trimEnd();

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h4 key={key++} style={{ margin: '1rem 0 0.35rem', fontSize: '0.95rem', fontWeight: 600, color: '#1a1a2e' }}><InlineMarkdown text={trimmed.slice(4)} /></h4>);
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={key++} style={{ margin: '1.25rem 0 0.5rem', fontSize: '1.05rem', fontWeight: 600, color: '#1a1a2e' }}><InlineMarkdown text={trimmed.slice(3)} /></h3>);
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(<h2 key={key++} style={{ margin: '1.25rem 0 0.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#1a1a2e' }}><InlineMarkdown text={trimmed.slice(2)} /></h2>);
    } else if (/^[-*] /.test(trimmed)) {
      listItems.push(trimmed.slice(2));
    } else if (trimmed === '') {
      flushList();
    } else {
      flushList();
      elements.push(<p key={key++} style={{ margin: '0.35rem 0', color: '#444', fontSize: '0.9rem', lineHeight: 1.7 }}><InlineMarkdown text={trimmed} /></p>);
    }
  }
  flushList();

  return <div>{elements}</div>;
}

function InlineMarkdown({ text }: { text: string }) {
  // Handle **bold** and *italic*
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }

  return <>{parts}</>;
}
