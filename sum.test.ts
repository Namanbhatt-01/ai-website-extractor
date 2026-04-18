import { test, expect } from 'vitest';

test('flaky bug hunter', () => {
  // Fails 50% of the time
  expect(Math.random()).toBeGreaterThan(0.5);
});
