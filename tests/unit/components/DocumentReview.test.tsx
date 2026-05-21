// ArchLens — Document Review component tests
// Implemented in Task 16.2

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DocumentReview from '../../../src/renderer/pages/DocumentReview';

const mockParsedDoc = {
  success: true,
  data: {
    text: 'Document content here',
    metadata: {
      filename: 'design.pdf',
      format: 'pdf',
      pageCount: 5,
      wordCount: 1200,
      hasDiagrams: false,
    },
    warnings: [],
  },
};

const mockQuickOverview = {
  success: true,
  data: {
    ratings: [
      { area: 'gds-service-standard', rating: 'green', summary: 'Meets GDS standards.' },
      { area: 'secure-by-design', rating: 'amber', summary: 'Some security concerns.' },
      { area: 'zero-trust', rating: 'red', summary: 'Missing zero trust considerations.' },
      { area: 'technical-feasibility', rating: 'green', summary: 'Technically sound.' },
      { area: 'communication-clarity', rating: 'green', summary: 'Well written.' },
    ],
    overallSummary: 'The document is generally good with some areas for improvement.',
    generatedAt: new Date().toISOString(),
  },
};

const mockDeepDive = {
  success: true,
  data: {
    sections: [
      {
        area: 'gds-service-standard',
        feedback: 'Good alignment with GDS standards.',
        suggestions: ['Consider adding user research evidence.'],
        frameworkReferences: ['GDS Service Standard Point 1'],
      },
      {
        area: 'secure-by-design',
        feedback: 'Security needs attention.',
        suggestions: ['Add threat model.', 'Include STRIDE analysis.'],
        frameworkReferences: ['Secure by Design Principle 3', 'NCSC CAF'],
      },
      {
        area: 'zero-trust',
        feedback: 'Zero trust not addressed.',
        suggestions: ['Define trust boundaries.'],
        frameworkReferences: ['Zero Trust Architecture'],
      },
      {
        area: 'technical-feasibility',
        feedback: 'Architecture is feasible.',
        suggestions: ['Consider scalability.'],
        frameworkReferences: ['AWS Well-Architected'],
      },
      {
        area: 'communication-clarity',
        feedback: 'Clear communication.',
        suggestions: ['Add executive summary.'],
        frameworkReferences: ['TOGAF ADM'],
      },
    ],
    overallAssessment: 'Solid document with room for improvement in security areas.',
    generatedAt: new Date().toISOString(),
  },
};

beforeEach(() => {
  window.archlens = {
    documents: {
      upload: vi.fn().mockResolvedValue(mockParsedDoc),
      getSupportedFormats: vi.fn().mockResolvedValue({ success: true, data: ['pdf', 'docx', 'txt'] }),
    },
    ai: {
      ask: vi.fn(),
      reviewQuick: vi.fn().mockResolvedValue(mockQuickOverview),
      reviewDeep: vi.fn().mockResolvedValue(mockDeepDive),
      validateKey: vi.fn(),
    },
    settings: { get: vi.fn(), update: vi.fn() },
  } as unknown as typeof window.archlens;
});

function renderDocReview() {
  return render(
    <MemoryRouter>
      <DocumentReview />
    </MemoryRouter>,
  );
}

function createFile(name: string, type: string): File {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'path', { value: `/tmp/${name}` });
  return file;
}

describe('DocumentReview Page', () => {
  it('renders the heading and upload area', () => {
    renderDocReview();
    expect(screen.getByText('Document Review')).toBeInTheDocument();
    expect(screen.getByText(/Upload a design document/)).toBeInTheDocument();
    expect(screen.getByText(/Supported formats/)).toBeInTheDocument();
  });

  it('renders file input with correct accept filter', () => {
    renderDocReview();
    const input = screen.getByLabelText('Upload document');
    expect(input).toHaveAttribute('accept', '.pdf,.docx,.txt');
  });

  it('shows error for unsupported file format', async () => {
    // Mock upload to return an unsupported format error (simulates backend validation)
    (window.archlens.documents.upload as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        userMessage: 'Unsupported file format. Please upload a PDF, Word (.docx), or plain text (.txt) file.',
        retryable: false,
      },
    });

    const user = userEvent.setup();
    renderDocReview();

    const input = screen.getByLabelText('Upload document');
    // Upload a .pdf file (passes client-side filter) but backend rejects it
    const file = createFile('bad.pdf', 'application/pdf');
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unsupported file format');
    });
  });

  it('uploads a supported file and shows document info', async () => {
    const user = userEvent.setup();
    renderDocReview();

    const input = screen.getByLabelText('Upload document');
    const file = createFile('design.pdf', 'application/pdf');
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('design.pdf')).toBeInTheDocument();
    });
    expect(screen.getByText(/PDF · 5 pages · 1,200 words/)).toBeInTheDocument();
  });

  it('shows parse error when upload fails', async () => {
    (window.archlens.documents.upload as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: {
        code: 'DOCUMENT_PARSE_ERROR',
        userMessage: "This file couldn't be processed.",
        retryable: false,
      },
    });

    const user = userEvent.setup();
    renderDocReview();

    const input = screen.getByLabelText('Upload document');
    const file = createFile('bad.pdf', 'application/pdf');
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent("couldn't be processed");
    });
  });

  it('shows mode toggle after upload', async () => {
    const user = userEvent.setup();
    renderDocReview();

    const input = screen.getByLabelText('Upload document');
    await user.upload(input, createFile('doc.pdf', 'application/pdf'));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Quick Overview' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Deep Dive' })).toBeInTheDocument();
    });
  });

  it('runs quick overview and displays traffic-light ratings', async () => {
    const user = userEvent.setup();
    renderDocReview();

    await user.upload(screen.getByLabelText('Upload document'), createFile('doc.pdf', 'application/pdf'));

    await waitFor(() => {
      expect(screen.getByText('Run Quick Overview')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Run Quick Overview'));

    await waitFor(() => {
      expect(screen.getByText('GDS Service Standard')).toBeInTheDocument();
      expect(screen.getByText('Meets GDS standards.')).toBeInTheDocument();
      expect(screen.getByText('Secure by Design')).toBeInTheDocument();
      expect(screen.getByText('Some security concerns.')).toBeInTheDocument();
      expect(screen.getByText('Zero Trust')).toBeInTheDocument();
    });
  });

  it('switches to deep dive mode and displays sectioned feedback', async () => {
    const user = userEvent.setup();
    renderDocReview();

    await user.upload(screen.getByLabelText('Upload document'), createFile('doc.pdf', 'application/pdf'));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Deep Dive' })).toBeInTheDocument();
    });

    // Clicking Deep Dive tab triggers the review automatically since no results exist yet
    await user.click(screen.getByRole('tab', { name: 'Deep Dive' }));

    await waitFor(() => {
      expect(screen.getByText('Good alignment with GDS standards.')).toBeInTheDocument();
      expect(screen.getByText('Consider adding user research evidence.')).toBeInTheDocument();
      expect(screen.getByText('GDS Service Standard Point 1')).toBeInTheDocument();
    });
  });

  it('shows change file button and resets on click', async () => {
    const user = userEvent.setup();
    renderDocReview();

    await user.upload(screen.getByLabelText('Upload document'), createFile('doc.pdf', 'application/pdf'));

    await waitFor(() => {
      expect(screen.getByLabelText('Upload a different document')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Upload a different document'));

    expect(screen.getByText(/Upload a design document/)).toBeInTheDocument();
  });

  it('shows review error when AI review fails', async () => {
    (window.archlens.ai.reviewQuick as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: {
        code: 'AI_TIMEOUT',
        userMessage: "The AI service didn't respond in time.",
        retryable: true,
      },
    });

    const user = userEvent.setup();
    renderDocReview();

    await user.upload(screen.getByLabelText('Upload document'), createFile('doc.pdf', 'application/pdf'));

    await waitFor(() => {
      expect(screen.getByText('Run Quick Overview')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Run Quick Overview'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent("didn't respond in time");
    });
  });
});
