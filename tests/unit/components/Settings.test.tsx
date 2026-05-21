// ArchLens — Settings component tests
// Implemented in Task 15.2

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Settings from '../../../src/renderer/pages/Settings';

const mockSettings = {
  aiProvider: 'openai' as const,
  openaiApiKey: 'sk-test-key',
  geminiApiKey: '',
  articleRefreshHour: 7,
  articleRefreshMinute: 0,
  targetRole: '',
  theme: 'light' as const,
};

beforeEach(() => {
  // Mock window.archlens
  window.archlens = {
    settings: {
      get: vi.fn().mockResolvedValue(mockSettings),
      update: vi.fn().mockResolvedValue(undefined),
    },
    ai: {
      validateKey: vi.fn().mockResolvedValue(true),
    },
  } as unknown as typeof window.archlens;
});

function renderSettings() {
  return render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
  );
}

describe('Settings', () => {
  it('renders the settings heading', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  it('loads settings on mount', async () => {
    renderSettings();
    await waitFor(() => {
      expect(window.archlens.settings.get).toHaveBeenCalled();
    });
  });

  it('displays AI provider radio buttons', async () => {
    renderSettings();
    await waitFor(() => {
      const radios = screen.getAllByRole('radio', { name: /openai|google gemini/i });
      expect(radios.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('displays API key inputs', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument();
      expect(screen.getByLabelText('Gemini API Key')).toBeInTheDocument();
    });
  });

  it('displays article refresh time inputs', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByLabelText('Article Refresh Time')).toBeInTheDocument();
    });
  });

  it('displays target role selector', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByLabelText('Target Role (DDAT)')).toBeInTheDocument();
    });
  });

  it('displays theme radio buttons', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByLabelText(/light/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/dark/i)).toBeInTheDocument();
    });
  });

  it('saves settings when save button is clicked', async () => {
    const user = userEvent.setup();
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText('Save Settings')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Save Settings'));
    await waitFor(() => {
      expect(window.archlens.settings.update).toHaveBeenCalled();
    });
  });

  it('validates API key when validate button is clicked', async () => {
    const user = userEvent.setup();
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText('Validate API Key')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Validate API Key'));
    await waitFor(() => {
      expect(window.archlens.ai.validateKey).toHaveBeenCalledWith('openai', 'sk-test-key');
    });
  });

  it('shows validation result after validating', async () => {
    const user = userEvent.setup();
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText('Validate API Key')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Validate API Key'));
    await waitFor(() => {
      expect(screen.getByText('API key is valid')).toBeInTheDocument();
    });
  });

  it('validates key on provider switch', async () => {
    const user = userEvent.setup();
    renderSettings();
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /google gemini/i })).toBeInTheDocument();
    });
    // Gemini key is empty, so validation should not be called
    await user.click(screen.getByRole('radio', { name: /google gemini/i }));
    // Since geminiApiKey is empty, validateKey should NOT be called
    expect(window.archlens.ai.validateKey).not.toHaveBeenCalled();
  });
});
