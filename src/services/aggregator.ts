import { fetchFromDexScreener, fetchFromGeckoTerminal, fetchJupiterPrices } from './sources';
import { cacheGet, cacheSet } from '../cache/cacheClient';

export interface TokenRecord {
  token_address: string;
  token_name?: string;
  token_ticker?: string;
  price_sol?: number;
  market_cap_sol?: number;
  volume_sol?: number;
  liquidity_sol?: number;
  transaction_count?: number;
  price_1hr_change?: number;
  protocol?: string;
  source?: string;
}

export async function getMergedTokens(opts: { ttlSeconds?: number } = {}) {
  const cacheKey = 'merged_tokens_v1';
  const ttl = opts.ttlSeconds ?? 30;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached as TokenRecord[];

  const [dex, gecko] = await Promise.allSettled([fetchFromDexScreener(''), fetchFromGeckoTerminal()]);

  const tokensMap = new Map<string, TokenRecord>();

  if (dex.status === 'fulfilled' && dex.value && dex.value.pairs) {
    const pairs = dex.value.pairs || [];
    pairs.forEach((p: any) => {
      const t: TokenRecord = {
        token_address: p.baseToken?.address || p.tokenAddress || p.baseToken?.address || p.quoteToken?.address,
        token_name: p.baseToken?.name || p.quoteToken?.name || p.label,
        token_ticker: p.baseToken?.symbol || p.quoteToken?.symbol || p.symbol,
        price_sol: Number(p.priceUsd) || undefined,
        volume_sol: Number(p.volumeUsd) || undefined,
        market_cap_sol: Number(p.marketCap) || undefined,
        liquidity_sol: Number(p.liquidity) || undefined,
        transaction_count: Number(p.txCount) || undefined,
        price_1hr_change: Number(p.priceChange?.hour) || Number(p.priceChange) || undefined,
        protocol: p.dexId || 'dexscreener',
        source: 'dexscreener'
      };
      if (!t.token_address) return;
      tokensMap.set(t.token_address, { ...(tokensMap.get(t.token_address) || {}), ...t });
    });
  }

  if (gecko.status === 'fulfilled' && Array.isArray(gecko.value?.data)) {
    gecko.value.data.forEach((g: any) => {
      const addr = g.address || g.token_address || g.id;
      if (!addr) return;
      const t: TokenRecord = {
        token_address: addr,
        token_name: g.name,
        token_ticker: g.symbol,
        price_sol: Number(g.price_usd) || undefined,
        volume_sol: Number(g.volume_24h) || undefined,
        market_cap_sol: Number(g.market_cap) || undefined,
        liquidity_sol: Number(g.liquidity) || undefined,
        transaction_count: Number(g.tx_count) || undefined,
        price_1hr_change: Number(g.percent_change_1h) || undefined,
        protocol: g.protocol || 'geckoterminal',
        source: 'geckoterminal'
      };
      const existing = tokensMap.get(addr) || {};
      tokensMap.set(addr, { ...existing, ...t });
    });
  }

  const tokens = Array.from(tokensMap.values()).map((v) => ({ ...v }));

  const ids = tokens.slice(0, 50).map((t) => t.token_address).filter(Boolean);
  try {
    const j = await fetchJupiterPrices(ids as string[]);
    if (j && Array.isArray(j)) {
      j.forEach((p: any) => {
        const addr = p.id;
        const t = tokensMap.get(addr);
        if (t) t.price_sol = p.price;
      });
    }
  } catch (err) {
  }

  await cacheSet(cacheKey, tokens, ttl);
  return tokens;
}
