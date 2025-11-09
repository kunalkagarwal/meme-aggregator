import { httpGetWithRetry } from '../utils/httpClient';

export async function fetchFromDexScreener(tokenQuery: string) {
  const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(tokenQuery)}`;
  const data = await httpGetWithRetry(url);
  return data;
}

export async function fetchFromGeckoTerminal() {
  const url = 'https://api.geckoterminal.com/api/v2/networks/solana/tokens';
  const data = await httpGetWithRetry(url);
  return data;
}

export async function fetchJupiterPrices(ids: string[]) {
  if (ids.length === 0) return {};
  const url = `https://price.jup.ag/v4/price?ids=${ids.join(',')}`;
  const data = await httpGetWithRetry(url);
  return data;
}
