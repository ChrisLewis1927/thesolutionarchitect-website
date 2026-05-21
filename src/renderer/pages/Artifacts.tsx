// ArchLens — Artifacts Reference Page
// Comprehensive compendium of architecture and project artifacts

import { useState, useEffect, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types (mirrored from service)
// ---------------------------------------------------------------------------

type ArtifactCategory =
  | 'architecture'
  | 'project-management'
  | 'governance'
  | 'delivery'
  | 'security'
  | 'data'
  | 'service-design'
  | 'operations'
  | 'commercial';

type ProjectPhase =
  | 'discovery'
  | 'alpha'
  | 'beta'
  | 'live'
  | 'retirement'
  | 'pre-discovery'
  | 'throughout';

interface TemplateSection {
  heading: string;
  guidance: string;
  placeholder: string;
}

interface Artifact {
  id: string;
  name: string;
  category: ArtifactCategory;
  subcategory: string;
  description: string;
  purpose: string;
  whenToUse: string;
  projectPhase: ProjectPhase[];
  frameworks: string[];
  audience: string[];
  howToBuild: string;
  tips: string[];
  commonMistakes: string[];
  governmentContext: string;
  relatedArtifacts: string[];
  templateSections: TemplateSection[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<ArtifactCategory, { label: string; color: string; bg: string }> = {
  architecture: { label: 'Architecture', color: '#1a56db', bg: '#e8f0fe' },
  'project-management': { label: 'Project Management', color: '#7c3aed', bg: '#f3e8ff' },
  governance: { label: 'Governance', color: '#b45309', bg: '#fef3c7' },
  delivery: { label: 'Delivery', color: '#047857', bg: '#d1fae5' },
  security: { label: 'Security', color: '#dc2626', bg: '#fee2e2' },
  data: { label: 'Data', color: '#0891b2', bg: '#cffafe' },
  'service-design': { label: 'Service Design', color: '#c026d3', bg: '#fae8ff' },
  operations: { label: 'Operations', color: '#475569', bg: '#f1f5f9' },
  commercial: { label: 'Commercial', color: '#ea580c', bg: '#fff7ed' },
};

const PHASE_CONFIG: Record<ProjectPhase, { label: string; color: string }> = {
  'pre-discovery': { label: 'Pre-Discovery', color: '#6b7280' },
  discovery: { label: 'Discovery', color: '#2563eb' },
  alpha: { label: 'Alpha', color: '#7c3aed' },
  beta: { label: 'Beta', color: '#ea580c' },
  live: { label: 'Live', color: '#16a34a' },
  retirement: { label: 'Retirement', color: '#991b1b' },
  throughout: { label: 'Throughout', color: '#374151' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Artifacts() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ArtifactCategory | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [generating, setGenerating] = useState(false);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load artifacts on mount
  useEffect(() => {
    loadArtifacts();
  }, []);

  async function loadArtifacts() {
    try {
      const result = await (window as any).archlens.artifacts.getAll();
      if (result.success) {
        setArtifacts(result.data);
      }
    } catch (err) {
      console.error('Failed to load artifacts:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filter artifacts
  const filteredArtifacts = useMemo(() => {
    let filtered = artifacts;

    if (selectedCategory) {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    if (selectedPhase) {
      filtered = filtered.filter((a) => a.projectPhase.includes(selectedPhase));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.subcategory.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [artifacts, selectedCategory, selectedPhase, searchQuery]);

  async function handleGenerateTemplate(artifactId: string) {
    setGenerating(true);
    try {
      const result = await (window as any).archlens.artifacts.downloadTemplate(artifactId);
      if (result.success && result.data.saved) {
        // File saved and folder opened by main process
      }
    } catch (err) {
      console.error('Failed to download template:', err);
    } finally {
      setGenerating(false);
    }
  }

  async function handlePreviewTemplate(artifactId: string) {
    if (showPreview && templatePreview) {
      setShowPreview(false);
      return;
    }
    try {
      const result = await (window as any).archlens.artifacts.generateTemplate(artifactId);
      if (result.success) {
        setTemplatePreview(result.data);
        setShowPreview(true);
      }
    } catch (err) {
      console.error('Failed to preview template:', err);
    }
  }

  function handleRelatedClick(relatedId: string) {
    const related = artifacts.find((a) => a.id === relatedId);
    if (related) {
      setSelectedArtifact(related);
      setShowPreview(false);
      setTemplatePreview(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Detail View
  // ---------------------------------------------------------------------------

  if (selectedArtifact) {
    return (
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        {/* Back button */}
        <button
          onClick={() => { setSelectedArtifact(null); setShowPreview(false); setTemplatePreview(null); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'none',
            border: 'none',
            color: '#4a6cf7',
            cursor: 'pointer',
            fontSize: '0.9rem',
            padding: '0.4rem 0',
            marginBottom: '1rem',
          }}
        >
          ← Back to Artifacts
        </button>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
              {selectedArtifact.name}
            </h1>
            <CategoryBadge category={selectedArtifact.category} />
          </div>
          <p style={{ color: '#555', marginTop: '0.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
            {selectedArtifact.description}
          </p>
        </div>

        {/* Download button */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleGenerateTemplate(selectedArtifact.id)}
            disabled={generating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              background: generating ? '#94a3b8' : '#4a6cf7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            📥 {generating ? 'Saving...' : 'Download Template'}
          </button>
          <button
            onClick={() => handlePreviewTemplate(selectedArtifact.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              background: showPreview ? '#e2e8f0' : '#fff',
              color: '#4a6cf7',
              border: '1px solid #4a6cf7',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            👁️ {showPreview ? 'Hide Preview' : 'Preview Template'}
          </button>
        </div>

        {/* Template Preview */}
        {showPreview && templatePreview && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: '#1e293b',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '400px',
            }}
          >
            <pre style={{ margin: 0, fontSize: '0.8rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {templatePreview}
            </pre>
          </div>
        )}

        {/* Purpose */}
        <Section title="Purpose">
          <p style={{ margin: 0, lineHeight: 1.6 }}>{selectedArtifact.purpose}</p>
        </Section>

        {/* When to Use */}
        <Section title="When to Use">
          <p style={{ margin: 0, lineHeight: 1.6 }}>{selectedArtifact.whenToUse}</p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            {selectedArtifact.projectPhase.map((phase) => (
              <PhaseBadge key={phase} phase={phase} />
            ))}
          </div>
        </Section>

        {/* Frameworks */}
        <Section title="Frameworks">
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {selectedArtifact.frameworks.map((fw) => (
              <span
                key={fw}
                style={{
                  padding: '0.25rem 0.6rem',
                  background: '#f1f5f9',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  color: '#475569',
                }}
              >
                {fw}
              </span>
            ))}
          </div>
        </Section>

        {/* Audience */}
        <Section title="Audience">
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {selectedArtifact.audience.map((a) => (
              <span
                key={a}
                style={{
                  padding: '0.25rem 0.6rem',
                  background: '#f0fdf4',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  color: '#166534',
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </Section>

        {/* How to Build */}
        <Section title="How to Build">
          <div
            style={{ lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}
          >
            {selectedArtifact.howToBuild}
          </div>
        </Section>

        {/* Tips */}
        <Section title="Tips">
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {selectedArtifact.tips.map((tip, i) => (
              <li key={i} style={{ marginBottom: '0.4rem', lineHeight: 1.5, fontSize: '0.9rem' }}>
                {tip}
              </li>
            ))}
          </ul>
        </Section>

        {/* Common Mistakes */}
        <Section title="Common Mistakes" variant="warning">
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {selectedArtifact.commonMistakes.map((mistake, i) => (
              <li key={i} style={{ marginBottom: '0.4rem', lineHeight: 1.5, fontSize: '0.9rem' }}>
                {mistake}
              </li>
            ))}
          </ul>
        </Section>

        {/* Government Context */}
        {selectedArtifact.governmentContext && (
          <Section title="UK Government Context" variant="government">
            <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.9rem' }}>
              {selectedArtifact.governmentContext}
            </p>
          </Section>
        )}

        {/* Template Sections Preview */}
        <Section title="Template Sections">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {selectedArtifact.templateSections.map((section, i) => (
              <div
                key={i}
                style={{
                  padding: '0.6rem 0.8rem',
                  background: '#f8fafc',
                  borderRadius: '4px',
                  borderLeft: '3px solid #4a6cf7',
                }}
              >
                <strong style={{ fontSize: '0.85rem' }}>{section.heading}</strong>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  {section.guidance}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Related Artifacts */}
        {selectedArtifact.relatedArtifacts.length > 0 && (
          <Section title="Related Artifacts">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {selectedArtifact.relatedArtifacts.map((relId) => {
                const rel = artifacts.find((a) => a.id === relId);
                if (!rel) return null;
                return (
                  <button
                    key={relId}
                    onClick={() => handleRelatedClick(relId)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#4a6cf7',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4a6cf7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    {rel.name}
                  </button>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // List View
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        Loading artifacts...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
          Artifacts
        </h1>
        <p style={{ color: '#666', marginTop: '0.4rem', fontSize: '0.9rem' }}>
          Architecture and project artifact templates — what they are, when to use them, and
          downloadable templates
        </p>
      </header>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search artifacts by name, description, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.7rem 1rem',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#4a6cf7';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e0e0e0';
          }}
        />
      </div>

      {/* Category Filters */}
      <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <FilterChip
          label="All Categories"
          active={selectedCategory === null}
          onClick={() => setSelectedCategory(null)}
        />
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <FilterChip
            key={key}
            label={config.label}
            active={selectedCategory === key}
            onClick={() => setSelectedCategory(selectedCategory === key ? null : (key as ArtifactCategory))}
            color={config.color}
          />
        ))}
      </div>

      {/* Phase Filters */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <FilterChip
          label="All Phases"
          active={selectedPhase === null}
          onClick={() => setSelectedPhase(null)}
        />
        {Object.entries(PHASE_CONFIG).map(([key, config]) => (
          <FilterChip
            key={key}
            label={config.label}
            active={selectedPhase === key}
            onClick={() => setSelectedPhase(selectedPhase === key ? null : (key as ProjectPhase))}
            color={config.color}
          />
        ))}
      </div>

      {/* Results count */}
      <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
        Showing {filteredArtifacts.length} of {artifacts.length} artifacts
      </p>

      {/* Artifact Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}
      >
        {filteredArtifacts.map((artifact) => (
          <button
            key={artifact.id}
            onClick={() => setSelectedArtifact(artifact)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '1rem',
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <CategoryBadge category={artifact.category} />
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a2e', marginBottom: '0.3rem' }}>
              {artifact.name}
            </span>
            <span style={{ color: '#666', fontSize: '0.8rem', lineHeight: 1.4, flex: 1 }}>
              {artifact.description.length > 120
                ? artifact.description.slice(0, 120) + '...'
                : artifact.description}
            </span>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {artifact.projectPhase.slice(0, 3).map((phase) => (
                <PhaseBadge key={phase} phase={phase} small />
              ))}
              {artifact.projectPhase.length > 3 && (
                <span style={{ fontSize: '0.7rem', color: '#888' }}>
                  +{artifact.projectPhase.length - 3}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {filteredArtifacts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          <p style={{ fontSize: '1.1rem' }}>No artifacts match your filters</p>
          <p style={{ fontSize: '0.85rem' }}>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CategoryBadge({ category }: { category: ArtifactCategory }) {
  const config = CATEGORY_CONFIG[category];
  return (
    <span
      style={{
        padding: '0.2rem 0.5rem',
        background: config.bg,
        color: config.color,
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      }}
    >
      {config.label}
    </span>
  );
}

function PhaseBadge({ phase, small }: { phase: ProjectPhase; small?: boolean }) {
  const config = PHASE_CONFIG[phase];
  return (
    <span
      style={{
        padding: small ? '0.1rem 0.4rem' : '0.2rem 0.5rem',
        border: `1px solid ${config.color}40`,
        color: config.color,
        borderRadius: '3px',
        fontSize: small ? '0.65rem' : '0.75rem',
        fontWeight: 500,
      }}
    >
      {config.label}
    </span>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.3rem 0.7rem',
        border: `1px solid ${active ? color || '#4a6cf7' : '#e0e0e0'}`,
        background: active ? `${color || '#4a6cf7'}15` : '#fff',
        color: active ? color || '#4a6cf7' : '#666',
        borderRadius: '16px',
        fontSize: '0.75rem',
        cursor: 'pointer',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function Section({
  title,
  children,
  variant,
}: {
  title: string;
  children: React.ReactNode;
  variant?: 'warning' | 'government';
}) {
  const bgColor = variant === 'warning' ? '#fef2f2' : variant === 'government' ? '#eff6ff' : '#fff';
  const borderColor = variant === 'warning' ? '#fecaca' : variant === 'government' ? '#bfdbfe' : '#e2e8f0';
  const titleColor = variant === 'warning' ? '#991b1b' : variant === 'government' ? '#1e40af' : '#1a1a2e';
  const icon = variant === 'warning' ? '⚠️ ' : variant === 'government' ? '🏛️ ' : '';

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
      }}
    >
      <h3
        style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          margin: '0 0 0.6rem',
          color: titleColor,
        }}
      >
        {icon}{title}
      </h3>
      {children}
    </div>
  );
}
