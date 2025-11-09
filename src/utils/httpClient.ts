import axios from 'axios';
import pRetry from 'p-retry';

export async function httpGetWithRetry(url: string, timeout = 8000) {
  return pRetry(
    async () => {
      const resp = await axios.get(url, { timeout });
      if (resp.status >= 400) throw new Error('Bad response');
      return resp.data;
    },
    {
      retries: 4,
      factor: 2,
      minTimeout: 500,
      maxTimeout: 5000
    }
  );
}
