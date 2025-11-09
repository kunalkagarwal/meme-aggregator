import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import cors from 'cors';
import tokensRouter from './routes/tokens';
import { startPoller } from './services/poller';

export function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/tokens', tokensRouter);

  const server = http.createServer(app);
  const io = new IOServer(server, {
    cors: { origin: '*' }
  });

  startPoller(io);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  server.listen(port, () => console.log(`Server listening on ${port}`));
}
