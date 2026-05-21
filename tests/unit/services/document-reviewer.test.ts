import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DocumentReviewer,
  buildQuickOverviewPrompt,
  parseQuickOverviewResponse,
  storeQuickOverview,
  buildDeepDivePrompt,
  parseDeepDiveResponse,
  storeDeepDiveReview,
  REVIEW_AREAS,
  QuickOverview,
  DeepDiveReview,
  ReviewArea,
} from '../../../src/main/services/document-reviewer';
import { AIService } from '../../../src/main/services/ai-service';
import { DatabaseManager } from '../../../src/main/services/database';
import { ParsedDocument } from '../../../src/main/services/document-parser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeParsedDoc(text = 'Sample architecture document content'): ParsedDocument {
  return {
    text,
    metadata: {
      filename: 'test-doc.pdf',
      format: 'pdf',
      pageCount: 5,
      wordCount: 100,
      hasDiagrams: false,
    },
    warnings: [],
  };
}

function makeValidAIResponse(): string {
  return JSON.stringify({
    ratings: [
      { area: 'gds-service-standard', rating: 'green', summary: 'Meets GDS standards well.' },
      { area: 'secure-by-design', rating: 'amber', summary: 'Some security gaps identified.' },
      { area: 'zero-trust', rating: 'red', summary: 'No zero trust considerations found.' },
      { area: 'technical-feasibility', rating: 'green', summary: 'Technically sound approach.' },
      { area: 'communication-clarity', rating: 'amber', summary: 'Could be clearer in places.' },
    ],
    overallSummary: 'The document is generally good but needs security improvements.',
  });
}

function openAIResponse(content: string) {
  return {
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 100, completion_tokens: 200 },
    model: 'gpt-4o',
  };
}

// ---------------------------------------------------------------------------
// buildQuickOverviewPrompt
// ---------------------------------------------------------------------------

describe('buildQuickOverviewPrompt', () => {
  it('includes the document text in the prompt', () => {
    const prompt = buildQuickOverviewPrompt('My architecture design');
    expect(prompt).toContain('My architecture design');
  });

  it('references all five review areas', () => {
    const prompt = buildQuickOverviewPrompt('doc text');
    expect(prompt).toContain('gds-service-standard');
    expect(prompt).toContain('secure-by-design');
    expect(prompt).toContain('zero-trust');
    expect(prompt).toContain('technical-feasibility');
    expect(prompt).toContain('communication-clarity');
  });

  it('instructs the AI to respond with JSON', () => {
    const prompt = buildQuickOverviewPrompt('doc text');
    expect(prompt).toContain('JSON');
  });

  it('includes traffic-light rating guidance', () => {
    const prompt = buildQuickOverviewPrompt('doc text');
    expect(prompt).toContain('green');
    expect(prompt).toContain('amber');
    expect(prompt).toContain('red');
  });
});

// ---------------------------------------------------------------------------
// parseQuickOverviewResponse
// ---------------------------------------------------------------------------

describe('parseQuickOverviewResponse', () => {
  it('parses a valid JSON response into a QuickOverview', () => {
    const result = parseQuickOverviewResponse(makeValidAIResponse());

    expect(result.ratings).toHaveLength(5);
    expect(result.overallSummary).toBe(
      'The document is generally good but needs security improvements.',
    );
    expect(result.generatedAt).toBeInstanceOf(Date);
  });

  it('maps all five review areas correctly', () => {
    const result = parseQuickOverviewResponse(makeValidAIResponse());
    const areas = result.ratings.map((r) => r.area);
    expect(areas).toEqual(REVIEW_AREAS);
  });

  it('maps ratings correctly', () => {
    const result = parseQuickOverviewResponse(makeValidAIResponse());
    const ratingMap = Object.fromEntries(result.ratings.map((r) => [r.area, r.rating]));
    expect(ratingMap['gds-service-standard']).toBe('green');
    expect(ratingMap['secure-by-design']).toBe('amber');
    expect(ratingMap['zero-trust']).toBe('red');
    expect(ratingMap['technical-feasibility']).toBe('green');
    expect(ratingMap['communication-clarity']).toBe('amber');
  });

  it('ensures every rating has a non-empty summary', () => {
    const result = parseQuickOverviewResponse(makeValidAIResponse());
    for (const rating of result.ratings) {
      expect(rating.summary.trim().length).toBeGreaterThan(0);
    }
  });

  it('handles JSON wrapped in markdown code fences', () => {
    const wrapped = '```json\n' + makeValidAIResponse() + '\n```';
    const result = parseQuickOverviewResponse(wrapped);
    expect(result.ratings).toHaveLength(5);
  });

  it('handles JSON wrapped in plain code fences', () => {
    const wrapped = '```\n' + makeValidAIResponse() + '\n```';
    const result = parseQuickOverviewResponse(wrapped);
    expect(result.ratings).toHaveLength(5);
  });

  it('provides a default overall summary when missing', () => {
    const json = JSON.stringify({
      ratings: [
        { area: 'gds-service-standard', rating: 'green', summary: 'Good.' },
        { area: 'secure-by-design', rating: 'green', summary: 'Good.' },
        { area: 'zero-trust', rating: 'green', summary: 'Good.' },
        { area: 'technical-feasibility', rating: 'green', summary: 'Good.' },
        { area: 'communication-clarity', rating: 'green', summary: 'Good.' },
      ],
    });
    const result = parseQuickOverviewResponse(json);
    expect(result.overallSummary).toBe('No overall summary provided.');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseQuickOverviewResponse('not json at all')).toThrow(
      'Failed to parse AI response as JSON',
    );
  });

  it('throws when ratings array is missing', () => {
    expect(() => parseQuickOverviewResponse('{"overallSummary": "test"}')).toThrow(
      'missing required "ratings" array',
    );
  });

  it('throws on invalid review area', () => {
    const json = JSON.stringify({
      ratings: [
        { area: 'invalid-area', rating: 'green', summary: 'test' },
      ],
    });
    expect(() => parseQuickOverviewResponse(json)).toThrow('Invalid review area');
  });

  it('throws on invalid rating value', () => {
    const json = JSON.stringify({
      ratings: [
        { area: 'gds-service-standard', rating: 'blue', summary: 'test' },
      ],
    });
    expect(() => parseQuickOverviewResponse(json)).toThrow('Invalid rating "blue"');
  });

  it('throws on empty summary', () => {
    const json = JSON.stringify({
      ratings: [
        { area: 'gds-service-standard', rating: 'green', summary: '  ' },
      ],
    });
    expect(() => parseQuickOverviewResponse(json)).toThrow('Empty summary');
  });

  it('throws on duplicate review area', () => {
    const json = JSON.stringify({
      ratings: [
        { area: 'gds-service-standard', rating: 'green', summary: 'First.' },
        { area: 'gds-service-standard', rating: 'amber', summary: 'Duplicate.' },
      ],
    });
    expect(() => parseQuickOverviewResponse(json)).toThrow('Duplicate review area');
  });

  it('throws when a required area is missing', () => {
    const json = JSON.stringify({
      ratings: [
        { area: 'gds-service-standard', rating: 'green', summary: 'Good.' },
        { area: 'secure-by-design', rating: 'green', summary: 'Good.' },
        { area: 'zero-trust', rating: 'green', summary: 'Good.' },
        { area: 'technical-feasibility', rating: 'green', summary: 'Good.' },
        // missing communication-clarity
      ],
    });
    expect(() => parseQuickOverviewResponse(json)).toThrow(
      'Missing required review area: "communication-clarity"',
    );
  });
});

// ---------------------------------------------------------------------------
// storeQuickOverview
// ---------------------------------------------------------------------------

describe('storeQuickOverview', () => {
  let db: DatabaseManager;

  beforeEach(() => {
    db = new DatabaseManager(':memory:');
    db.initialise();
  });

  afterEach(() => {
    db.close();
  });

  it('stores a review in the document_reviews table', () => {
    // First insert a document so the FK is satisfied
    db.getDatabase()
      .prepare(
        `INSERT INTO documents (id, filename, format, file_path, page_count, word_count, has_diagrams)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run('doc-1', 'test.pdf', 'pdf', '/tmp/test.pdf', 5, 100, 0);

    const overview: QuickOverview = {
      ratings: [
        { area: 'gds-service-standard', rating: 'green', summary: 'Good.' },
        { area: 'secure-by-design', rating: 'amber', summary: 'Needs work.' },
        { area: 'zero-trust', rating: 'red', summary: 'Missing.' },
        { area: 'technical-feasibility', rating: 'green', summary: 'Solid.' },
        { area: 'communication-clarity', rating: 'green', summary: 'Clear.' },
      ],
      overallSummary: 'Overall good.',
      generatedAt: new Date('2024-01-15T10:00:00Z'),
    };

    const reviewId = storeQuickOverview(db, 'doc-1', overview);

    expect(reviewId).toBeTruthy();
    expect(reviewId).toContain('review-');

    const row = db
      .getDatabase()
      .prepare('SELECT * FROM document_reviews WHERE id = ?')
      .get(reviewId) as Record<string, unknown>;

    expect(row).toBeTruthy();
    expect(row.document_id).toBe('doc-1');
    expect(row.mode).toBe('quick');

    const stored = JSON.parse(row.result_json as string);
    expect(stored.ratings).toHaveLength(5);
    expect(stored.overallSummary).toBe('Overall good.');
    expect(stored.generatedAt).toBe('2024-01-15T10:00:00.000Z');
  });

  it('returns a unique review ID', () => {
    db.getDatabase()
      .prepare(
        `INSERT INTO documents (id, filename, format, file_path, page_count, word_count, has_diagrams)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run('doc-2', 'test.pdf', 'pdf', '/tmp/test.pdf', 5, 100, 0);

    const overview: QuickOverview = {
      ratings: REVIEW_AREAS.map((area) => ({
        area,
        rating: 'green' as const,
        summary: 'Fine.',
      })),
      overallSummary: 'All good.',
      generatedAt: new Date(),
    };

    const id1 = storeQuickOverview(db, 'doc-2', overview);
    const id2 = storeQuickOverview(db, 'doc-2', overview);

    expect(id1).not.toBe(id2);
  });
});

// ---------------------------------------------------------------------------
// DocumentReviewer.quickOverview
// ---------------------------------------------------------------------------

describe('DocumentReviewer', () => {
  let db: DatabaseManager;

  beforeEach(() => {
    db = new DatabaseManager(':memory:');
    db.initialise();

    // Insert a document for FK
    db.getDatabase()
      .prepare(
        `INSERT INTO documents (id, filename, format, file_path, page_count, word_count, has_diagrams)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run('doc-test', 'arch.pdf', 'pdf', '/tmp/arch.pdf', 10, 500, 0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    db.close();
  });

  describe('quickOverview', () => {
    it('sends document text to AI and returns a parsed QuickOverview', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify(openAIResponse(makeValidAIResponse())),
          { status: 200 },
        ),
      );

      const aiService = new AIService('sk-key', 'gem-key');
      const reviewer = new DocumentReviewer(aiService, db);
      const doc = makeParsedDoc('My architecture document about cloud migration.');

      const result = await reviewer.quickOverview(doc, 'doc-test');

      expect(result.ratings).toHaveLength(5);
      expect(result.overallSummary).toBeTruthy();
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('covers all five review areas in the result', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify(openAIResponse(makeValidAIResponse())),
          { status: 200 },
        ),
      );

      const aiService = new AIService('sk-key', 'gem-key');
      const reviewer = new DocumentReviewer(aiService, db);

      const result = await reviewer.quickOverview(makeParsedDoc(), 'doc-test');
      const areas = result.ratings.map((r) => r.area);

      expect(areas).toEqual(REVIEW_AREAS);
    });

    it('stores the review result in the database', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify(openAIResponse(makeValidAIResponse())),
          { status: 200 },
        ),
      );

      const aiService = new AIService('sk-key', 'gem-key');
      const reviewer = new DocumentReviewer(aiService, db);

      await reviewer.quickOverview(makeParsedDoc(), 'doc-test');

      const rows = db
        .getDatabase()
        .prepare('SELECT * FROM document_reviews WHERE document_id = ?')
        .all('doc-test') as Record<string, unknown>[];

      expect(rows).toHaveLength(1);
      expect(rows[0].mode).toBe('quick');
    });

    it('includes document text in the AI prompt', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify(openAIResponse(makeValidAIResponse())),
          { status: 200 },
        ),
      );

      const aiService = new AIService('sk-key', 'gem-key');
      const reviewer = new DocumentReviewer(aiService, db);

      await reviewer.quickOverview(
        makeParsedDoc('Unique document content for testing'),
        'doc-test',
      );

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
      const userMessage = body.messages.find(
        (m: { role: string }) => m.role === 'user',
      );
      expect(userMessage.content).toContain('Unique document content for testing');
    });

    it('propagates AI errors to the caller', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Rate limited', { status: 429 }),
      );

      const aiService = new AIService('sk-key', 'gem-key');
      const reviewer = new DocumentReviewer(aiService, db);

      await expect(
        reviewer.quickOverview(makeParsedDoc(), 'doc-test'),
      ).rejects.toThrow();
    });
  });
});


// ---------------------------------------------------------------------------
// Deep Dive helpers
// ---------------------------------------------------------------------------

function makeValidDeepDiveAIResponse(): string {
  return JSON.stringify({
    sections: [
      {
        area: 'gds-service-standard',
        feedback: 'The document demonstrates good alignment with GDS standards but lacks detail on user research.',
        suggestions: ['Add user research evidence for GDS point 1', 'Include accessibility assessment per GDS point 5'],
        frameworkReferences: ['GDS Service Standard - Point 1: Understand users', 'GDS Service Standard - Point 5: Accessibility'],
      },
      {
        area: 'secure-by-design',
        feedback: 'Security considerations are present but not embedded throughout the lifecycle.',
        suggestions: ['Integrate threat modelling into the design phase'],
        frameworkReferences: ['Secure by Design - Principle 2: Embed security'],
      },
      {
        area: 'zero-trust',
        feedback: 'The document does not address zero trust principles adequately.',
        suggestions: ['Apply least-privilege access controls', 'Add explicit verification at every trust boundary'],
        frameworkReferences: ['Zero Trust - NCSC Guidance', 'Zero Trust - Never trust, always verify'],
      },
      {
        area: 'technical-feasibility',
        feedback: 'The proposed architecture is technically sound with good scalability considerations.',
        suggestions: ['Consider adding a disaster recovery strategy'],
        frameworkReferences: ['Well-Architected Framework - Reliability Pillar'],
      },
      {
        area: 'communication-clarity',
        feedback: 'The document is well-structured but some sections use overly technical language.',
        suggestions: ['Simplify executive summary for governance board audience'],
        frameworkReferences: ['TOGAF ADM Phase A - Architecture Vision'],
      },
    ],
    overallAssessment: 'The document is a solid foundation but needs improvements in security embedding and zero trust.',
  });
}

// ---------------------------------------------------------------------------
// buildDeepDivePrompt
// ---------------------------------------------------------------------------

describe('buildDeepDivePrompt', () => {
  it('includes the document text in the prompt', () => {
    const prompt = buildDeepDivePrompt('My deep dive document');
    expect(prompt).toContain('My deep dive document');
  });

  it('references all five review areas', () => {
    const prompt = buildDeepDivePrompt('doc text');
    expect(prompt).toContain('gds-service-standard');
    expect(prompt).toContain('secure-by-design');
    expect(prompt).toContain('zero-trust');
    expect(prompt).toContain('technical-feasibility');
    expect(prompt).toContain('communication-clarity');
  });

  it('references all required frameworks', () => {
    const prompt = buildDeepDivePrompt('doc text');
    expect(prompt).toContain('GDS Service Standard');
    expect(prompt).toContain('Secure by Design');
    expect(prompt).toContain('Zero Trust');
    expect(prompt).toContain('TOGAF');
    expect(prompt).toContain('Well-Architected Framework');
  });

  it('instructs the AI to provide suggestions and framework references', () => {
    const prompt = buildDeepDivePrompt('doc text');
    expect(prompt).toContain('suggestions');
    expect(prompt).toContain('frameworkReferences');
  });

  it('instructs the AI to respond with JSON', () => {
    const prompt = buildDeepDivePrompt('doc text');
    expect(prompt).toContain('JSON');
  });
});

// ---------------------------------------------------------------------------
// parseDeepDiveResponse
// ---------------------------------------------------------------------------

describe('parseDeepDiveResponse', () => {
  it('parses a valid JSON response into a DeepDiveReview', () => {
    const result = parseDeepDiveResponse(makeValidDeepDiveAIResponse());

    expect(result.sections).toHaveLength(5);
    expect(result.overallAssessment).toBe(
      'The document is a solid foundation but needs improvements in security embedding and zero trust.',
    );
    expect(result.generatedAt).toBeInstanceOf(Date);
  });

  it('maps all five review areas correctly', () => {
    const result = parseDeepDiveResponse(makeValidDeepDiveAIResponse());
    const areas = result.sections.map((s) => s.area);
    expect(areas).toEqual(REVIEW_AREAS);
  });

  it('each section has non-empty feedback', () => {
    const result = parseDeepDiveResponse(makeValidDeepDiveAIResponse());
    for (const section of result.sections) {
      expect(section.feedback.trim().length).toBeGreaterThan(0);
    }
  });

  it('each section has at least one suggestion', () => {
    const result = parseDeepDiveResponse(makeValidDeepDiveAIResponse());
    for (const section of result.sections) {
      expect(section.suggestions.length).toBeGreaterThanOrEqual(1);
      expect(section.suggestions.every((s) => s.trim().length > 0)).toBe(true);
    }
  });

  it('each section has at least one framework reference', () => {
    const result = parseDeepDiveResponse(makeValidDeepDiveAIResponse());
    for (const section of result.sections) {
      expect(section.frameworkReferences.length).toBeGreaterThanOrEqual(1);
      expect(section.frameworkReferences.every((r) => r.trim().length > 0)).toBe(true);
    }
  });

  it('handles JSON wrapped in markdown code fences', () => {
    const wrapped = '```json\n' + makeValidDeepDiveAIResponse() + '\n```';
    const result = parseDeepDiveResponse(wrapped);
    expect(result.sections).toHaveLength(5);
  });

  it('provides a default overall assessment when missing', () => {
    const raw = JSON.parse(makeValidDeepDiveAIResponse());
    delete raw.overallAssessment;
    const result = parseDeepDiveResponse(JSON.stringify(raw));
    expect(result.overallAssessment).toBe('No overall assessment provided.');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseDeepDiveResponse('not json')).toThrow(
      'Failed to parse AI response as JSON',
    );
  });

  it('throws when sections array is missing', () => {
    expect(() =>
      parseDeepDiveResponse('{"overallAssessment": "test"}'),
    ).toThrow('missing required "sections" array');
  });

  it('throws on invalid review area', () => {
    const json = JSON.stringify({
      sections: [
        { area: 'invalid-area', feedback: 'text', suggestions: ['s'], frameworkReferences: ['r'] },
      ],
    });
    expect(() => parseDeepDiveResponse(json)).toThrow('Invalid review area');
  });

  it('throws on empty feedback', () => {
    const json = JSON.stringify({
      sections: [
        { area: 'gds-service-standard', feedback: '  ', suggestions: ['s'], frameworkReferences: ['r'] },
      ],
    });
    expect(() => parseDeepDiveResponse(json)).toThrow('Empty feedback');
  });

  it('throws when suggestions are empty', () => {
    const json = JSON.stringify({
      sections: [
        { area: 'gds-service-standard', feedback: 'text', suggestions: [], frameworkReferences: ['r'] },
      ],
    });
    expect(() => parseDeepDiveResponse(json)).toThrow('No suggestions provided');
  });

  it('throws when framework references are empty', () => {
    const json = JSON.stringify({
      sections: [
        { area: 'gds-service-standard', feedback: 'text', suggestions: ['s'], frameworkReferences: [] },
      ],
    });
    expect(() => parseDeepDiveResponse(json)).toThrow('No framework references provided');
  });

  it('throws on duplicate review area', () => {
    const json = JSON.stringify({
      sections: [
        { area: 'gds-service-standard', feedback: 'text', suggestions: ['s'], frameworkReferences: ['r'] },
        { area: 'gds-service-standard', feedback: 'dup', suggestions: ['s'], frameworkReferences: ['r'] },
      ],
    });
    expect(() => parseDeepDiveResponse(json)).toThrow('Duplicate review area');
  });

  it('throws when a required area is missing', () => {
    const json = JSON.stringify({
      sections: [
        { area: 'gds-service-standard', feedback: 'text', suggestions: ['s'], frameworkReferences: ['r'] },
        { area: 'secure-by-design', feedback: 'text', suggestions: ['s'], frameworkReferences: ['r'] },
        { area: 'zero-trust', feedback: 'text', suggestions: ['s'], frameworkReferences: ['r'] },
        { area: 'technical-feasibility', feedback: 'text', suggestions: ['s'], frameworkReferences: ['r'] },
        // missing communication-clarity
      ],
    });
    expect(() => parseDeepDiveResponse(json)).toThrow(
      'Missing required review area: "communication-clarity"',
    );
  });

  it('filters out blank suggestions and references', () => {
    const json = JSON.stringify({
      sections: REVIEW_AREAS.map((area) => ({
        area,
        feedback: 'Feedback text.',
        suggestions: ['Valid suggestion', '', '  '],
        frameworkReferences: ['Valid ref', ''],
      })),
      overallAssessment: 'Assessment.',
    });
    const result = parseDeepDiveResponse(json);
    for (const section of result.sections) {
      expect(section.suggestions).toEqual(['Valid suggestion']);
      expect(section.frameworkReferences).toEqual(['Valid ref']);
    }
  });
});

// ---------------------------------------------------------------------------
// storeDeepDiveReview
// ---------------------------------------------------------------------------

describe('storeDeepDiveReview', () => {
  let db: DatabaseManager;

  beforeEach(() => {
    db = new DatabaseManager(':memory:');
    db.initialise();
  });

  afterEach(() => {
    db.close();
  });

  it('stores a deep dive review in the document_reviews table with mode "deep"', () => {
    db.getDatabase()
      .prepare(
        `INSERT INTO documents (id, filename, format, file_path, page_count, word_count, has_diagrams)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run('doc-dd-1', 'test.pdf', 'pdf', '/tmp/test.pdf', 5, 100, 0);

    const review: DeepDiveReview = {
      sections: REVIEW_AREAS.map((area) => ({
        area,
        feedback: `Feedback for ${area}.`,
        suggestions: [`Improve ${area}`],
        frameworkReferences: [`Framework ref for ${area}`],
      })),
      overallAssessment: 'Needs improvement overall.',
      generatedAt: new Date('2024-01-15T10:00:00Z'),
    };

    const reviewId = storeDeepDiveReview(db, 'doc-dd-1', review);

    expect(reviewId).toBeTruthy();
    expect(reviewId).toContain('review-');

    const row = db
      .getDatabase()
      .prepare('SELECT * FROM document_reviews WHERE id = ?')
      .get(reviewId) as Record<string, unknown>;

    expect(row).toBeTruthy();
    expect(row.document_id).toBe('doc-dd-1');
    expect(row.mode).toBe('deep');

    const stored = JSON.parse(row.result_json as string);
    expect(stored.sections).toHaveLength(5);
    expect(stored.overallAssessment).toBe('Needs improvement overall.');
    expect(stored.generatedAt).toBe('2024-01-15T10:00:00.000Z');
  });

  it('returns a unique review ID', () => {
    db.getDatabase()
      .prepare(
        `INSERT INTO documents (id, filename, format, file_path, page_count, word_count, has_diagrams)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run('doc-dd-2', 'test.pdf', 'pdf', '/tmp/test.pdf', 5, 100, 0);

    const review: DeepDiveReview = {
      sections: REVIEW_AREAS.map((area) => ({
        area,
        feedback: 'Feedback.',
        suggestions: ['Suggestion'],
        frameworkReferences: ['Reference'],
      })),
      overallAssessment: 'Assessment.',
      generatedAt: new Date(),
    };

    const id1 = storeDeepDiveReview(db, 'doc-dd-2', review);
    const id2 = storeDeepDiveReview(db, 'doc-dd-2', review);

    expect(id1).not.toBe(id2);
  });
});

// ---------------------------------------------------------------------------
// DocumentReviewer.deepDive
// ---------------------------------------------------------------------------

describe('DocumentReviewer', () => {
  let db: DatabaseManager;

  beforeEach(() => {
    db = new DatabaseManager(':memory:');
    db.initialise();

    db.getDatabase()
      .prepare(
        `INSERT INTO documents (id, filename, format, file_path, page_count, word_count, has_diagrams)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run('doc-deep', 'arch.pdf', 'pdf', '/tmp/arch.pdf', 10, 500, 0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    db.close();
  });

  describe('deepDive', () => {
    it('sends document text to AI and returns a parsed DeepDiveReview', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify(openAIResponse(makeValidDeepDiveAIResponse())),
          { status: 200 },
        ),
      );

      const aiService = new AIService('sk-key', 'gem-key');
      const reviewer = new DocumentReviewer(aiService, db);
      const doc = makeParsedDoc('My architecture document about cloud migration.');

      const result = await reviewer.deepDive(doc, 'doc-deep');

      expect(result.sections).toHaveLength(5);
      expect(result.overallAssessment).toBeTruthy();
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('covers all five review areas in the result', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify(openAIResponse(makeValidDeepDiveAIResponse())),
          { status: 200 },
        ),
      );

      const aiService = new AIService('sk-key', 'gem-key');
      const reviewer = new DocumentReviewer(aiService, db);

      const result = await reviewer.deepDive(makeParsedDoc(), 'doc-deep');
      const areas = result.sections.map((s) => s.area);

      expect(areas).toEqual(REVIEW_AREAS);
    });

    it('stores the review result in the database with mode "deep"', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify(openAIResponse(makeValidDeepDiveAIResponse())),
          { status: 200 },
        ),
      );

      const aiService = new AIService('sk-key', 'gem-key');
      const reviewer = new DocumentReviewer(aiService, db);

      await reviewer.deepDive(makeParsedDoc(), 'doc-deep');

      const rows = db
        .getDatabase()
        .prepare('SELECT * FROM document_reviews WHERE document_id = ?')
        .all('doc-deep') as Record<string, unknown>[];

      expect(rows).toHaveLength(1);
      expect(rows[0].mode).toBe('deep');
    });

    it('includes document text in the AI prompt', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify(openAIResponse(makeValidDeepDiveAIResponse())),
          { status: 200 },
        ),
      );

      const aiService = new AIService('sk-key', 'gem-key');
      const reviewer = new DocumentReviewer(aiService, db);

      await reviewer.deepDive(
        makeParsedDoc('Unique deep dive content for testing'),
        'doc-deep',
      );

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
      const userMessage = body.messages.find(
        (m: { role: string }) => m.role === 'user',
      );
      expect(userMessage.content).toContain('Unique deep dive content for testing');
    });

    it('propagates AI errors to the caller', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Rate limited', { status: 429 }),
      );

      const aiService = new AIService('sk-key', 'gem-key');
      const reviewer = new DocumentReviewer(aiService, db);

      await expect(
        reviewer.deepDive(makeParsedDoc(), 'doc-deep'),
      ).rejects.toThrow();
    });
  });
});
