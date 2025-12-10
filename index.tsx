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
import { parseArgs } from 'node:util';

// Configure marked for terminal output
marked.setOptions({
  renderer: new TerminalRenderer({
    reflowText: true,
    width: 80,
  }),
});

// --- Configuration ---
const VERSION = '1.0.0';
const DEFAULT_SLIDES_DIR = './slides';

// --- Types ---
type Slide =
  | { type: 'markdown'; content: string; title: string; filename: string }
  | { type: 'cast'; path: string; title: string; filename: string };

type AppAction =
  | { type: 'quit' }
  | { type: 'play'; path: string; slideIndex: number };

// --- CLI Argument Parsing ---
interface ParsedArgs {
  slidesDir: string;
  startAt: number;
  showHelp: boolean;
  showVersion: boolean;
}

const showHelp = () => {
  console.log(`
slides-cli - Terminal-based presentation tool

Usage:
  bun run index.tsx [options] [slides-directory]

Arguments:
  slides-directory    Path to slides directory (default: ./slides)

Options:
  -s, --start-at <n>  Start at slide number (1-indexed, default: 1)
  -h, --help          Show this help message
  -v, --version       Show version number

Examples:
  bun run index.tsx                      # Use ./slides directory
  bun run index.tsx ./my-talk            # Use custom directory
  bun run index.tsx --start-at=5         # Start at slide 5
  bun run index.tsx ./presentations -s 3 # Custom dir, start at slide 3
`);
};

const showVersion = () => {
  console.log(`slides-cli v${VERSION}`);
};

const parseCliArgs = (): ParsedArgs => {
  try {
    const { values, positionals } = parseArgs({
      args: Bun.argv.slice(2),
      options: {
        'start-at': {
          type: 'string',
          short: 's',
        },
        help: {
          type: 'boolean',
          short: 'h',
        },
        version: {
          type: 'boolean',
          short: 'v',
        },
      },
      allowPositionals: true,
    });

    // Get slides directory from positional argument or default
    const slidesDir = positionals[0] || DEFAULT_SLIDES_DIR;

    // Parse start-at value (convert from 1-indexed to 0-indexed)
    let startAt = 0;
    if (values['start-at']) {
      const parsed = parseInt(values['start-at'], 10);
      if (isNaN(parsed) || parsed < 1) {
        console.error(`Error: --start-at must be a positive integer (got: ${values['start-at']})`);
        process.exit(1);
      }
      startAt = parsed - 1; // Convert to 0-indexed
    }

    return {
      slidesDir,
      startAt,
      showHelp: values.help ?? false,
      showVersion: values.version ?? false,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error parsing arguments: ${error.message}`);
    }
    console.error('Run with --help for usage information.');
    process.exit(1);
  }
};

// --- Path Validation ---
const validateSlidesDir = (slidesDir: string): void => {
  // Resolve to absolute path
  const resolvedPath = path.resolve(slidesDir);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Slides directory not found: ${resolvedPath}`);
    console.error('');
    console.error('Please provide a valid path to a directory containing .md or .cast files.');
    process.exit(1);
  }

  const stats = fs.statSync(resolvedPath);
  if (!stats.isDirectory()) {
    console.error(`Error: Path is not a directory: ${resolvedPath}`);
    process.exit(1);
  }

  // Check if directory contains any slides
  const slides = globSync(`${resolvedPath}/*.{md,cast}`);
  if (slides.length === 0) {
    console.error(`Error: No slides found in: ${resolvedPath}`);
    console.error('');
    console.error('The directory should contain .md (Markdown) or .cast (Asciinema) files.');
    console.error('Files are sorted alphabetically, so prefix them with numbers (e.g., 01_intro.md).');
    process.exit(1);
  }
};

// --- Helper: Load Slides ---
const loadSlides = (slidesDir: string): Slide[] => {
  const resolvedPath = path.resolve(slidesDir);

  return globSync(`${resolvedPath}/*.{md,cast}`)
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
        return { type: 'cast', path: filePath, title, filename };
      }
      return {
        type: 'markdown',
        content: fs.readFileSync(filePath, 'utf-8'),
        title,
        filename,
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
}: {
  slides: Slide[];
  initialIndex: number;
  onExit: (a: AppAction) => void;
}) => {
  const { exit } = useApp();
  const [index, setIndex] = useState(initialIndex);
  const currentSlide = slides[index];

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

// --- Supervisor (The Main Loop) ---
async function main() {
  // Parse CLI arguments
  const args = parseCliArgs();

  // Handle --help flag
  if (args.showHelp) {
    showHelp();
    process.exit(0);
  }

  // Handle --version flag
  if (args.showVersion) {
    showVersion();
    process.exit(0);
  }

  // Validate slides directory
  validateSlidesDir(args.slidesDir);

  // Load slides from the specified directory
  const slides = loadSlides(args.slidesDir);

  // Validate start-at index
  if (args.startAt >= slides.length) {
    console.error(`Error: --start-at value ${args.startAt + 1} exceeds total slides (${slides.length})`);
    process.exit(1);
  }

  let currentIndex = args.startAt;
  let running = true;

  while (running) {
    console.clear();

    // 1. Run the React App and wait for it to exit with an action
    const action = await new Promise<AppAction>((resolve) => {
      const instance = render(
        <App slides={slides} initialIndex={currentIndex} onExit={resolve} />
      );
      // Fallback if the app exits without calling onExit (e.g. Ctrl+C)
      instance.waitUntilExit().then(() => resolve({ type: 'quit' }));
    });

    // 2. Handle the Action
    if (action.type === 'quit') {
      running = false;
      console.clear();
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
