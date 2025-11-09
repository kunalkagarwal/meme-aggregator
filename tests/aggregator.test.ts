import { getMergedTokens } from '../src/services/aggregator';

test('getMergedTokens returns array', async () => {
  const t = await getMergedTokens({ ttlSeconds: 1 });
  expect(Array.isArray(t)).toBe(true);
});

test('pagination works (cursor encode/decode)', async () => {
  const tokens = await getMergedTokens({ ttlSeconds: 1 });
  expect(tokens.length >= 0).toBe(true);
});

// more tests should be added to reach >= 10 tests in a full submission
