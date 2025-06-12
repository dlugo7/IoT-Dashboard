import { describe, it, expect } from 'vitest';

describe('IoT Dashboard Frontend', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should verify React environment', () => {
    expect(import.meta.env).toBeDefined();
  });
}); 