// Architecture Design Lab — Learning Mode UI
// Implements: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function LearningMode() {
  const { assessmentId, domain } = useParams<{ assessmentId: string; domain: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (domain) loadContent(); }, [domain]);

  async function loadContent() {
    try {
      const result = await (window as any).archlens.designLab.getLearningContent(domain, 'recommended');
      if (result.success) setContent(result.data);
    } catch (err) { console.error('Failed to load learning content:', err); }
    finally { setLoading(false); }
  }

  if (loading) return <div style={{ padding: '2rem', color: '#666' }}>Loading learning content...</div>;
  if (!content) return <div style={{ padding: '2rem', color: '#dc2626' }}>Content not available</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate(`/design-lab/assessment/${assessmentId}`)} style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem' }}>← Back to Assessment</button>

      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.3rem' }}>
        Learning Mode: {domain?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
      </h1>
      <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Understand why this decision was made and what experienced architects would challenge.
      </p>

      {/* Why Selected */}
      <Section title="Why This Pattern Was Selected" icon="💡">
        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>{content.whySelected}</p>
      </Section>

      {/* When Inappropriate */}
      <Section title="When This Pattern Is Inappropriate" icon="🚫">
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          {content.whenInappropriate?.map((item: string, i: number) => (
            <li key={i} style={{ marginBottom: '0.4rem', fontSize: '0.85rem', lineHeight: 1.5 }}>{item}</li>
          ))}
        </ul>
      </Section>

      {/* Architect Questions */}
      <Section title="Questions an Experienced Architect Would Ask" icon="🤔">
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          {content.architectQuestions?.map((q: string, i: number) => (
            <li key={i} style={{ marginBottom: '0.4rem', fontSize: '0.85rem', lineHeight: 1.5 }}>{q}</li>
          ))}
        </ul>
      </Section>

      {/* Anti-Patterns */}
      <Section title="Common Anti-Patterns" icon="⚠️">
        {content.antiPatterns?.map((ap: any, i: number) => (
          <div key={i} style={{ padding: '0.6rem', background: '#fef2f2', borderRadius: '6px', marginBottom: '0.5rem' }}>
            <strong style={{ fontSize: '0.85rem', color: '#991b1b' }}>{ap.name}</strong>
            <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#333' }}>{ap.description}</p>
            <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#991b1b' }}><strong>Why problematic:</strong> {ap.whyProblematic}</p>
            <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#065f46' }}><strong>Better approach:</strong> {ap.betterApproach}</p>
          </div>
        ))}
      </Section>

      {/* Stakeholder Challenges */}
      <Section title="What Stakeholders Would Challenge" icon="👥">
        {content.stakeholderChallenges?.map((sc: any, i: number) => (
          <div key={i} style={{ marginBottom: '0.75rem' }}>
            <strong style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{sc.stakeholder}:</strong>
            <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1.2rem' }}>
              {sc.typicalChallenges?.map((c: string, j: number) => (
                <li key={j} style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>{c}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      {/* Governance Expectations */}
      <Section title="Governance Board Expectations" icon="🏛️">
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          {content.governanceExpectations?.map((exp: string, i: number) => (
            <li key={i} style={{ marginBottom: '0.4rem', fontSize: '0.85rem', lineHeight: 1.5 }}>{exp}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1a1a2e', marginBottom: '0.6rem' }}>{icon} {title}</h3>
      {children}
    </div>
  );
}
