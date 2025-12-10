import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp, useStdout } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import { globSync } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'bun';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import type { ServerWebSocket } from 'bun';

// Configure marked for terminal output
marked.setOptions({
  renderer: new TerminalRenderer({
    reflowText: true,
    width: 80,
  }),
});

// --- Configuration ---
const SLIDES_DIR = './slides';
const PRESENTER_PORT = 3333;

// --- CLI Args ---
const args = process.argv.slice(2);
const presenterMode = args.includes('--presenter');

// --- Types ---
type Slide =
  | { type: 'markdown'; content: string; title: string; filename: string; notes: string }
  | { type: 'cast'; path: string; title: string; filename: string; notes: string };

type AppAction =
  | { type: 'quit' }
  | { type: 'play'; path: string; slideIndex: number };

// --- Presenter Mode Types ---
type PresenterMessage = {
  type: 'slide';
  slideIndex: number;
  totalSlides: number;
  title: string;
  notes: string;
  nextTitle: string | null;
};

// --- Helper: Parse Speaker Notes ---
const parseNotes = (content: string): string => {
  const notesMatch = content.match(/<!--\s*notes:\s*([\s\S]*?)\s*-->/i);
  return notesMatch ? notesMatch[1].trim() : '';
};

// --- Helper: Remove Notes from Content ---
const stripNotes = (content: string): string => {
  return content.replace(/<!--\s*notes:\s*[\s\S]*?\s*-->/gi, '').trim();
};

// --- Helper: Load Slides ---
const loadSlides = (): Slide[] => {
  if (!fs.existsSync(SLIDES_DIR)) {
    fs.mkdirSync(SLIDES_DIR);
    fs.writeFileSync(
      path.join(SLIDES_DIR, '01_intro.md'),
      '# Welcome\n\nPress Space to scroll, arrows to navigate.'
    );
  }

  return globSync(`${SLIDES_DIR}/*.{md,cast}`)
    .sort()
    .map((filePath) => {
      const ext = path.extname(filePath);
      const filename = path.basename(filePath);
      // Cleanup title: "01_Intro.md" -> "Intro"
      const title = filename
        .replace(ext, '')
        .replace(/^\d+[_-]/, '')
        .replace(/[_-]/g, ' ');

      if (ext === '.cast') {
        return { type: 'cast', path: filePath, title, filename, notes: '' };
      }
      const rawContent = fs.readFileSync(filePath, 'utf-8');
      const notes = parseNotes(rawContent);
      const content = stripNotes(rawContent);
      return {
        type: 'markdown',
        content,
        title,
        filename,
        notes,
      };
    });
};

// --- Component: Render Markdown to terminal ---
const renderMarkdown = (content: string): string => {
  return marked.parse(content) as string;
};

// --- Component: Scrollable Markdown ---
const MarkdownSlide = ({
  slide,
  isActive,
}: {
  slide: Slide & { type: 'markdown' };
  isActive: boolean;
}) => {
  const [scrollY, setScrollY] = useState(0);
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 80;
  const terminalHeight = stdout?.rows || 24;
  const viewportHeight = terminalHeight - 10; // Reserve space for header/footer
  const contentWidth = Math.min(terminalWidth - 8, 100); // Fixed width with max cap

  useInput((input, key) => {
    if (!isActive) return;
    if (key.upArrow) setScrollY((y) => Math.max(0, y - 1));
    if (key.downArrow) setScrollY((y) => y + 1);
    if (input === ' ') setScrollY((y) => y + 5); // Page down
  });

  // Reset scroll on slide change
  useEffect(() => setScrollY(0), [slide.filename]);

  // Extract the first # Header to display as BigText
  const lines = slide.content.split('\n');
  const bigHeader =
    lines.find((l) => l.startsWith('# '))?.replace('# ', '') || slide.title;

  // Remove the first header from content for rendering (we show it as BigText)
  const contentWithoutHeader = slide.content.replace(/^#\s+.+\n?/, '');
  const renderedContent = renderMarkdown(contentWithoutHeader);
  const contentLines = renderedContent.split('\n');

  // Get visible lines based on scroll position
  const visibleLines = contentLines.slice(scrollY, scrollY + viewportHeight);

  return (
    <Box flexDirection="column" alignItems="center" flexGrow={1} paddingTop={2} width="100%">
      <Box flexDirection="column" alignItems="center" marginBottom={1} width={contentWidth}>
        <Gradient name="cristal">
          <BigText text={bigHeader} font="tiny" />
        </Gradient>
      </Box>

      <Box
        height={viewportHeight}
        width={contentWidth}
        flexDirection="column"
        borderStyle="round"
        borderColor="gray"
        paddingX={1}
        overflow="hidden"
      >
        <Text>{visibleLines.join('\n')}</Text>
      </Box>

      <Box marginTop={1} justifyContent="center" width={contentWidth}>
        <Text dimColor>
          {scrollY > 0 ? '↑ ' : '  '} Line: {scrollY + 1}/
          {Math.max(1, contentLines.length)}{' '}
          {scrollY + viewportHeight < contentLines.length ? ' ↓' : '  '}
        </Text>
      </Box>
    </Box>
  );
};

// --- Component: Cast Placeholder ---
const CastSlide = ({
  slide,
  isActive,
  onPlay,
}: {
  slide: Slide & { type: 'cast' };
  isActive: boolean;
  onPlay: () => void;
}) => {
  useInput((input, key) => {
    if (!isActive) return;
    if (input === ' ' || key.return) onPlay();
  });

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      borderStyle="double"
      borderColor="magenta"
    >
      <Gradient name="morning">
        <BigText text="DEMO" font="block" />
      </Gradient>
      <Text bold color="magenta">
        {slide.title}
      </Text>
      <Box marginTop={2} padding={1} borderStyle="single" borderColor="green">
        <Text>PRESS [SPACE] TO PLAY RECORDING</Text>
      </Box>
    </Box>
  );
};

// --- React App (The UI) ---
const App = ({
  slides,
  initialIndex,
  onExit,
  onSlideChange,
}: {
  slides: Slide[];
  initialIndex: number;
  onExit: (a: AppAction) => void;
  onSlideChange?: (index: number) => void;
}) => {
  const { exit } = useApp();
  const [index, setIndex] = useState(initialIndex);
  const currentSlide = slides[index];

  // Notify presenter view of slide changes
  useEffect(() => {
    onSlideChange?.(index);
  }, [index, onSlideChange]);

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onExit({ type: 'quit' });
      exit();
    }
    if (key.leftArrow) setIndex((i) => Math.max(0, i - 1));
    if (key.rightArrow) setIndex((i) => Math.min(slides.length - 1, i + 1));
  });

  const handlePlay = () => {
    if (currentSlide.type === 'cast') {
      onExit({ type: 'play', path: currentSlide.path, slideIndex: index });
      exit(); // Quit React so Asciinema can take over
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Box flexGrow={1} alignItems="center">
        {currentSlide.type === 'markdown' ? (
          <MarkdownSlide slide={currentSlide} isActive={true} />
        ) : (
          <CastSlide slide={currentSlide} isActive={true} onPlay={handlePlay} />
        )}
      </Box>

      <Box justifyContent="space-between" paddingX={2} borderStyle="single" borderColor="gray">
        <Text dimColor>←/→ Nav | ↑/↓/Space: Scroll | q: Quit</Text>
        <Text dimColor>Slide {index + 1}/{slides.length}</Text>
      </Box>
    </Box>
  );
};

// --- Presenter Mode: WebSocket Server ---
let presenterServer: ReturnType<typeof Bun.serve> | null = null;
const connectedClients = new Set<ServerWebSocket<unknown>>();
let presentationStartTime: number | null = null;

const startPresenterServer = (slides: Slide[]) => {
  const presenterHtml = fs.readFileSync(
    path.join(import.meta.dir, 'presenter.html'),
    'utf-8'
  );

  presenterServer = Bun.serve({
    port: PRESENTER_PORT,
    fetch(req, server) {
      const url = new URL(req.url);

      // WebSocket upgrade
      if (url.pathname === '/ws') {
        const upgraded = server.upgrade(req);
        if (!upgraded) {
          return new Response('WebSocket upgrade failed', { status: 400 });
        }
        return;
      }

      // Serve presenter HTML
      return new Response(presenterHtml, {
        headers: { 'Content-Type': 'text/html' },
      });
    },
    websocket: {
      open(ws) {
        connectedClients.add(ws);
        // Send init message with start time
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
  console.log(`\x1b[36m[Presenter Mode]\x1b[0m Open in browser: \x1b[33mhttp://localhost:${PRESENTER_PORT}\x1b[0m`);
  console.log('\x1b[2mPress any key to start presentation...\x1b[0m');

  // Wait for keypress before starting
  const buf = new Uint8Array(10);
  fs.readSync(process.stdin.fd, buf);
};

const broadcastSlideChange = (slides: Slide[], index: number) => {
  const currentSlide = slides[index];
  const nextSlide = slides[index + 1];

  const message: PresenterMessage = {
    type: 'slide',
    slideIndex: index,
    totalSlides: slides.length,
    title: currentSlide.title,
    notes: currentSlide.notes,
    nextTitle: nextSlide?.title || null,
  };

  const messageStr = JSON.stringify(message);
  for (const client of connectedClients) {
    client.send(messageStr);
  }
};

const stopPresenterServer = () => {
  if (presenterServer) {
    presenterServer.stop();
    presenterServer = null;
  }
  connectedClients.clear();
};

// --- Supervisor (The Main Loop) ---
async function main() {
  const slides = loadSlides();
  let currentIndex = 0;
  let running = true;

  // Start presenter server if --presenter flag is provided
  if (presenterMode) {
    startPresenterServer(slides);
  }

  while (running) {
    console.clear();

    // Create slide change handler for presenter mode
    const handleSlideChange = presenterMode
      ? (index: number) => broadcastSlideChange(slides, index)
      : undefined;

    // 1. Run the React App and wait for it to exit with an action
    const action = await new Promise<AppAction>((resolve) => {
      const instance = render(
        <App
          slides={slides}
          initialIndex={currentIndex}
          onExit={resolve}
          onSlideChange={handleSlideChange}
        />
      );
      // Fallback if the app exits without calling onExit (e.g. Ctrl+C)
      instance.waitUntilExit().then(() => resolve({ type: 'quit' }));
    });

    // 2. Handle the Action
    if (action.type === 'quit') {
      running = false;
      console.clear();
      stopPresenterServer();
    } else if (action.type === 'play') {
      // Clean up the terminal before starting asciinema
      console.clear();

      try {
        // Run asciinema natively with full TTY control
        // -i 2 limits idle pauses to 2 seconds
        spawnSync(['asciinema', 'play', '-i', '2', action.path], {
          stdio: 'inherit',
        });
      } catch (e) {
        console.error("Error playing cast. Is 'asciinema' installed?");
      }

      // Preserve state: ensure we come back to the same slide
      currentIndex = action.slideIndex;

      // Small pause so the user can see the demo ended
      console.log(
        '\n\x1b[32m(Demo finished. Press ENTER to return to slides...)\x1b[0m'
      );
      const buf = new Uint8Array(10);
      fs.readSync(process.stdin.fd, buf);
    }
  }
}

main();
