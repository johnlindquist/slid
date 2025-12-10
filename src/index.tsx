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
      console.clear();

      try {
        spawnSync(['asciinema', 'play', '-i', '2', action.path], {
          stdio: ['inherit', 'inherit', 'inherit'],
        });
      } catch {
        console.error("Error playing cast. Is 'asciinema' installed?");
      }

      currentIndex = action.slideIndex;

      console.log('\n\x1b[32m(Demo finished. Press ENTER to return to slides...)\x1b[0m');
      const buf = new Uint8Array(10);
      fs.readSync(process.stdin.fd, buf);
    }
  }
}

main();
