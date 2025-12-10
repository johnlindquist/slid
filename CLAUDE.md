---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// import .css files directly and it works
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.

## Terminal Escape Sequences

When reading raw keyboard input with `fs.readSync()` in raw mode, arrow keys send escape sequences that vary by terminal mode:

### Arrow Keys

| Key   | Normal Mode (ESC [ X) | Application Mode (ESC O X) |
|-------|----------------------|---------------------------|
| Up    | `0x1b 0x5b 0x41`     | `0x1b 0x4f 0x41`          |
| Down  | `0x1b 0x5b 0x42`     | `0x1b 0x4f 0x42`          |
| Right | `0x1b 0x5b 0x43`     | `0x1b 0x4f 0x43`          |
| Left  | `0x1b 0x5b 0x44`     | `0x1b 0x4f 0x44`          |

- **Normal mode**: `ESC [` prefix (0x1b 0x5b) - standard ANSI
- **Application mode**: `ESC O` prefix (0x1b 0x4f) - used by some terminals (e.g., macOS Terminal.app, iTerm2)

Always check for BOTH `0x5b` ('[') and `0x4f` ('O') at position 1 to support all terminals.

### Common Single-Byte Keys

| Key     | Hex    | Decimal |
|---------|--------|---------|
| q       | 0x71   | 113     |
| Q       | 0x51   | 81      |
| h       | 0x68   | 104     |
| l       | 0x6c   | 108     |
| Space   | 0x20   | 32      |
| Enter   | 0x0d   | 13      |
| Newline | 0x0a   | 10      |
| Ctrl+C  | 0x03   | 3       |
| ESC     | 0x1b   | 27      |

### Reading Escape Sequences

Escape sequences may arrive as:
1. All bytes in one read (bytesRead=3)
2. ESC alone, then remaining bytes in second read

Handle both cases:
```typescript
const buf = new Uint8Array(10);
let bytesRead = fs.readSync(process.stdin.fd, buf);

// If we got ESC alone, read more bytes
if (buf[0] === 0x1b && bytesRead === 1) {
  const more = new Uint8Array(5);
  const m = fs.readSync(process.stdin.fd, more);
  for (let i = 0; i < m; i++) buf[bytesRead + i] = more[i];
  bytesRead += m;
}
```
