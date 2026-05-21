// ArchLens — Dashboard component tests
// Implemented in Task 15.1

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../../src/renderer/pages/Dashboard';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe('Dashboard', () => {
  it('renders the welcome heading', () => {
    renderDashboard();
    expect(screen.getByText('Welcome to ArchLens')).toBeInTheDocument();
  });

  it('renders navigation cards for all feature areas', () => {
    renderDashboard();
    const expectedLabels = [
      'AI Q&A',
      'Document Review',
      'Daily Articles',
      'Learning Modules',
      'Diagram Training',
      'Career Growth',
      'Progress & Journal',
      'AI Guardrails',
      'Settings',
    ];
    for (const label of expectedLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders exactly 9 navigation cards', () => {
    renderDashboard();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(9);
  });

  it('each card has an accessible label', () => {
    renderDashboard();
    const expectedAria = [
      'Navigate to AI Q&A',
      'Navigate to Document Review',
      'Navigate to Daily Articles',
      'Navigate to Learning Modules',
      'Navigate to Diagram Training',
      'Navigate to Career Growth',
      'Navigate to Progress & Journal',
      'Navigate to AI Guardrails',
      'Navigate to Settings',
    ];
    for (const label of expectedAria) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it('cards are clickable', async () => {
    const user = userEvent.setup();
    renderDashboard();
    const qaCard = screen.getByLabelText('Navigate to AI Q&A');
    await user.click(qaCard);
    // Navigation is handled by React Router — no error means click succeeded
  });
});
