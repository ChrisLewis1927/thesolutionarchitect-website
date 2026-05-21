// ArchLens — Document Review page
// Implemented in Task 16.2

import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types matching the IPC response shapes from the design doc
// ---------------------------------------------------------------------------

type ReviewArea =
  | 'gds-service-standard'
  | 'secure-by-design'
  | 'zero-trust'
  | 'technical-feasibility'
  | 'communication-clarity';

interface TrafficLightRating {
  area: ReviewArea;
  rating: 'green' | 'amber' | 'red';
  summary: string;
}

interface QuickOverview {
  ratings: TrafficLightRating[];
  overallSummary: string;
  generatedAt: string;
}

interface DeepDiveSection {
  area: ReviewArea;
  feedback: string;
  suggestions: string[];
  frameworkReferences: string[];
}

interface DeepDiveReview {
  sections: DeepDiveSection[];
  overallAssessment: string;
  generatedAt: string;
}

interface ParsedDocument {
  text: string;
  metadata: {
    filename: string;
    format: 'pdf' | 'docx' | 'txt';
    pageCount: number;
    wordCount: number;
    hasDiagrams: boolean;
  };
  warnings: string[];
}

type ReviewMode = 'quick' | 'deep';

const AREA_LABELS: Record<ReviewArea, string> = {
  'gds-service-standard': 'GDS Service Standard',
  'secure-by-design': 'Secure by Design',
  'zero-trust': 'Zero Trust',
  'technical-feasibility': 'Technical Feasibility',
  'communication-clarity': 'Communication Clarity',
};

const RATING_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  green: { bg: '#f0fdf4', border: '#86efac', text: '#166534', dot: '#22c55e' },
  amber: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', dot: '#f59e0b' },
  red: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', dot: '#ef4444' },
};

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

export default function DocumentReview() {
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [reviewMode, setReviewMode] = useState<ReviewMode>('quick');
  const [quickOverview, setQuickOverview] = useState<QuickOverview | null>(null);
  const [deepDive, setDeepDive] = useState<DeepDiveReview | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // File upload
  // -----------------------------------------------------------------------

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension client-side
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setUploadError(
        `Unsupported file format. Please upload a PDF, Word (.docx), or plain text (.txt) file.`,
      );
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadError(null);
    setParsedDoc(null);
    setQuickOverview(null);
    setDeepDive(null);
    setReviewError(null);

    // In Electron, file input gives us the path via webkitRelativePath or the File object.
    // The preload API expects a file path string. We use the file.path property
    // available in Electron's enhanced File object.
    const path = (file as File & { path?: string }).path ?? file.name;
    setFilePath(path);

    try {
      const result = await window.archlens.documents.upload(path);

      if (result && result.success === false && result.error) {
        const errPayload = result.error as { userMessage: string };
        setUploadError(errPayload.userMessage);
      } else {
        const data = result?.data ?? result;
        setParsedDoc(data as ParsedDocument);
      }
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "This file couldn't be processed. It may be corrupted or password-protected.",
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, []);

  // -----------------------------------------------------------------------
  // Review actions
  // -----------------------------------------------------------------------

  const runReview = useCallback(
    async (mode: ReviewMode) => {
      if (!filePath) return;

      setReviewing(true);
      setReviewError(null);

      try {
        const result =
          mode === 'quick'
            ? await window.archlens.ai.reviewQuick(filePath)
            : await window.archlens.ai.reviewDeep(filePath);

        if (result && result.success === false && result.error) {
          const errPayload = result.error as { userMessage: string };
          setReviewError(errPayload.userMessage);
        } else {
          const data = result?.data ?? result;
          if (mode === 'quick') {
            setQuickOverview(data as QuickOverview);
          } else {
            setDeepDive(data as DeepDiveReview);
          }
        }
      } catch (err: unknown) {
        setReviewError(
          err instanceof Error ? err.message : 'An unexpected error occurred during review.',
        );
      } finally {
        setReviewing(false);
      }
    },
    [filePath],
  );

  const handleReviewClick = useCallback(
    (mode: ReviewMode) => {
      setReviewMode(mode);
      // Only fetch if we don't already have results for this mode
      if (mode === 'quick' && !quickOverview) {
        runReview('quick');
      } else if (mode === 'deep' && !deepDive) {
        runReview('deep');
      }
    },
    [quickOverview, deepDive, runReview],
  );

  const handleReset = useCallback(() => {
    setParsedDoc(null);
    setFilePath(null);
    setUploadError(null);
    setQuickOverview(null);
    setDeepDive(null);
    setReviewError(null);
    setReviewMode('quick');
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a2e', margin: '0 0 0.25rem' }}>
        Document Review
      </h2>
      <p style={{ color: '#666', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
        Upload design documents for AI-powered review against UK government frameworks
      </p>

      {/* Upload section */}
      {!parsedDoc && (
        <UploadSection
          uploading={uploading}
          error={uploadError}
          onFileSelect={handleFileSelect}
        />
      )}

      {/* Document info + review controls */}
      {parsedDoc && (
        <>
          <DocumentInfo doc={parsedDoc} onReset={handleReset} />

          {/* Mode toggle */}
          <ModeToggle
            mode={reviewMode}
            onModeChange={handleReviewClick}
            reviewing={reviewing}
          />

          {/* Review error */}
          {reviewError && (
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
              {reviewError}
            </div>
          )}

          {/* Loading state */}
          {reviewing && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p style={{ fontSize: '0.95rem' }}>
                {reviewMode === 'quick'
                  ? 'Generating quick overview…'
                  : 'Generating deep dive analysis…'}
              </p>
            </div>
          )}

          {/* Quick Overview results */}
          {!reviewing && reviewMode === 'quick' && quickOverview && (
            <QuickOverviewView overview={quickOverview} />
          )}

          {/* Deep Dive results */}
          {!reviewing && reviewMode === 'deep' && deepDive && (
            <DeepDiveView review={deepDive} />
          )}

          {/* Prompt to start review if no results yet */}
          {!reviewing &&
            !reviewError &&
            ((reviewMode === 'quick' && !quickOverview) ||
              (reviewMode === 'deep' && !deepDive)) && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <button
                  onClick={() => runReview(reviewMode)}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: '#4a6cf7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {reviewMode === 'quick' ? 'Run Quick Overview' : 'Run Deep Dive'}
                </button>
              </div>
            )}
        </>
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UploadSection({
  uploading,
  error,
  onFileSelect,
}: {
  uploading: boolean;
  error: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      style={{
        border: '2px dashed #d0d0d0',
        borderRadius: '8px',
        padding: '2.5rem',
        textAlign: 'center',
        background: '#fff',
      }}
    >
      <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📄</span>
      <p style={{ color: '#333', fontSize: '1rem', margin: '0 0 0.5rem', fontWeight: 500 }}>
        Upload a design document
      </p>
      <p style={{ color: '#999', fontSize: '0.85rem', margin: '0 0 1rem' }}>
        Supported formats: PDF, Word (.docx), Plain Text (.txt)
      </p>

      <label
        style={{
          display: 'inline-block',
          padding: '0.6rem 1.5rem',
          background: uploading ? '#a0a0a0' : '#4a6cf7',
          color: '#fff',
          borderRadius: '6px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}
      >
        {uploading ? 'Uploading…' : 'Choose File'}
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={onFileSelect}
          disabled={uploading}
          style={{ display: 'none' }}
          aria-label="Upload document"
        />
      </label>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            color: '#b91c1c',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function DocumentInfo({
  doc,
  onReset,
}: {
  doc: ParsedDocument;
  onReset: () => void;
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <p style={{ margin: 0, fontWeight: 600, color: '#1a1a2e', fontSize: '0.95rem' }}>
          {doc.metadata.filename}
        </p>
        <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.8rem' }}>
          {doc.metadata.format.toUpperCase()} · {doc.metadata.pageCount} page
          {doc.metadata.pageCount !== 1 ? 's' : ''} · {doc.metadata.wordCount.toLocaleString()} words
          {doc.metadata.hasDiagrams && ' · Contains diagrams'}
        </p>
        {doc.warnings.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            {doc.warnings.map((w, i) => (
              <p
                key={i}
                style={{
                  margin: '0.15rem 0',
                  color: '#92400e',
                  fontSize: '0.8rem',
                  background: '#fffbeb',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  display: 'inline-block',
                }}
              >
                ⚠️ {w}
              </p>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onReset}
        aria-label="Upload a different document"
        style={{
          padding: '0.4rem 0.75rem',
          background: 'transparent',
          color: '#666',
          border: '1px solid #d0d0d0',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          flexShrink: 0,
        }}
      >
        Change File
      </button>
    </div>
  );
}

function ModeToggle({
  mode,
  onModeChange,
  reviewing,
}: {
  mode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
  reviewing: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="Review mode"
      style={{
        display: 'flex',
        gap: '0',
        marginBottom: '1.25rem',
        background: '#e5e7eb',
        borderRadius: '8px',
        padding: '3px',
        width: 'fit-content',
      }}
    >
      {(['quick', 'deep'] as const).map((m) => (
        <button
          key={m}
          role="tab"
          aria-selected={mode === m}
          aria-label={m === 'quick' ? 'Quick Overview' : 'Deep Dive'}
          onClick={() => onModeChange(m)}
          disabled={reviewing}
          style={{
            padding: '0.5rem 1.25rem',
            background: mode === m ? '#fff' : 'transparent',
            color: mode === m ? '#1a1a2e' : '#666',
            border: 'none',
            borderRadius: '6px',
            cursor: reviewing ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem',
            fontWeight: mode === m ? 600 : 400,
            boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {m === 'quick' ? 'Quick Overview' : 'Deep Dive'}
        </button>
      ))}
    </div>
  );
}

function QuickOverviewView({ overview }: { overview: QuickOverview }) {
  return (
    <div>
      {/* Overall summary */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: '#1a1a2e', fontSize: '0.95rem' }}>
          Overall Summary
        </p>
        <p style={{ margin: '0.5rem 0 0', color: '#444', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {overview.overallSummary}
        </p>
      </div>

      {/* Traffic-light rating cards */}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {overview.ratings.map((rating) => {
          const colors = RATING_COLORS[rating.rating] ?? RATING_COLORS.amber;
          return (
            <div
              key={rating.area}
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '1rem 1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: colors.dot,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 600, color: colors.text, fontSize: '0.9rem' }}>
                  {AREA_LABELS[rating.area] ?? rating.area}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: colors.text,
                  }}
                >
                  {rating.rating}
                </span>
              </div>
              <p style={{ margin: 0, color: colors.text, fontSize: '0.85rem', lineHeight: 1.5 }}>
                {rating.summary}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeepDiveView({ review }: { review: DeepDiveReview }) {
  return (
    <div>
      {/* Overall assessment */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: '#1a1a2e', fontSize: '0.95rem' }}>
          Overall Assessment
        </p>
        <p style={{ margin: '0.5rem 0 0', color: '#444', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {review.overallAssessment}
        </p>
      </div>

      {/* Sectioned feedback */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {review.sections.map((section) => (
          <div
            key={section.area}
            style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '1.25rem',
            }}
          >
            <h3
              style={{
                margin: '0 0 0.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1a1a2e',
              }}
            >
              {AREA_LABELS[section.area] ?? section.area}
            </h3>

            <p style={{ margin: '0 0 0.75rem', color: '#444', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {section.feedback}
            </p>

            {section.suggestions.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ margin: '0 0 0.35rem', fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e' }}>
                  Suggestions
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  {section.suggestions.map((s, i) => (
                    <li
                      key={i}
                      style={{ color: '#444', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.25rem' }}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {section.frameworkReferences.length > 0 && (
              <div>
                <p style={{ margin: '0 0 0.35rem', fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e' }}>
                  Framework References
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {section.frameworkReferences.map((ref, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '0.2rem 0.6rem',
                        background: '#f0f4ff',
                        color: '#4a6cf7',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                      }}
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
