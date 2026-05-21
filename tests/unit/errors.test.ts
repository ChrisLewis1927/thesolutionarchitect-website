import { describe, it, expect } from 'vitest';
import {
  ArchLensError,
  AITimeoutError,
  AIProviderError,
  DocumentParseError,
  NetworkError,
  ValidationError,
  mapAIError,
  ipcSuccess,
  ipcError,
} from '../../src/main/errors';

// ---------------------------------------------------------------------------
// Error class hierarchy
// ---------------------------------------------------------------------------

describe('ArchLensError', () => {
  it('stores code, userMessage, and retryable', () => {
    const err = new ArchLensError('internal', 'CODE', 'User msg', true);
    expect(err.message).toBe('internal');
    expect(err.code).toBe('CODE');
    expect(err.userMessage).toBe('User msg');
    expect(err.retryable).toBe(true);
    expect(err.name).toBe('ArchLensError');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('AITimeoutError', () => {
  it('has correct defaults', () => {
    const err = new AITimeoutError();
    expect(err.code).toBe('AI_TIMEOUT');
    expect(err.retryable).toBe(true);
    expect(err.userMessage).toContain('respond in time');
    expect(err).toBeInstanceOf(ArchLensError);
  });
});

describe('AIProviderError', () => {
  it('maps a 429 status to rate-limit error', () => {
    const err = new AIProviderError(429, 'Too many requests');
    expect(err.code).toBe('AI_RATE_LIMIT');
    expect(err.retryable).toBe(true);
    expect(err.statusCode).toBe(429);
    expect(err.message).toBe('Too many requests');
    expect(err).toBeInstanceOf(ArchLensError);
  });

  it('maps a 401 status to auth error', () => {
    const err = new AIProviderError(401, 'Unauthorized');
    expect(err.code).toBe('AI_AUTH_ERROR');
    expect(err.retryable).toBe(false);
  });
});

describe('DocumentParseError', () => {
  it('is not retryable and has correct code', () => {
    const err = new DocumentParseError('corrupt pdf');
    expect(err.code).toBe('DOCUMENT_PARSE_ERROR');
    expect(err.retryable).toBe(false);
    expect(err.userMessage).toContain('corrupted');
    expect(err).toBeInstanceOf(ArchLensError);
  });
});

describe('NetworkError', () => {
  it('is retryable and has correct code', () => {
    const err = new NetworkError();
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.retryable).toBe(true);
    expect(err.userMessage).toContain('internet connection');
    expect(err).toBeInstanceOf(ArchLensError);
  });

  it('accepts a custom message', () => {
    const err = new NetworkError('DNS lookup failed');
    expect(err.message).toBe('DNS lookup failed');
  });
});

describe('ValidationError', () => {
  it('is not retryable', () => {
    const err = new ValidationError('bad input', 'Please fix your input.');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.retryable).toBe(false);
    expect(err.userMessage).toBe('Please fix your input.');
    expect(err).toBeInstanceOf(ArchLensError);
  });

  it('falls back to message when no userMessage provided', () => {
    const err = new ValidationError('field required');
    expect(err.userMessage).toBe('field required');
  });
});

// ---------------------------------------------------------------------------
// mapAIError
// ---------------------------------------------------------------------------

describe('mapAIError', () => {
  it('maps 401 to auth error (not retryable)', () => {
    const result = mapAIError(401);
    expect(result.code).toBe('AI_AUTH_ERROR');
    expect(result.retryable).toBe(false);
    expect(result.userMessage.length).toBeGreaterThan(0);
  });

  it('maps 403 to forbidden error (not retryable)', () => {
    const result = mapAIError(403);
    expect(result.code).toBe('AI_FORBIDDEN');
    expect(result.retryable).toBe(false);
  });

  it('maps 429 to rate limit error (retryable)', () => {
    const result = mapAIError(429);
    expect(result.code).toBe('AI_RATE_LIMIT');
    expect(result.retryable).toBe(true);
  });

  it.each([500, 502, 503])('maps %d to server error (retryable)', (status) => {
    const result = mapAIError(status);
    expect(result.code).toBe('AI_SERVER_ERROR');
    expect(result.retryable).toBe(true);
  });

  it('maps unknown status to unknown error (retryable)', () => {
    const result = mapAIError(418);
    expect(result.code).toBe('AI_UNKNOWN_ERROR');
    expect(result.retryable).toBe(true);
  });

  it('always returns a non-empty userMessage', () => {
    for (const status of [401, 403, 429, 500, 502, 503, 418, 0, 999]) {
      const result = mapAIError(status);
      expect(result.userMessage.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// IPC serialisation helpers
// ---------------------------------------------------------------------------

describe('ipcSuccess', () => {
  it('wraps data in a success envelope', () => {
    const resp = ipcSuccess({ items: [1, 2, 3] });
    expect(resp.success).toBe(true);
    expect(resp.data).toEqual({ items: [1, 2, 3] });
  });
});

describe('ipcError', () => {
  it('serialises an ArchLensError', () => {
    const err = new AITimeoutError();
    const resp = ipcError(err);
    expect(resp.success).toBe(false);
    expect(resp.error.code).toBe('AI_TIMEOUT');
    expect(resp.error.userMessage).toContain('respond in time');
    expect(resp.error.retryable).toBe(true);
  });

  it('serialises a plain Error', () => {
    const resp = ipcError(new Error('boom'));
    expect(resp.success).toBe(false);
    expect(resp.error.code).toBe('UNKNOWN_ERROR');
    expect(resp.error.userMessage).toContain('boom');
    expect(resp.error.retryable).toBe(false);
  });

  it('serialises a non-Error value', () => {
    const resp = ipcError('string error');
    expect(resp.success).toBe(false);
    expect(resp.error.code).toBe('UNKNOWN_ERROR');
    expect(resp.error.retryable).toBe(false);
  });
});
