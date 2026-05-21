// ArchLens — App shell layout with sidebar navigation
// Implemented in Task 15.1

import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useUIStore } from '../stores/ui-store';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: '🏠' },
  { label: 'AI Q&A', path: '/qa', icon: '💬' },
  { label: 'Document Review', path: '/documents', icon: '📄' },
  { label: 'Daily Articles', path: '/articles', icon: '📰' },
  { label: 'Learning', path: '/learning', icon: '📚' },
  { label: 'Diagrams', path: '/diagrams', icon: '📐' },
  { label: 'Career', path: '/career', icon: '🎯' },
  { label: 'Artifacts', path: '/artifacts', icon: '📋' },
  { label: 'Progress', path: '/progress', icon: '📊' },
  { label: 'Guardrails', path: '/guardrails', icon: '🛡️' },
  { label: 'SA Academy', path: '/academy', icon: '🎓' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
];

export default function Layout() {
  const location = useLocation();
  const { setCurrentRoute, endNavigation } = useUIStore();

  useEffect(() => {
    setCurrentRoute(location.pathname);
    endNavigation();
  }, [location.pathname, setCurrentRoute, endNavigation]);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar */}
      <nav
        aria-label="Main navigation"
        style={{
          width: '220px',
          minWidth: '220px',
          background: '#1a1a2e',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.02em' }}>
            ArchLens
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.6rem 1rem',
                margin: '0.1rem 0.5rem',
                borderRadius: '6px',
                textDecoration: 'none',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                background: isActive ? 'rgba(74,108,247,0.3)' : 'transparent',
                fontSize: '0.85rem',
                transition: 'background 0.15s, color 0.15s',
              })}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          background: '#f8f9fa',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
