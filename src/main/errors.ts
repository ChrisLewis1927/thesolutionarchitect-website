// ArchLens — Error handling architecture
// Implemented in Task 1.3

/**
 * Base error class for all ArchLens errors.
 * Carries a machine-readable code, a user-facing message, and a retryable flag
 * so IPC handlers can serialise errors consistently across the process boundary.
 */
export class ArchLensError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly userMessage: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ArchLensError';
  }
}

/**
 * Thrown when an AI provider does not respond within the 15-second timeout.
 */
export class AITimeoutError extends ArchLensError {
  constructor() {
    super(
      'AI provider did not respond within 15 seconds',
      'AI_TIMEOUT',
      "The AI service didn't respond in time. Please try again.",
      true,
    );
    this.name = 'AITimeoutError';
  }
}

/**
 * Thrown when an AI provider returns an HTTP error.
 * Uses `mapAIError` to derive the code, user message, and retryable flag
 * from the HTTP status code.
 */
export class AIProviderError extends ArchLensError {
  public readonly statusCode: number;

  constructor(statusCode: number, providerMessage: string) {
    const mapped = mapAIError(statusCode, providerMessage);
    super(providerMessage, mapped.code, mapped.userMessage, mapped.retryable);
    this.name = 'AIProviderError';
    this.statusCode = statusCode;
  }
}

/**
 * Thrown when a document cannot be parsed (corrupted, password-protected, etc.).
 */
export class DocumentParseError extends ArchLensError {
  constructor(message: string) {
    super(
      message,
      'DOCUMENT_PARSE_ERROR',
      "This file couldn't be processed. It may be corrupted or password-protected.",
      false,
    );
    this.name = 'DocumentParseError';
  }
}

/**
 * Thrown when a network request fails (no connectivity, DNS failure, etc.).
 */
export class NetworkError extends ArchLensError {
  constructor(message = 'Network request failed') {
    super(
      message,
      'NETWORK_ERROR',
      'No internet connection. Please check your connection and try again.',
      true,
    );
    this.name = 'NetworkError';
  }
}

/**
 * Thrown when input validation fails (unsupported format, file too large, etc.).
 */
export class ValidationError extends ArchLensError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'VALIDATION_ERROR',
      userMessage ?? message,
      false,
    );
    this.name = 'ValidationError';
  }
}

// ---------------------------------------------------------------------------
// mapAIError — maps HTTP status codes to typed error metadata
// ---------------------------------------------------------------------------

export interface MappedAIError {
  code: string;
  userMessage: string;
  retryable: boolean;
}

/**
 * Maps an HTTP status code (and optional provider message) to a structured
 * error descriptor used by `AIProviderError`.
 */
export function mapAIError(
  statusCode: number,
  _providerMessage?: string,
): MappedAIError {
  switch (statusCode) {
    case 401:
      return {
        code: 'AI_AUTH_ERROR',
        userMessage:
          'Your API key is invalid or has expired. Please check your key in Settings.',
        retryable: false,
      };
    case 403:
      return {
        code: 'AI_FORBIDDEN',
        userMessage:
          'Access denied by the AI provider. Please verify your API key permissions.',
        retryable: false,
      };
    case 429:
      return {
        code: 'AI_RATE_LIMIT',
        userMessage:
          'The AI service is rate-limited. Please wait a moment and try again.',
        retryable: true,
      };
    case 500:
    case 502:
    case 503:
      return {
        code: 'AI_SERVER_ERROR',
        userMessage:
          'The AI service is temporarily unavailable. Please try again shortly.',
        retryable: true,
      };
    default:
      return {
        code: 'AI_UNKNOWN_ERROR',
        userMessage:
          'An unexpected error occurred with the AI service. Please try again.',
        retryable: true,
      };
  }
}

// ---------------------------------------------------------------------------
// IPC response helpers — serialise results / errors across the process boundary
// ---------------------------------------------------------------------------

export interface IPCSuccessResponse<T> {
  success: true;
  data: T;
}

export interface IPCErrorPayload {
  code: string;
  userMessage: string;
  retryable: boolean;
}

export interface IPCErrorResponse {
  success: false;
  error: IPCErrorPayload;
}

export type IPCResponse<T> = IPCSuccessResponse<T> | IPCErrorResponse;

/**
 * Wraps a successful result for IPC transport.
 */
export function ipcSuccess<T>(data: T): IPCSuccessResponse<T> {
  return { success: true, data };
}

/**
 * Serialises an error for IPC transport.
 * If the error is an `ArchLensError`, its structured fields are used directly.
 * Otherwise a generic error payload is produced.
 */
export function ipcError(err: unknown): IPCErrorResponse {
  if (err instanceof ArchLensError) {
    return {
      success: false,
      error: {
        code: err.code,
        userMessage: err.userMessage,
        retryable: err.retryable,
      },
    };
  }

  const message =
    err instanceof Error ? err.message : 'An unknown error occurred';

  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      userMessage: `Something went wrong: ${message}`,
      retryable: false,
    },
  };
}
