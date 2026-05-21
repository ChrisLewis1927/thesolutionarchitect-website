// ArchLens — AI Q&A page
// Implemented in Task 16.1

import { useState, useRef, useEffect, useCallback } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: { code: string; userMessage: string; retryable: boolean };
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function QA() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(generateSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || loading) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: question.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        const result = await window.archlens.ai.ask(question.trim(), sessionId);

        if (result && result.success === false && result.error) {
          const errPayload = result.error as { code: string; userMessage: string; retryable: boolean };
          const errorMsg: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            error: errPayload,
          };
          setMessages((prev) => [...prev, errorMsg]);
        } else {
          const data = result?.data ?? result;
          const assistantMsg: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: data?.content ?? String(data),
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch (err: unknown) {
        const errorMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          error: {
            code: 'UNKNOWN_ERROR',
            userMessage:
              err instanceof Error
                ? err.message
                : 'An unexpected error occurred. Please try again.',
            retryable: true,
          },
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [loading, sessionId],
  );

  const handleRetry = useCallback(
    (errorMsgId: string) => {
      // Find the user message immediately before this error
      const idx = messages.findIndex((m) => m.id === errorMsgId);
      if (idx < 1) return;

      let userQuestion = '';
      for (let i = idx - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          userQuestion = messages[i].content;
          break;
        }
      }
      if (!userQuestion) return;

      // Remove the error message and re-send
      setMessages((prev) => prev.filter((m) => m.id !== errorMsgId));
      sendMessage(userQuestion);
    },
    [messages, sendMessage],
  );

  const handleNewSession = useCallback(() => {
    setMessages([]);
    setSessionId(generateSessionId());
    setInput('');
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid #e0e0e0',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>
            AI Q&A
          </h2>
          <p style={{ color: '#666', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
            Ask architecture questions and get expert guidance
          </p>
        </div>
        <button
          onClick={handleNewSession}
          aria-label="Start new session"
          style={{
            padding: '0.5rem 1rem',
            background: '#f0f4ff',
            color: '#4a6cf7',
            border: '1px solid #4a6cf7',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          New Session
        </button>
      </div>

      {/* Messages area */}
      <div
        role="log"
        aria-label="Conversation messages"
        aria-live="polite"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {messages.length === 0 && !loading && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              textAlign: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '2rem' }}>💬</span>
            <p style={{ fontSize: '1rem', margin: 0 }}>
              Ask any architecture question to get started
            </p>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>
              Responses are tailored to UK government context including GDS, Secure by Design, and
              Zero Trust
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '75%',
                padding: '0.75rem 1rem',
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: msg.error
                  ? '#fef2f2'
                  : msg.role === 'user'
                    ? '#4a6cf7'
                    : '#fff',
                color: msg.error ? '#b91c1c' : msg.role === 'user' ? '#fff' : '#1a1a2e',
                border: msg.error
                  ? '1px solid #fca5a5'
                  : msg.role === 'user'
                    ? 'none'
                    : '1px solid #e0e0e0',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.error ? (
                <div>
                  <p role="alert" style={{ margin: '0 0 0.5rem' }}>
                    {msg.error.userMessage}
                  </p>
                  {msg.error.retryable && (
                    <button
                      onClick={() => handleRetry(msg.id)}
                      aria-label="Retry sending message"
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      Retry
                    </button>
                  )}
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              aria-label="AI is thinking"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '12px 12px 12px 2px',
                background: '#fff',
                border: '1px solid #e0e0e0',
                color: '#999',
                fontSize: '0.9rem',
              }}
            >
              Thinking…
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '1rem 2rem',
          borderTop: '1px solid #e0e0e0',
          background: '#fff',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask an architecture question…"
            aria-label="Message input"
            disabled={loading}
            rows={2}
            style={{
              flex: 1,
              padding: '0.6rem 0.75rem',
              border: '1px solid #d0d0d0',
              borderRadius: '8px',
              fontSize: '0.9rem',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              outline: 'none',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            style={{
              padding: '0.6rem 1.25rem',
              background: loading || !input.trim() ? '#a0a0a0' : '#4a6cf7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Send
          </button>
        </div>
        <p style={{ color: '#999', fontSize: '0.75rem', margin: '0.5rem 0 0' }}>
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
