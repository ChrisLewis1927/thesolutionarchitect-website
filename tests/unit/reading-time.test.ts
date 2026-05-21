import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from '../../website/build/reading-time';

describe('calculateReadingTime', () => {
  it('returns 1 for empty string', () => {
    expect(calculateReadingTime('')).toBe(1);
  });

  it('returns 1 for whitespace-only input', () => {
    expect(calculateReadingTime('   \n\t  ')).toBe(1);
  });

  it('returns 1 for fewer than 200 words', () => {
    const words = Array(50).fill('word').join(' ');
    expect(calculateReadingTime(words)).toBe(1);
  });

  it('returns 1 for exactly 200 words', () => {
    const words = Array(200).fill('word').join(' ');
    expect(calculateReadingTime(words)).toBe(1);
  });

  it('returns 2 for 201 words', () => {
    const words = Array(201).fill('word').join(' ');
    expect(calculateReadingTime(words)).toBe(2);
  });

  it('returns 2 for 400 words', () => {
    const words = Array(400).fill('word').join(' ');
    expect(calculateReadingTime(words)).toBe(2);
  });

  it('returns 3 for 401 words', () => {
    const words = Array(401).fill('word').join(' ');
    expect(calculateReadingTime(words)).toBe(3);
  });

  it('excludes fenced code blocks from word count', () => {
    const markdown = [
      'Here are five words before code.',
      '```javascript',
      'const x = 1;',
      'const y = 2;',
      'const z = 3;',
      '```',
      'And five words after the code.',
    ].join('\n');
    // 10 words outside code blocks -> ceil(10/200) = 1
    expect(calculateReadingTime(markdown)).toBe(1);
  });

  it('excludes inline code from word count', () => {
    const markdown = 'Use the `calculateReadingTime` function to compute time.';
    // Without inline code: "Use the  function to compute time." -> 7 tokens
    expect(calculateReadingTime(markdown)).toBe(1);
  });

  it('handles multiple fenced code blocks', () => {
    const words = Array(199).fill('word').join(' ');
    const markdown = [
      words,
      '```',
      Array(500).fill('code').join(' '),
      '```',
      'extra',
      '```python',
      'print("hello")',
      '```',
    ].join('\n');
    // 199 + 1 (extra) = 200 words -> ceil(200/200) = 1
    expect(calculateReadingTime(markdown)).toBe(1);
  });

  it('handles mixed inline code and fenced code blocks', () => {
    const words = Array(200).fill('word').join(' ');
    const markdown = [
      words,
      '```',
      'ignored code block content',
      '```',
      'one `ignored inline` more',
    ].join('\n');
    // 200 + "one" + "more" = 202 words -> ceil(202/200) = 2
    expect(calculateReadingTime(markdown)).toBe(2);
  });
});
