// ArchLens — Document Reviewer
// Implemented in Task 5.1

import { AIService, UK_GOV_SYSTEM_PROMPT, ConversationContext } from './ai-service';
import { DatabaseManager } from './database';
import { ParsedDocument } from './document-parser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewArea =
  | 'gds-service-standard'
  | 'secure-by-design'
  | 'zero-trust'
  | 'technical-feasibility'
  | 'communication-clarity';

export interface TrafficLightRating {
  area: ReviewArea;
  rating: 'green' | 'amber' | 'red';
  summary: string;
}

export interface QuickOverview {
  ratings: TrafficLightRating[];
  overallSummary: string;
  generatedAt: Date;
}

export interface DeepDiveSection {
  area: ReviewArea;
  feedback: string;
  suggestions: string[];
  frameworkReferences: string[];
}

export interface DeepDiveReview {
  sections: DeepDiveSection[];
  overallAssessment: string;
  generatedAt: Date;
}

export const REVIEW_AREAS: ReviewArea[] = [
  'gds-service-standard',
  'secure-by-design',
  'zero-trust',
  'technical-feasibility',
  'communication-clarity',
];

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

export function buildQuickOverviewPrompt(documentText: string): string {
  return `You are reviewing a UK government architecture design document. Assess the document against each of the following five review areas and provide a traffic-light rating (green, amber, or red) with a brief summary for each.

Review areas:
1. gds-service-standard — Alignment with the UK Government Digital Service (GDS) Service Standard
2. secure-by-design — Compliance with the UK government Secure by Design framework
3. zero-trust — Consideration of Zero Trust architecture principles
4. technical-feasibility — Overall technical feasibility and soundness of the proposed design
5. communication-clarity — Clarity of communication and readability of the document

Rating guidance:
- green: The document adequately addresses this area with no significant concerns.
- amber: The document partially addresses this area but has specific concerns that need attention.
- red: The document has critical issues in this area that require resolution.

Respond ONLY with valid JSON in the following format (no markdown, no code fences, no extra text):
{
  "ratings": [
    { "area": "gds-service-standard", "rating": "green|amber|red", "summary": "Brief explanation" },
    { "area": "secure-by-design", "rating": "green|amber|red", "summary": "Brief explanation" },
    { "area": "zero-trust", "rating": "green|amber|red", "summary": "Brief explanation" },
    { "area": "technical-feasibility", "rating": "green|amber|red", "summary": "Brief explanation" },
    { "area": "communication-clarity", "rating": "green|amber|red", "summary": "Brief explanation" }
  ],
  "overallSummary": "A brief overall assessment of the document"
}

Document to review:
---
${documentText}
---`;
}

// ---------------------------------------------------------------------------
// Deep dive prompt construction
// ---------------------------------------------------------------------------

export function buildDeepDivePrompt(documentText: string): string {
  return `You are reviewing a UK government architecture design document in detail. For each of the five review areas below, provide:
- Detailed written feedback explaining strengths and weaknesses
- Specific improvement suggestions (at least one per area)
- References to the relevant best-practice frameworks that support your feedback (at least one per area)

Review areas:
1. gds-service-standard — Alignment with the UK Government Digital Service (GDS) Service Standard and its 14 points
2. secure-by-design — Compliance with the UK government Secure by Design framework, embedding security throughout the lifecycle
3. zero-trust — Consideration of Zero Trust architecture principles: never trust, always verify, least-privilege access
4. technical-feasibility — Overall technical feasibility, soundness, and scalability of the proposed design
5. communication-clarity — Clarity of communication, readability, and suitability for governance boards and stakeholders

Framework references to draw upon:
- GDS Service Standard (14 points of the UK Government Digital Service Standard)
- Secure by Design (UK government security framework)
- Zero Trust Architecture (NCSC guidance)
- TOGAF (The Open Group Architecture Framework, ADM cycle)
- Well-Architected Framework (AWS/Azure pillars: operational excellence, security, reliability, performance efficiency, cost optimisation, sustainability)

Respond ONLY with valid JSON in the following format (no markdown, no code fences, no extra text):
{
  "sections": [
    {
      "area": "gds-service-standard",
      "feedback": "Detailed feedback text...",
      "suggestions": ["Specific suggestion 1", "Specific suggestion 2"],
      "frameworkReferences": ["GDS Service Standard - Point 5", "TOGAF ADM Phase B"]
    },
    {
      "area": "secure-by-design",
      "feedback": "Detailed feedback text...",
      "suggestions": ["Specific suggestion 1"],
      "frameworkReferences": ["Secure by Design Principle 3"]
    },
    {
      "area": "zero-trust",
      "feedback": "Detailed feedback text...",
      "suggestions": ["Specific suggestion 1"],
      "frameworkReferences": ["Zero Trust - NCSC Guidance"]
    },
    {
      "area": "technical-feasibility",
      "feedback": "Detailed feedback text...",
      "suggestions": ["Specific suggestion 1"],
      "frameworkReferences": ["Well-Architected Framework - Reliability Pillar"]
    },
    {
      "area": "communication-clarity",
      "feedback": "Detailed feedback text...",
      "suggestions": ["Specific suggestion 1"],
      "frameworkReferences": ["TOGAF ADM Phase A - Architecture Vision"]
    }
  ],
  "overallAssessment": "A comprehensive overall assessment of the document"
}

Document to review:
---
${documentText}
---`;
}

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

const VALID_RATINGS = new Set(['green', 'amber', 'red']);

export function parseQuickOverviewResponse(aiContent: string): QuickOverview {
  // Strip markdown code fences if present
  let cleaned = aiContent.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Failed to parse AI response as JSON. Raw response: ${aiContent.slice(0, 200)}`,
    );
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('ratings' in parsed) ||
    !Array.isArray((parsed as Record<string, unknown>).ratings)
  ) {
    throw new Error('AI response missing required "ratings" array.');
  }

  const obj = parsed as { ratings: unknown[]; overallSummary?: string };

  const ratings: TrafficLightRating[] = [];
  const seenAreas = new Set<string>();

  for (const item of obj.ratings) {
    if (typeof item !== 'object' || item === null) {
      throw new Error('Each rating must be an object.');
    }

    const r = item as Record<string, unknown>;

    const area = String(r.area ?? '');
    const rating = String(r.rating ?? '');
    const summary = String(r.summary ?? '');

    if (!REVIEW_AREAS.includes(area as ReviewArea)) {
      throw new Error(`Invalid review area: "${area}".`);
    }
    if (!VALID_RATINGS.has(rating)) {
      throw new Error(`Invalid rating "${rating}" for area "${area}". Must be green, amber, or red.`);
    }
    if (!summary.trim()) {
      throw new Error(`Empty summary for area "${area}".`);
    }
    if (seenAreas.has(area)) {
      throw new Error(`Duplicate review area: "${area}".`);
    }

    seenAreas.add(area);
    ratings.push({ area: area as ReviewArea, rating: rating as 'green' | 'amber' | 'red', summary });
  }

  // Ensure all five areas are present
  for (const required of REVIEW_AREAS) {
    if (!seenAreas.has(required)) {
      throw new Error(`Missing required review area: "${required}".`);
    }
  }

  const overallSummary = typeof obj.overallSummary === 'string' && obj.overallSummary.trim()
    ? obj.overallSummary
    : 'No overall summary provided.';

  return {
    ratings,
    overallSummary,
    generatedAt: new Date(),
  };
}

export function parseDeepDiveResponse(aiContent: string): DeepDiveReview {
  // Strip markdown code fences if present
  let cleaned = aiContent.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Failed to parse AI response as JSON. Raw response: ${aiContent.slice(0, 200)}`,
    );
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('sections' in parsed) ||
    !Array.isArray((parsed as Record<string, unknown>).sections)
  ) {
    throw new Error('AI response missing required "sections" array.');
  }

  const obj = parsed as { sections: unknown[]; overallAssessment?: string };

  const sections: DeepDiveSection[] = [];
  const seenAreas = new Set<string>();

  for (const item of obj.sections) {
    if (typeof item !== 'object' || item === null) {
      throw new Error('Each section must be an object.');
    }

    const s = item as Record<string, unknown>;

    const area = String(s.area ?? '');
    const feedback = String(s.feedback ?? '');
    const suggestions = Array.isArray(s.suggestions)
      ? s.suggestions.map((x) => String(x))
      : [];
    const frameworkReferences = Array.isArray(s.frameworkReferences)
      ? s.frameworkReferences.map((x) => String(x))
      : [];

    if (!REVIEW_AREAS.includes(area as ReviewArea)) {
      throw new Error(`Invalid review area: "${area}".`);
    }
    if (!feedback.trim()) {
      throw new Error(`Empty feedback for area "${area}".`);
    }
    if (suggestions.length === 0 || suggestions.every((x) => !x.trim())) {
      throw new Error(`No suggestions provided for area "${area}".`);
    }
    if (frameworkReferences.length === 0 || frameworkReferences.every((x) => !x.trim())) {
      throw new Error(`No framework references provided for area "${area}".`);
    }
    if (seenAreas.has(area)) {
      throw new Error(`Duplicate review area: "${area}".`);
    }

    seenAreas.add(area);
    sections.push({
      area: area as ReviewArea,
      feedback,
      suggestions: suggestions.filter((x) => x.trim()),
      frameworkReferences: frameworkReferences.filter((x) => x.trim()),
    });
  }

  // Ensure all five areas are present
  for (const required of REVIEW_AREAS) {
    if (!seenAreas.has(required)) {
      throw new Error(`Missing required review area: "${required}".`);
    }
  }

  const overallAssessment =
    typeof obj.overallAssessment === 'string' && obj.overallAssessment.trim()
      ? obj.overallAssessment
      : 'No overall assessment provided.';

  return {
    sections,
    overallAssessment,
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Database storage
// ---------------------------------------------------------------------------

function generateId(): string {
  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function storeQuickOverview(
  db: DatabaseManager,
  documentId: string,
  overview: QuickOverview,
): string {
  const id = generateId();
  const resultJson = JSON.stringify({
    ratings: overview.ratings,
    overallSummary: overview.overallSummary,
    generatedAt: overview.generatedAt.toISOString(),
  });

  const stmt = db.getDatabase().prepare(
    `INSERT INTO document_reviews (id, document_id, mode, result_json, created_at)
     VALUES (?, ?, 'quick', ?, datetime('now'))`,
  );
  stmt.run(id, documentId, resultJson);

  return id;
}

export function storeDeepDiveReview(
  db: DatabaseManager,
  documentId: string,
  review: DeepDiveReview,
): string {
  const id = generateId();
  const resultJson = JSON.stringify({
    sections: review.sections,
    overallAssessment: review.overallAssessment,
    generatedAt: review.generatedAt.toISOString(),
  });

  const stmt = db.getDatabase().prepare(
    `INSERT INTO document_reviews (id, document_id, mode, result_json, created_at)
     VALUES (?, ?, 'deep', ?, datetime('now'))`,
  );
  stmt.run(id, documentId, resultJson);

  return id;
}

// ---------------------------------------------------------------------------
// DocumentReviewer
// ---------------------------------------------------------------------------

export class DocumentReviewer {
  constructor(
    private aiService: AIService,
    private db: DatabaseManager,
  ) {}

  async quickOverview(doc: ParsedDocument, documentId: string): Promise<QuickOverview> {
    const prompt = buildQuickOverviewPrompt(doc.text);

    const context: ConversationContext = {
      sessionId: `review-${documentId}`,
      messages: [],
      systemPrompt: UK_GOV_SYSTEM_PROMPT,
    };

    const aiResponse = await this.aiService.sendMessage(prompt, context);
    const overview = parseQuickOverviewResponse(aiResponse.content);

    storeQuickOverview(this.db, documentId, overview);

    return overview;
  }

  async deepDive(doc: ParsedDocument, documentId: string): Promise<DeepDiveReview> {
    const prompt = buildDeepDivePrompt(doc.text);

    const context: ConversationContext = {
      sessionId: `review-deep-${documentId}`,
      messages: [],
      systemPrompt: UK_GOV_SYSTEM_PROMPT,
    };

    const aiResponse = await this.aiService.sendMessage(prompt, context);
    const review = parseDeepDiveResponse(aiResponse.content);

    storeDeepDiveReview(this.db, documentId, review);

    return review;
  }
}
