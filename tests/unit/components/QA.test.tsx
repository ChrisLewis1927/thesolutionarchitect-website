// ArchLens — AI Q&A component tests
// Implemented in Task 16.1

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import QA from '../../../src/renderer/pages/QA';

beforeEach(() => {
  window.archlens = {
    ai: {
      ask: vi.fn().mockResolvedValue({
        success: true,
        data: { content: 'Here is your answer about architecture.', tokensUsed: { prompt: 10, completion: 20 }, model: 'gpt-4o', latencyMs: 500 },
      }),
      validateKey: vi.fn(),
    },
    settings: { get: vi.fn(), update: vi.fn() },
  } as unknown as typeof window.archlens;
});

function renderQA() {
  return render(
    <MemoryRouter>
      <QA />
    </MemoryRouter>,
  );
}

describe('QA Page', () => {
  it('renders the heading and empty state', () => {
    renderQA();
    expect(screen.getByText('AI Q&A')).toBeInTheDocument();
    expect(screen.getByText(/Ask any architecture question/)).toBeInTheDocument();
  });

  it('renders message input and send button', () => {
    renderQA();
    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('renders new session button', () => {
    renderQA();
    expect(screen.getByLabelText('Start new session')).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', () => {
    renderQA();
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('sends a message and displays the response', async () => {
    const user = userEvent.setup();
    renderQA();

    const input = screen.getByLabelText('Message input');
    await user.type(input, 'What is Zero Trust?');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText('What is Zero Trust?')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Here is your answer about architecture.')).toBeInTheDocument();
    });

    expect(window.archlens.ai.ask).toHaveBeenCalledWith(
      'What is Zero Trust?',
      expect.stringContaining('session-'),
    );
  });

  it('displays error message when AI returns an error', async () => {
    (window.archlens.ai.ask as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: {
        code: 'AI_TIMEOUT',
        userMessage: "The AI service didn't respond in time. Please try again.",
        retryable: true,
      },
    });

    const user = userEvent.setup();
    renderQA();

    await user.type(screen.getByLabelText('Message input'), 'test question');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        "The AI service didn't respond in time",
      );
    });
  });

  it('shows retry button for retryable errors', async () => {
    (window.archlens.ai.ask as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: {
        code: 'AI_TIMEOUT',
        userMessage: 'Timeout error',
        retryable: true,
      },
    });

    const user = userEvent.setup();
    renderQA();

    await user.type(screen.getByLabelText('Message input'), 'test');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByLabelText('Retry sending message')).toBeInTheDocument();
    });
  });

  it('does not show retry button for non-retryable errors', async () => {
    (window.archlens.ai.ask as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: {
        code: 'AI_AUTH_ERROR',
        userMessage: 'Invalid API key',
        retryable: false,
      },
    });

    const user = userEvent.setup();
    renderQA();

    await user.type(screen.getByLabelText('Message input'), 'test');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText('Retry sending message')).not.toBeInTheDocument();
  });

  it('clears messages on new session', async () => {
    const user = userEvent.setup();
    renderQA();

    await user.type(screen.getByLabelText('Message input'), 'hello');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText('hello')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Start new session'));

    expect(screen.queryByText('hello')).not.toBeInTheDocument();
    expect(screen.getByText(/Ask any architecture question/)).toBeInTheDocument();
  });

  it('handles thrown exceptions gracefully', async () => {
    (window.archlens.ai.ask as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network failure'),
    );

    const user = userEvent.setup();
    renderQA();

    await user.type(screen.getByLabelText('Message input'), 'test');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network failure');
    });
  });
});
