import fs from 'node:fs';
import path from 'node:path';
import type { ServerWebSocket } from 'bun';
import type { Slide, PresenterMessage } from '../types/index.js';
import { PRESENTER_PORT } from './constants.js';

// Encapsulated presenter state
let presenterServer: ReturnType<typeof Bun.serve> | null = null;
const connectedClients = new Set<ServerWebSocket<unknown>>();
let presentationStartTime: number | null = null;

export const startPresenterServer = (slides: Slide[], presenterHtmlPath: string): void => {
  const presenterHtml = fs.readFileSync(presenterHtmlPath, 'utf-8');

  presenterServer = Bun.serve({
    port: PRESENTER_PORT,
    fetch(req, server) {
      const url = new URL(req.url);

      if (url.pathname === '/ws') {
        const upgraded = server.upgrade(req, { data: {} });
        if (!upgraded) {
          return new Response('WebSocket upgrade failed', { status: 400 });
        }
        return;
      }

      return new Response(presenterHtml, {
        headers: { 'Content-Type': 'text/html' },
      });
    },
    websocket: {
      open(ws) {
        connectedClients.add(ws);
        if (presentationStartTime) {
          ws.send(JSON.stringify({ type: 'init', startTime: presentationStartTime }));
        }
      },
      close(ws) {
        connectedClients.delete(ws);
      },
      message() {
        // No incoming messages expected
      },
    },
  });

  presentationStartTime = Date.now();
  console.log(
    `\x1b[36m[Presenter Mode]\x1b[0m Open in browser: \x1b[33mhttp://localhost:${PRESENTER_PORT}\x1b[0m`
  );
  console.log('\x1b[2mPress any key to start presentation...\x1b[0m');

  const buf = new Uint8Array(10);
  fs.readSync(process.stdin.fd, buf);
};

export const broadcastSlideChange = (slides: Slide[], index: number): void => {
  const currentSlide = slides[index];
  const nextSlide = slides[index + 1];

  const message: PresenterMessage = {
    type: 'slide',
    slideIndex: index,
    totalSlides: slides.length,
    title: currentSlide?.title ?? '',
    notes: currentSlide?.notes ?? '',
    nextTitle: nextSlide?.title ?? null,
  };

  const messageStr = JSON.stringify(message);
  for (const client of connectedClients) {
    client.send(messageStr);
  }
};

export const stopPresenterServer = (): void => {
  if (presenterServer) {
    presenterServer.stop();
    presenterServer = null;
  }
  connectedClients.clear();
  presentationStartTime = null;
};
