import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  OpenAIProvider,
  GeminiProvider,
  AIService,
  UK_GOV_SYSTEM_PROMPT,
  ConversationContext,
  ConversationManager,
} from '../../../src/main/services/ai-service';
import { AITimeoutError, AIProviderError, NetworkError } from '../../../src/main/errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(overrides: Partial<ConversationContext> = {}): ConversationContext {
  return {
    sessionId: 'test-session',
    messages: [],
    systemPrompt: UK_GOV_SYSTEM_PROMPT,
    ...overrides,
  };
}

function openAIResponse(content = 'Hello', model = 'gpt-4o') {
  return {
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 10, completion_tokens: 20 },
    model,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider('sk-test-key');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // sendMessage — success
  // -----------------------------------------------------------------------

  describe('sendMessage', () => {
    it('sends a request to the OpenAI chat completions endpoint', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(openAIResponse('Test reply')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await provider.sendMessage('What is TOGAF?', makeContext());

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(options?.method).toBe('POST');
      expect((options?.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer sk-test-key',
      );

      expect(result.content).toBe('Test reply');
      expect(result.tokensUsed).toEqual({ prompt: 10, completion: 20 });
      expect(result.model).toBe('gpt-4o');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('includes system prompt as the first message', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(openAIResponse()), { status: 200 }),
      );

      await provider.sendMessage('Hello', makeContext());

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toBe(UK_GOV_SYSTEM_PROMPT);
    });

    it('includes conversation history before the current prompt', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(openAIResponse()), { status: 200 }),
      );

      const ctx = makeContext({
        messages: [
          { role: 'user', content: 'First question' },
          { role: 'assistant', content: 'First answer' },
        ],
      });

      await provider.sendMessage('Follow-up', ctx);

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
      expect(body.messages).toHaveLength(4); // system + 2 history + current
      expect(body.messages[1]).toEqual({ role: 'user', content: 'First question' });
      expect(body.messages[2]).toEqual({ role: 'assistant', content: 'First answer' });
      expect(body.messages[3]).toEqual({ role: 'user', content: 'Follow-up' });
    });

    it('skips system messages from conversation history', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(openAIResponse()), { status: 200 }),
      );

      const ctx = makeContext({
        messages: [
          { role: 'system', content: 'old system prompt' },
          { role: 'user', content: 'question' },
        ],
      });

      await provider.sendMessage('new question', ctx);

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
      // system (from context.systemPrompt) + user (history) + user (current)
      expect(body.messages).toHaveLength(3);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1]).toEqual({ role: 'user', content: 'question' });
    });
  });

  // -----------------------------------------------------------------------
  // sendMessage — error handling
  // -----------------------------------------------------------------------

  describe('sendMessage — errors', () => {
    it('throws AIProviderError on non-OK HTTP response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401 }),
      );

      await expect(provider.sendMessage('test', makeContext())).rejects.toThrow(
        AIProviderError,
      );
    });

    it('throws AITimeoutError when the request is aborted', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            (options?.signal as AbortSignal)?.addEventListener('abort', () => {
              const err = new DOMException('The operation was aborted.', 'AbortError');
              reject(err);
            });
          }),
      );

      const promise = provider.sendMessage('test', makeContext());
      vi.advanceTimersByTime(15_000);

      await expect(promise).rejects.toThrow(AITimeoutError);
    });

    it('throws NetworkError on fetch TypeError', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        new TypeError('Failed to fetch'),
      );

      await expect(provider.sendMessage('test', makeContext())).rejects.toThrow(
        NetworkError,
      );
    });

    it('throws AIProviderError with correct status for rate limiting', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Rate limited', { status: 429 }),
      );

      try {
        await provider.sendMessage('test', makeContext());
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AIProviderError);
        expect((err as AIProviderError).statusCode).toBe(429);
        expect((err as AIProviderError).retryable).toBe(true);
      }
    });

    it('throws AIProviderError for server errors (500)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Internal Server Error', { status: 500 }),
      );

      try {
        await provider.sendMessage('test', makeContext());
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AIProviderError);
        expect((err as AIProviderError).statusCode).toBe(500);
        expect((err as AIProviderError).retryable).toBe(true);
      }
    });
  });

  // -----------------------------------------------------------------------
  // UK Government System Prompt
  // -----------------------------------------------------------------------

  describe('UK Government System Prompt', () => {
    it('contains GDS Service Standard reference', () => {
      expect(UK_GOV_SYSTEM_PROMPT).toContain('GDS Service Standard');
    });

    it('contains Secure by Design reference', () => {
      expect(UK_GOV_SYSTEM_PROMPT).toContain('Secure by Design');
    });

    it('contains Zero Trust reference', () => {
      expect(UK_GOV_SYSTEM_PROMPT).toContain('Zero Trust');
    });

    it('contains TOGAF reference', () => {
      expect(UK_GOV_SYSTEM_PROMPT).toContain('TOGAF');
    });

    it('contains Well-Architected Framework reference', () => {
      expect(UK_GOV_SYSTEM_PROMPT).toContain('Well-Architected Framework');
    });
  });

  // -----------------------------------------------------------------------
  // validateApiKey
  // -----------------------------------------------------------------------

  describe('validateApiKey', () => {
    it('returns true when the models endpoint responds OK', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      const result = await provider.validateApiKey('sk-valid');
      expect(result).toBe(true);
    });

    it('returns false when the models endpoint returns 401', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401 }),
      );

      const result = await provider.validateApiKey('sk-invalid');
      expect(result).toBe(false);
    });

    it('returns false on network error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        new TypeError('Failed to fetch'),
      );

      const result = await provider.validateApiKey('sk-any');
      expect(result).toBe(false);
    });
  });
});


// ---------------------------------------------------------------------------
// Gemini helpers
// ---------------------------------------------------------------------------

function geminiResponse(text = 'Gemini reply') {
  return {
    candidates: [{ content: { parts: [{ text }] } }],
    usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 15 },
  };
}

// ---------------------------------------------------------------------------
// GeminiProvider Tests
// ---------------------------------------------------------------------------

describe('GeminiProvider', () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    provider = new GeminiProvider('gem-test-key');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('sendMessage', () => {
    it('sends a request to the Gemini generateContent endpoint with API key', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(geminiResponse('Test reply')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await provider.sendMessage('What is TOGAF?', makeContext());

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toContain(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      );
      expect(url).toContain('key=gem-test-key');
      expect(options?.method).toBe('POST');

      expect(result.content).toBe('Test reply');
      expect(result.tokensUsed).toEqual({ prompt: 5, completion: 15 });
      expect(result.model).toBe('gemini-pro');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('sends systemInstruction with the system prompt', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(geminiResponse()), { status: 200 }),
      );

      await provider.sendMessage('Hello', makeContext());

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
      expect(body.systemInstruction.parts[0].text).toBe(UK_GOV_SYSTEM_PROMPT);
    });

    it('maps assistant role to model role in contents', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(geminiResponse()), { status: 200 }),
      );

      const ctx = makeContext({
        messages: [
          { role: 'user', content: 'First question' },
          { role: 'assistant', content: 'First answer' },
        ],
      });

      await provider.sendMessage('Follow-up', ctx);

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
      expect(body.contents).toHaveLength(3); // 2 history + current
      expect(body.contents[0]).toEqual({
        role: 'user',
        parts: [{ text: 'First question' }],
      });
      expect(body.contents[1]).toEqual({
        role: 'model',
        parts: [{ text: 'First answer' }],
      });
      expect(body.contents[2]).toEqual({
        role: 'user',
        parts: [{ text: 'Follow-up' }],
      });
    });

    it('skips system messages from conversation history', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(geminiResponse()), { status: 200 }),
      );

      const ctx = makeContext({
        messages: [
          { role: 'system', content: 'old system prompt' },
          { role: 'user', content: 'question' },
        ],
      });

      await provider.sendMessage('new question', ctx);

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
      expect(body.contents).toHaveLength(2); // user (history) + user (current)
    });
  });

  describe('sendMessage — errors', () => {
    it('throws AIProviderError on non-OK HTTP response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401 }),
      );

      await expect(provider.sendMessage('test', makeContext())).rejects.toThrow(
        AIProviderError,
      );
    });

    it('throws AITimeoutError when the request is aborted', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            (options?.signal as AbortSignal)?.addEventListener('abort', () => {
              const err = new DOMException('The operation was aborted.', 'AbortError');
              reject(err);
            });
          }),
      );

      const promise = provider.sendMessage('test', makeContext());
      vi.advanceTimersByTime(15_000);

      await expect(promise).rejects.toThrow(AITimeoutError);
    });

    it('throws NetworkError on fetch TypeError', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        new TypeError('Failed to fetch'),
      );

      await expect(provider.sendMessage('test', makeContext())).rejects.toThrow(
        NetworkError,
      );
    });
  });

  describe('validateApiKey', () => {
    it('returns true when the models endpoint responds OK', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      const result = await provider.validateApiKey('gem-valid');
      expect(result).toBe(true);
    });

    it('calls the Gemini models endpoint with the key as query param', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      await provider.validateApiKey('gem-check');

      const [url] = fetchSpy.mock.calls[0];
      expect(url).toContain('generativelanguage.googleapis.com/v1beta/models');
      expect(url).toContain('key=gem-check');
    });

    it('returns false when the models endpoint returns 401', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401 }),
      );

      const result = await provider.validateApiKey('gem-invalid');
      expect(result).toBe(false);
    });

    it('returns false on network error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        new TypeError('Failed to fetch'),
      );

      const result = await provider.validateApiKey('gem-any');
      expect(result).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// AIService Tests
// ---------------------------------------------------------------------------

describe('AIService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('defaults to the openai provider', () => {
      const service = new AIService('sk-key', 'gem-key');
      expect(service.getActiveProvider().name).toBe('openai');
    });

    it('uses gemini when specified as default', () => {
      const service = new AIService('sk-key', 'gem-key', 'gemini');
      expect(service.getActiveProvider().name).toBe('gemini');
    });

    it('falls back to the available provider when default is not configured', () => {
      const service = new AIService('', 'gem-key', 'openai');
      expect(service.getActiveProvider().name).toBe('gemini');
    });

    it('throws when no API keys are provided', () => {
      expect(() => new AIService('', '')).toThrow(
        'No AI provider configured',
      );
    });
  });

  describe('switchProvider', () => {
    it('switches to gemini after successful key validation', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      const service = new AIService('sk-key', 'gem-key');
      expect(service.getActiveProvider().name).toBe('openai');

      await service.switchProvider('gemini', 'gem-valid-key');
      expect(service.getActiveProvider().name).toBe('gemini');
    });

    it('switches to openai after successful key validation', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      const service = new AIService('sk-key', 'gem-key', 'gemini');
      expect(service.getActiveProvider().name).toBe('gemini');

      await service.switchProvider('openai', 'sk-valid-key');
      expect(service.getActiveProvider().name).toBe('openai');
    });

    it('throws and does not switch when key validation fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401 }),
      );

      const service = new AIService('sk-key', 'gem-key');
      expect(service.getActiveProvider().name).toBe('openai');

      await expect(
        service.switchProvider('gemini', 'gem-bad-key'),
      ).rejects.toThrow('Invalid API key for gemini');

      // Provider should remain unchanged
      expect(service.getActiveProvider().name).toBe('openai');
    });
  });

  describe('sendMessage', () => {
    it('delegates to the active provider', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(openAIResponse('delegated')), { status: 200 }),
      );

      const service = new AIService('sk-key', 'gem-key');
      const result = await service.sendMessage('test', makeContext());

      expect(result.content).toBe('delegated');
    });
  });

  describe('validateKey', () => {
    it('validates an openai key without switching provider', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      const service = new AIService('sk-key', 'gem-key', 'gemini');
      const valid = await service.validateKey('openai', 'sk-check');

      expect(valid).toBe(true);
      // Should still be on gemini
      expect(service.getActiveProvider().name).toBe('gemini');
    });

    it('validates a gemini key without switching provider', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      const service = new AIService('sk-key', 'gem-key');
      const valid = await service.validateKey('gemini', 'gem-check');

      expect(valid).toBe(true);
      expect(service.getActiveProvider().name).toBe('openai');
    });

    it('returns false for an invalid key', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401 }),
      );

      const service = new AIService('sk-key', 'gem-key');
      const valid = await service.validateKey('gemini', 'gem-bad');

      expect(valid).toBe(false);
    });
  });
});


// ---------------------------------------------------------------------------
// ConversationManager Tests
// ---------------------------------------------------------------------------

describe('ConversationManager', () => {
  let manager: ConversationManager;

  beforeEach(() => {
    manager = new ConversationManager();
  });

  describe('createSession', () => {
    it('returns a unique session ID', () => {
      const id1 = manager.createSession();
      const id2 = manager.createSession();
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('creates a session with an empty message list', () => {
      const id = manager.createSession();
      expect(manager.getMessages(id)).toEqual([]);
    });
  });

  describe('addMessage', () => {
    it('adds a user message to the session', () => {
      const id = manager.createSession();
      manager.addMessage(id, 'user', 'Hello');
      const messages = manager.getMessages(id);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({ role: 'user', content: 'Hello' });
    });

    it('adds an assistant message to the session', () => {
      const id = manager.createSession();
      manager.addMessage(id, 'assistant', 'Hi there');
      const messages = manager.getMessages(id);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({ role: 'assistant', content: 'Hi there' });
    });

    it('accumulates messages in chronological order', () => {
      const id = manager.createSession();
      manager.addMessage(id, 'user', 'Q1');
      manager.addMessage(id, 'assistant', 'A1');
      manager.addMessage(id, 'user', 'Q2');
      manager.addMessage(id, 'assistant', 'A2');

      const messages = manager.getMessages(id);
      expect(messages).toEqual([
        { role: 'user', content: 'Q1' },
        { role: 'assistant', content: 'A1' },
        { role: 'user', content: 'Q2' },
        { role: 'assistant', content: 'A2' },
      ]);
    });

    it('throws when adding to a non-existent session', () => {
      expect(() => manager.addMessage('no-such-session', 'user', 'test')).toThrow(
        'Session "no-such-session" does not exist.',
      );
    });
  });

  describe('getMessages', () => {
    it('returns a copy of the messages (not a reference)', () => {
      const id = manager.createSession();
      manager.addMessage(id, 'user', 'Hello');
      const messages = manager.getMessages(id);
      messages.push({ role: 'assistant', content: 'injected' });
      // Original should be unaffected
      expect(manager.getMessages(id)).toHaveLength(1);
    });

    it('throws for a non-existent session', () => {
      expect(() => manager.getMessages('missing')).toThrow(
        'Session "missing" does not exist.',
      );
    });
  });

  describe('getContext', () => {
    it('returns a ConversationContext with the system prompt and messages', () => {
      const id = manager.createSession();
      manager.addMessage(id, 'user', 'What is TOGAF?');
      manager.addMessage(id, 'assistant', 'TOGAF is...');

      const ctx = manager.getContext(id, UK_GOV_SYSTEM_PROMPT);

      expect(ctx.sessionId).toBe(id);
      expect(ctx.systemPrompt).toBe(UK_GOV_SYSTEM_PROMPT);
      expect(ctx.messages).toEqual([
        { role: 'user', content: 'What is TOGAF?' },
        { role: 'assistant', content: 'TOGAF is...' },
      ]);
    });

    it('returns a copy of messages in the context', () => {
      const id = manager.createSession();
      manager.addMessage(id, 'user', 'test');
      const ctx = manager.getContext(id, 'prompt');
      ctx.messages.push({ role: 'assistant', content: 'injected' });
      expect(manager.getMessages(id)).toHaveLength(1);
    });

    it('throws for a non-existent session', () => {
      expect(() => manager.getContext('missing', 'prompt')).toThrow(
        'Session "missing" does not exist.',
      );
    });
  });

  describe('hasSession', () => {
    it('returns true for an existing session', () => {
      const id = manager.createSession();
      expect(manager.hasSession(id)).toBe(true);
    });

    it('returns false for a non-existent session', () => {
      expect(manager.hasSession('nope')).toBe(false);
    });
  });

  describe('clearSession', () => {
    it('removes a specific session', () => {
      const id = manager.createSession();
      manager.addMessage(id, 'user', 'test');
      manager.clearSession(id);
      expect(manager.hasSession(id)).toBe(false);
    });

    it('does not affect other sessions', () => {
      const id1 = manager.createSession();
      const id2 = manager.createSession();
      manager.addMessage(id1, 'user', 'msg1');
      manager.addMessage(id2, 'user', 'msg2');

      manager.clearSession(id1);

      expect(manager.hasSession(id1)).toBe(false);
      expect(manager.hasSession(id2)).toBe(true);
      expect(manager.getMessages(id2)).toHaveLength(1);
    });

    it('is a no-op for a non-existent session', () => {
      expect(() => manager.clearSession('ghost')).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('removes all sessions', () => {
      const id1 = manager.createSession();
      const id2 = manager.createSession();
      manager.addMessage(id1, 'user', 'a');
      manager.addMessage(id2, 'user', 'b');

      manager.clearAll();

      expect(manager.hasSession(id1)).toBe(false);
      expect(manager.hasSession(id2)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// AIService.ask() Tests
// ---------------------------------------------------------------------------

describe('AIService — ask()', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a question and records both user and assistant messages', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(openAIResponse('The answer')), { status: 200 }),
    );

    const service = new AIService('sk-key', 'gem-key');
    const cm = service.getConversationManager();
    const sessionId = cm.createSession();

    const result = await service.ask('What is Zero Trust?', sessionId);

    expect(result.content).toBe('The answer');

    const messages = cm.getMessages(sessionId);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({ role: 'user', content: 'What is Zero Trust?' });
    expect(messages[1]).toEqual({ role: 'assistant', content: 'The answer' });
  });

  it('accumulates multi-turn conversation context', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(openAIResponse('Answer 1')), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(openAIResponse('Answer 2')), { status: 200 }),
      );

    const service = new AIService('sk-key', 'gem-key');
    const cm = service.getConversationManager();
    const sessionId = cm.createSession();

    await service.ask('Q1', sessionId);
    await service.ask('Q2', sessionId);

    const messages = cm.getMessages(sessionId);
    expect(messages).toEqual([
      { role: 'user', content: 'Q1' },
      { role: 'assistant', content: 'Answer 1' },
      { role: 'user', content: 'Q2' },
      { role: 'assistant', content: 'Answer 2' },
    ]);

    // The second call should have included the full history
    const secondCallBody = JSON.parse(fetchSpy.mock.calls[1][1]?.body as string);
    // system + Q1 + A1 + Q2 (current)
    expect(secondCallBody.messages).toHaveLength(4);
    expect(secondCallBody.messages[0].role).toBe('system');
    expect(secondCallBody.messages[1]).toEqual({ role: 'user', content: 'Q1' });
    expect(secondCallBody.messages[2]).toEqual({ role: 'assistant', content: 'Answer 1' });
    expect(secondCallBody.messages[3]).toEqual({ role: 'user', content: 'Q2' });
  });

  it('throws when the session does not exist', async () => {
    const service = new AIService('sk-key', 'gem-key');
    await expect(service.ask('test', 'no-session')).rejects.toThrow(
      'Session "no-session" does not exist.',
    );
  });

  it('does not record assistant message when provider throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Rate limited', { status: 429 }),
    );

    const service = new AIService('sk-key', 'gem-key');
    const cm = service.getConversationManager();
    const sessionId = cm.createSession();

    await expect(service.ask('test', sessionId)).rejects.toThrow();

    // Only the user message should be recorded (assistant message not added on error)
    const messages = cm.getMessages(sessionId);
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
  });

  it('includes the UK government system prompt in the context', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(openAIResponse('reply')), { status: 200 }),
    );

    const service = new AIService('sk-key', 'gem-key');
    const cm = service.getConversationManager();
    const sessionId = cm.createSession();

    await service.ask('test', sessionId);

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[0].content).toBe(UK_GOV_SYSTEM_PROMPT);
  });
});
