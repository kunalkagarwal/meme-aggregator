import { Router } from 'express';
import { getMergedTokens } from '../services/aggregator';

const router = Router();

function encodeCursorFromIndex(idx: number) {
  return Buffer.from(String(idx)).toString('base64');
}

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(50, Number(req.query.limit || 25));
    const cursor = req.query.cursor as string | undefined;
    const timeframe = (req.query.timeframe as string) || '24h';
    const sortBy = (req.query.sortBy as string) || 'volume';

    const tokens = await getMergedTokens({ ttlSeconds: 30 });

    tokens.sort((a, b) => {
      if (sortBy === 'price_change') return (b.price_1hr_change ?? 0) - (a.price_1hr_change ?? 0);
      if (sortBy === 'volume') return (b.volume_sol ?? 0) - (a.volume_sol ?? 0);
      return 0;
    });

    let start = 0;
    if (cursor) {
      const idx = Number(Buffer.from(cursor, 'base64').toString('utf8'));
      if (!Number.isNaN(idx)) start = idx;
    }

    const page = tokens.slice(start, start + limit);
    const nextCursor = start + page.length < tokens.length ? encodeCursorFromIndex(start + page.length) : null;

    res.json({ data: page, nextCursor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
