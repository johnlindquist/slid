import fs from 'node:fs';
import path from 'node:path';
import { render } from 'ink';
import { spawnSync } from 'bun';
import { App } from './components/App.js';
import type { AppAction } from './types/index.js';
import { parseCliArgs, showHelp, showVersion } from './utils/cli.js';
import { validateSlidesDir, loadSlides } from './utils/slides.js';
import {
  startPresenterServer,
  broadcastSlideChange,
  stopPresenterServer,
} from './utils/presenter.js';

/**
 * Wait for a single keypress using blocking read.
 * Returns: 'next', 'prev', or 'back' (to placeholder)
 */
function waitForKey(): 'next' | 'prev' | 'back' {
  // Set raw mode to get single keypress
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  const buf = new Uint8Array(10);
  let bytesRead = fs.readSync(process.stdin.fd, buf);

  const first = buf[0];

  // If we got an escape character, read more bytes for the full sequence
  if (first === 0x1b && bytesRead === 1) {
    const moreBuf = new Uint8Array(5);
    const moreBytes = fs.readSync(process.stdin.fd, moreBuf);
    for (let i = 0; i < moreBytes; i++) {
      buf[bytesRead + i] = moreBuf[i];
    }
    bytesRead += moreBytes;
  }

  // Reset raw mode
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }

  if (bytesRead === 0) return 'back'; // EOF, go back to placeholder

  // Check for escape sequence (arrow keys)
  // Normal mode: ESC [ C/D (0x1b 0x5b 0x43/0x44)
  // Application mode: ESC O C/D (0x1b 0x4f 0x43/0x44)
  if (first === 0x1b && bytesRead >= 3 && (buf[1] === 0x5b || buf[1] === 0x4f)) {
    if (buf[2] === 0x43) return 'next';  // Right arrow
    if (buf[2] === 0x44) return 'prev';  // Left arrow
  }

  // q or Q - go back to placeholder
  if (first === 0x71 || first === 0x51) return 'back';

  // Any other key - go back to placeholder
  return 'back';
}

async function main() {
  const args = parseCliArgs();

  if (args.showHelp) {
    showHelp();
    process.exit(0);
  }

  if (args.showVersion) {
    showVersion();
    process.exit(0);
  }

  validateSlidesDir(args.slidesDir);

  const slides = loadSlides(args.slidesDir);

  if (args.startAt >= slides.length) {
    console.error(
      `Error: --start-at value ${args.startAt + 1} exceeds total slides (${slides.length})`
    );
    process.exit(1);
  }

  let currentIndex = args.startAt;
  let running = true;
  const presenterMode = args.presenterMode;

  if (presenterMode) {
    const presenterHtmlPath = path.join(import.meta.dir, '..', 'presenter.html');
    startPresenterServer(slides, presenterHtmlPath);
  }

  // Supervisor loop - handles React app lifecycle and asciinema playback
  while (running) {
    console.clear();

    const handleSlideChange = presenterMode
      ? (index: number) => broadcastSlideChange(slides, index)
      : undefined;

    const action = await new Promise<AppAction>((resolve) => {
      const instance = render(
        <App
          slides={slides}
          initialIndex={currentIndex}
          slidesDir={args.slidesDir}
          onExit={resolve}
          onSlideChange={handleSlideChange}
        />
      );
      instance.waitUntilExit().then(() => resolve({ type: 'quit' }));
    });

    if (action.type === 'quit') {
      running = false;
      console.clear();
      stopPresenterServer();
    } else if (action.type === 'play') {
      currentIndex = action.slideIndex;

      let stayInPlayback = true;

      while (stayInPlayback) {
        console.clear();

        try {
          spawnSync(['asciinema', 'play', '-q', '-i', '0.5', '-s', '2', action.path], {
            stdin: 'inherit',
            stdout: 'inherit',
            stderr: 'inherit',
          });
        } catch {
          console.error("Error playing cast. Is 'asciinema' installed?");
        }

        // Show navigation footer
        const terminalWidth = process.stdout.columns || 80;
        const dim = '\x1b[2m';
        const reset = '\x1b[0m';
        const line = '─'.repeat(terminalWidth - 4);
        const nav = '← prev  → next  q back';
        const counter = `${currentIndex + 1}/${slides.length}`;
        const padding = ' '.repeat(Math.max(0, terminalWidth - 4 - nav.length - counter.length));

        console.log(`\n${dim}  ${line}${reset}`);
        console.log(`${dim}  ${nav}${padding}${counter}  ${reset}`);

        // Wait for navigation key using blocking read
        const result = waitForKey();

        if (result === 'next') {
          // Find next non-cast slide
          let nextIndex = currentIndex + 1;
          while (nextIndex < slides.length && slides[nextIndex]?.type === 'cast') {
            nextIndex++;
          }
          currentIndex = nextIndex < slides.length ? nextIndex : currentIndex;
          stayInPlayback = false;
        } else if (result === 'prev') {
          // Find previous non-cast slide
          let prevIndex = currentIndex - 1;
          while (prevIndex >= 0 && slides[prevIndex]?.type === 'cast') {
            prevIndex--;
          }
          currentIndex = prevIndex >= 0 ? prevIndex : currentIndex;
          stayInPlayback = false;
        } else if (result === 'back') {
          // Go back to placeholder (same slide index)
          stayInPlayback = false;
        }
      }
    }
  }
}

main();
