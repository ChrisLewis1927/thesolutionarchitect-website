// ArchLens — Daily Articles page
// Implemented in Task 17.1

import { useState, useEffect, useCallback } from 'react';

interface Article {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedDate: string;
  summary: string;
  category: string;
}

interface ArticlesResponse {
  articles: Article[];
  stale?: boolean;
  lastUpdated?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  architecture: { bg: '#f0f4ff', text: '#4a6cf7' },
  cloud: { bg: '#ecfdf5', text: '#059669' },
  cybersecurity: { bg: '#fef2f2', text: '#dc2626' },
  'government-digital': { bg: '#faf5ff', text: '#7c3aed' },
  'enterprise-tech': { bg: '#fffbeb', text: '#d97706' },
};

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchArticles = useCallback(async () => {
    try {
      const result = await window.archlens.articles.getDaily();
      const data = (result?.data ?? result) as ArticlesResponse | Article[];

      if (Array.isArray(data)) {
        setArticles(data);
        setStale(false);
        setLastUpdated(null);
      } else {
        setArticles(data.articles ?? []);
        setStale(data.stale ?? false);
        setLastUpdated(data.lastUpdated ?? null);
      }
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load articles. Please check your connection.',
      );
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchArticles().finally(() => setLoading(false));
  }, [fetchArticles]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await window.archlens.articles.refresh();
      const data = (result?.data ?? result) as ArticlesResponse | Article[];

      if (Array.isArray(data)) {
        setArticles(data);
        setStale(false);
      } else {
        setArticles(data.articles ?? []);
        setStale(data.stale ?? false);
        setLastUpdated(data.lastUpdated ?? null);
      }
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Refresh failed. Showing cached articles.',
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleOpenArticle = useCallback((url: string) => {
    window.archlens.articles.openInBrowser(url);
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>
          Daily Articles
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh articles"
          style={{
            padding: '0.5rem 1rem',
            background: refreshing ? '#a0a0a0' : '#f0f4ff',
            color: refreshing ? '#fff' : '#4a6cf7',
            border: '1px solid #4a6cf7',
            borderRadius: '6px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <p style={{ color: '#666', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
        Curated articles on architecture, cloud, security, and government digital
      </p>

      {/* Staleness banner */}
      {stale && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: '6px',
            color: '#92400e',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          ⚠️ Articles may not be current
          {lastUpdated ? ` — last updated ${formatDate(lastUpdated)}` : ''}.
          Click Refresh to fetch the latest.
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            color: '#b91c1c',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <p>Loading articles…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && articles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📰</span>
          <p style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>No articles available</p>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>
            Click Refresh to fetch the latest articles
          </p>
        </div>
      )}

      {/* Article list */}
      {!loading && articles.length > 0 && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {articles.map((article) => {
            const catColors = CATEGORY_COLORS[article.category] ?? { bg: '#f3f4f6', text: '#6b7280' };
            return (
              <button
                key={article.id}
                onClick={() => handleOpenArticle(article.url)}
                aria-label={`Open article: ${article.title}`}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '1rem 1.25rem',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#4a6cf7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.95rem', flex: 1 }}>
                    {article.title}
                  </span>
                  <span
                    style={{
                      padding: '0.15rem 0.5rem',
                      background: catColors.bg,
                      color: catColors.text,
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {article.category.replace(/-/g, ' ')}
                  </span>
                </div>
                <p style={{ margin: '0 0 0.5rem', color: '#666', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {article.summary}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: '#999' }}>
                  <span>{article.source}</span>
                  <span>·</span>
                  <span>{formatDate(article.publishedDate)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
