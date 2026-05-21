// ArchLens — Dashboard home screen
// Implemented in Task 15.1

import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/ui-store';

interface FeatureCard {
  title: string;
  description: string;
  path: string;
  icon: string;
}

const features: FeatureCard[] = [
  {
    title: 'AI Q&A',
    description: 'Ask architecture questions and get expert guidance tailored to UK government context.',
    path: '/qa',
    icon: '💬',
  },
  {
    title: 'Document Review',
    description: 'Upload design documents for AI-powered review against best-practice frameworks.',
    path: '/documents',
    icon: '📄',
  },
  {
    title: 'Daily Articles',
    description: 'Curated daily articles on architecture, cloud, security, and government digital.',
    path: '/articles',
    icon: '📰',
  },
  {
    title: 'Learning Modules',
    description: 'Bite-sized learning on AWS, Azure, TOGAF, GDS, and more.',
    path: '/learning',
    icon: '📚',
  },
  {
    title: 'Diagram Training',
    description: 'Learn ArchiMate and architecture diagramming with guided tutorials.',
    path: '/diagrams',
    icon: '📐',
  },
  {
    title: 'Career Growth',
    description: 'Track certifications and get DDAT-aligned career recommendations.',
    path: '/career',
    icon: '🎯',
  },
  {
    title: 'Artifacts',
    description: 'Architecture & project artifact templates — what they are, when to use them, and downloadable templates.',
    path: '/artifacts',
    icon: '📋',
  },
  {
    title: 'Progress & Journal',
    description: 'Track your learning progress and maintain a development journal.',
    path: '/progress',
    icon: '📊',
  },
  {
    title: 'AI Guardrails',
    description: 'AI governance, security guardrails, and data protection guidance.',
    path: '/guardrails',
    icon: '🛡️',
  },
  {
    title: 'SA Academy',
    description: 'Solution Architect Academy — Master your craft with structured, progressive lessons.',
    path: '/academy',
    icon: '🎓',
  },
  {
    title: 'Settings',
    description: 'Configure AI provider, API keys, theme, and preferences.',
    path: '/settings',
    icon: '⚙️',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const startNavigation = useUIStore((s) => s.startNavigation);

  const handleNavigate = (path: string) => {
    startNavigation();
    navigate(path);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
          Welcome to ArchLens
        </h1>
        <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.95rem' }}>
          Your personal growth companion for UK government solution architecture
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {features.map((feature) => (
          <button
            key={feature.path}
            onClick={() => handleNavigate(feature.path)}
            aria-label={`Navigate to ${feature.title}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '1.25rem',
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'box-shadow 0.15s, border-color 0.15s',
              minHeight: '120px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#4a6cf7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#e0e0e0';
            }}
          >
            <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{feature.icon}</span>
            <span style={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a2e' }}>
              {feature.title}
            </span>
            <span style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: 1.4 }}>
              {feature.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
