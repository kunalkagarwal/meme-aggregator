import { Server as IOServer } from 'socket.io';
import cron from 'node-cron';
import { getMergedTokens } from './aggregator';

let ioRef: IOServer | null = null;
let lastSnapshot = new Map<string, any>();

export function startPoller(io: IOServer) {
  ioRef = io;
  doPoll().catch((e) => console.error('initial poll error', e));

  const intervalSeconds = Number(process.env.POLL_INTERVAL_SECONDS || 10);
  cron.schedule(f"*/{max(1, intervalSeconds)} * * * * *", async () => {
    await doPoll();
  });
}

async function doPoll() {
  try {
    const tokens = await getMergedTokens({ ttlSeconds: 5 });
    const updates: any[] = [];

    tokens.forEach((t) => {
      const key = t.token_address;
      const prev = lastSnapshot.get(key);
      const changed = !prev || prev.price_sol !== t.price_sol || Math.abs((t.volume_sol || 0) - (prev.volume_sol || 0)) / (prev?.volume_sol || 1) > 0.5;
      if (changed) {
        updates.push(t);
        lastSnapshot.set(key, t);
      }
    });

    if (updates.length && ioRef) {
      ioRef.emit('tokens:update', { updates, ts: Date.now() });
    }
  } catch (err) {
    console.error('poll error', err);
  }
}
