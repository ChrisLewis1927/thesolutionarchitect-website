import { describe, it, expect } from 'vitest';

describe('Project scaffolding', () => {
  it('should have vitest configured and running', () => {
    expect(true).toBe(true);
  });

  it('should have fast-check available', async () => {
    const fc = await import('fast-check');
    expect(fc).toBeDefined();
    expect(typeof fc.assert).toBe('function');
  });
});
