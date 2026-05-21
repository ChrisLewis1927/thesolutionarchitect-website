// ArchLens — AI Service Layer
// Implemented in Task 3.1

import { AITimeoutError, AIProviderError, NetworkError } from '../errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AIResponse {
  content: string;
  tokensUsed: { prompt: number; completion: number };
  model: string;
  latencyMs: number;
}

export interface ConversationContext {
  sessionId: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  systemPrompt: string;
}

export interface AIProvider {
  name: 'openai' | 'gemini';
  sendMessage(prompt: string, context: ConversationContext): Promise<AIResponse>;
  validateApiKey(key: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// UK Government Architecture System Prompt
// ---------------------------------------------------------------------------

export const UK_GOV_SYSTEM_PROMPT = `You are an expert UK government solution architecture advisor. All guidance must be tailored to the UK public sector context.

Your responses must reflect the following frameworks and principles:

1. GDS Service Standard — Follow the UK Government Digital Service Standard for designing and building government digital services. Ensure services meet the 14 points of the Service Standard.

2. Secure by Design — Embed security throughout the development lifecycle as required by the UK government Secure by Design framework. Security is not an afterthought but a foundational principle.

3. Zero Trust — Apply Zero Trust architecture principles: never trust, always verify. Assume breach, verify explicitly, and enforce least-privilege access for every request.

4. TOGAF — Apply The Open Group Architecture Framework methodology for enterprise architecture. Use the Architecture Development Method (ADM) cycle and architecture governance practices.

5. Well-Architected Framework — Apply cloud Well-Architected Framework principles (AWS and Azure) covering operational excellence, security, reliability, performance efficiency, cost optimisation, and sustainability.

When answering questions, consider the DDAT capability framework for solution architects and provide practical, actionable advice suitable for UK government architecture boards and governance processes.`;

// ---------------------------------------------------------------------------
// OpenAI Provider
// ---------------------------------------------------------------------------

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const TIMEOUT_MS = 15_000;

export class OpenAIProvider implements AIProvider {
  public readonly name = 'openai' as const;

  constructor(private apiKey: string) {}

  async sendMessage(prompt: string, context: ConversationContext): Promise<AIResponse> {
    const messages = this.buildMessages(prompt, context);
    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(OPENAI_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new AIProviderError(response.status, body || `HTTP ${response.status}`);
      }

      const data: any = await response.json();

      return {
        content: data.choices?.[0]?.message?.content ?? '',
        tokensUsed: {
          prompt: data.usage?.prompt_tokens ?? 0,
          completion: data.usage?.completion_tokens ?? 0,
        },
        model: data.model ?? 'gpt-4o',
        latencyMs,
      };
    } catch (error: unknown) {
      if (error instanceof AIProviderError) throw error;

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AITimeoutError();
      }
      if (
        error instanceof TypeError ||
        (error instanceof Error && error.message.includes('fetch'))
      ) {
        throw new NetworkError(
          error instanceof Error ? error.message : 'Network request failed',
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async validateApiKey(key: string): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${key}` },
        signal: controller.signal,
      });

      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildMessages(
    prompt: string,
    context: ConversationContext,
  ): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      { role: 'system', content: context.systemPrompt },
    ];

    // Append conversation history (skip any system messages already in history)
    for (const msg of context.messages) {
      if (msg.role !== 'system') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Append the current user prompt
    messages.push({ role: 'user', content: prompt });

    return messages;
  }
}

// ---------------------------------------------------------------------------
// Gemini Provider
// ---------------------------------------------------------------------------

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GEMINI_MODELS_URL =
  'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini' as const;

  constructor(private apiKey: string) {}

  async sendMessage(prompt: string, context: ConversationContext): Promise<AIResponse> {
    const contents = this.buildContents(prompt, context);
    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const url = `${GEMINI_API_URL}?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: context.systemPrompt }] },
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new AIProviderError(response.status, body || `HTTP ${response.status}`);
      }

      const data: any = await response.json();

      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const promptTokens =
        data.usageMetadata?.promptTokenCount ?? 0;
      const completionTokens =
        data.usageMetadata?.candidatesTokenCount ?? 0;

      return {
        content: text,
        tokensUsed: { prompt: promptTokens, completion: completionTokens },
        model: 'gemini-pro',
        latencyMs,
      };
    } catch (error: unknown) {
      if (error instanceof AIProviderError) throw error;

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AITimeoutError();
      }
      if (
        error instanceof TypeError ||
        (error instanceof Error && error.message.includes('fetch'))
      ) {
        throw new NetworkError(
          error instanceof Error ? error.message : 'Network request failed',
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async validateApiKey(key: string): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${GEMINI_MODELS_URL}?key=${key}`, {
        method: 'GET',
        signal: controller.signal,
      });

      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Builds the Gemini `contents` array from conversation history + current prompt.
   * Gemini uses `user` / `model` roles (not `assistant`).
   */
  private buildContents(
    prompt: string,
    context: ConversationContext,
  ): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> =
      [];

    for (const msg of context.messages) {
      if (msg.role === 'system') continue;
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    return contents;
  }
}

// ---------------------------------------------------------------------------
// Conversation Manager — per-session message history in memory
// ---------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  role: MessageRole;
  content: string;
}

let sessionCounter = 0;

/**
 * Manages conversation sessions in memory.
 * Each session stores a chronological list of user/assistant messages.
 * Context is cleared when a session is deleted or a new session replaces it.
 */
export class ConversationManager {
  private sessions: Map<string, ConversationMessage[]> = new Map();

  /** Creates a new session with a unique ID and returns the session ID. */
  createSession(): string {
    const id = `session-${Date.now()}-${++sessionCounter}`;
    this.sessions.set(id, []);
    return id;
  }

  /** Creates a session with a specific ID. If it already exists, this is a no-op. */
  createSessionWithId(sessionId: string): void {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
  }

  /** Adds a message to an existing session. Throws if the session does not exist. */
  addMessage(sessionId: string, role: MessageRole, content: string): void {
    const messages = this.sessions.get(sessionId);
    if (!messages) {
      throw new Error(`Session "${sessionId}" does not exist.`);
    }
    messages.push({ role, content });
  }

  /** Returns the messages for a session. Throws if the session does not exist. */
  getMessages(sessionId: string): ConversationMessage[] {
    const messages = this.sessions.get(sessionId);
    if (!messages) {
      throw new Error(`Session "${sessionId}" does not exist.`);
    }
    return [...messages];
  }

  /**
   * Builds a full ConversationContext for a session, including the system prompt.
   * Throws if the session does not exist.
   */
  getContext(sessionId: string, systemPrompt: string): ConversationContext {
    const messages = this.sessions.get(sessionId);
    if (!messages) {
      throw new Error(`Session "${sessionId}" does not exist.`);
    }
    return {
      sessionId,
      messages: [...messages],
      systemPrompt,
    };
  }

  /** Returns true if the session exists. */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /** Deletes a single session and its message history. */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /** Deletes all sessions. */
  clearAll(): void {
    this.sessions.clear();
  }
}

// ---------------------------------------------------------------------------
// AI Service — manages active provider, conversations, and supports switching
// ---------------------------------------------------------------------------

export class AIService {
  private activeProvider: AIProvider;
  private providers: Map<'openai' | 'gemini', AIProvider>;
  private conversationManager: ConversationManager;

  constructor(
    openaiApiKey: string,
    geminiApiKey: string,
    defaultProvider: 'openai' | 'gemini' = 'openai',
  ) {
    this.providers = new Map();
    this.conversationManager = new ConversationManager();

    if (openaiApiKey) {
      this.providers.set('openai', new OpenAIProvider(openaiApiKey));
    }
    if (geminiApiKey) {
      this.providers.set('gemini', new GeminiProvider(geminiApiKey));
    }

    const initial = this.providers.get(defaultProvider);
    if (!initial) {
      // Fall back to whichever provider is available
      const fallback = this.providers.values().next().value;
      if (!fallback) {
        // No providers configured yet — this is fine on first launch.
        // AI features will be unavailable until the user adds an API key in Settings.
        this.activeProvider = null as unknown as AIProvider;
        return;
      }
      this.activeProvider = fallback;
    } else {
      this.activeProvider = initial;
    }
  }

  /** Returns the currently active provider. */
  getActiveProvider(): AIProvider {
    return this.activeProvider;
  }

  /** Returns the conversation manager instance. */
  getConversationManager(): ConversationManager {
    return this.conversationManager;
  }

  /**
   * High-level ask method: sends a question within a conversation session.
   * Automatically manages conversation context — records the user message,
   * sends it to the active provider with full history, and records the response.
   */
  async ask(question: string, sessionId: string): Promise<AIResponse> {
    if (!this.activeProvider) {
      throw new Error('No AI provider configured. Please add an API key in Settings.');
    }

    // Auto-create the session if it doesn't exist yet
    if (!this.conversationManager.hasSession(sessionId)) {
      this.conversationManager.createSessionWithId(sessionId);
    }

    // Build context with history *before* adding the current user message,
    // because the provider's buildMessages/buildContents already appends
    // the current prompt as the final message.
    const context = this.conversationManager.getContext(sessionId, UK_GOV_SYSTEM_PROMPT);

    // Record the user message
    this.conversationManager.addMessage(sessionId, 'user', question);

    // Send to provider (provider appends `question` as the last user message)
    const response = await this.activeProvider.sendMessage(question, context);

    // Record the assistant response
    this.conversationManager.addMessage(sessionId, 'assistant', response.content);

    return response;
  }

  /**
   * Switches the active AI provider after validating the API key.
   * Throws if the key is invalid or the provider is not configured.
   */
  async switchProvider(provider: 'openai' | 'gemini', apiKey: string): Promise<void> {
    // Validate the key first
    const tempProvider =
      provider === 'openai'
        ? new OpenAIProvider(apiKey)
        : new GeminiProvider(apiKey);

    const valid = await tempProvider.validateApiKey(apiKey);
    if (!valid) {
      throw new Error(
        `Invalid API key for ${provider}. Please check your key and try again.`,
      );
    }

    // Key is valid — update the provider map and switch
    this.providers.set(provider, tempProvider);
    this.activeProvider = tempProvider;
  }

  /** Sends a message through the active provider. */
  async sendMessage(prompt: string, context: ConversationContext): Promise<AIResponse> {
    if (!this.activeProvider) {
      throw new Error('No AI provider configured. Please add an API key in Settings.');
    }
    return this.activeProvider.sendMessage(prompt, context);
  }

  /** Validates an API key for the given provider without switching. */
  async validateKey(
    provider: 'openai' | 'gemini',
    key: string,
  ): Promise<boolean> {
    const tempProvider =
      provider === 'openai'
        ? new OpenAIProvider(key)
        : new GeminiProvider(key);

    return tempProvider.validateApiKey(key);
  }
}
