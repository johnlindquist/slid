import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useInput, useApp, useStdout } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import { globSync } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'bun';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';

// Configure marked for terminal output
marked.setOptions({
  renderer: new TerminalRenderer({
    reflowText: true,
    width: 80,
  }),
});

// Fragment separator - uses HTML comment syntax that won't render
const FRAGMENT_SEPARATOR = /<!--\s*fragment\s*-->/gi;

// --- Configuration ---
const SLIDES_DIR = './slides';

// --- Types ---
type Slide =
  | { type: 'markdown'; content: string; title: string; filename: string }
  | { type: 'cast'; path: string; title: string; filename: string };

type AppAction =
  | { type: 'quit' }
  | { type: 'play'; path: string; slideIndex: number };

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

// --- Helper: Parse fragments from markdown content ---
const parseFragments = (content: string): string[] => {
  // Split content by fragment separator
  const fragments = content.split(FRAGMENT_SEPARATOR);
  // Filter out empty fragments and trim whitespace
  return fragments.map(f => f.trim()).filter(f => f.length > 0);
};

// --- Component: Render Markdown to terminal ---
const renderMarkdown = (content: string): string => {
  return marked.parse(content) as string;
};

// --- Component: Scrollable Markdown ---
const MarkdownSlide = ({
  slide,
  isActive,
  step,
  totalSteps,
  onStepChange,
}: {
  slide: Slide & { type: 'markdown' };
  isActive: boolean;
  step: number;
  totalSteps: number;
  onStepChange: (newStep: number) => void;
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

  // Parse fragments from the content
  const fragments = parseFragments(contentWithoutHeader);

  // Build visible content by joining fragments up to current step
  const visibleContent = fragments.slice(0, step + 1).join('\n\n');
  const renderedContent = renderMarkdown(visibleContent);
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

      <Box marginTop={1} justifyContent="space-between" width={contentWidth} paddingX={1}>
        <Text dimColor>
          {scrollY > 0 ? '↑ ' : '  '} Line: {scrollY + 1}/
          {Math.max(1, contentLines.length)}{' '}
          {scrollY + viewportHeight < contentLines.length ? ' ↓' : '  '}
        </Text>
        {totalSteps > 1 && (
          <Text color="cyan">
            Step {step + 1}/{totalSteps}
          </Text>
        )}
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

// --- Helper: Get total steps for a slide ---
const getSlideSteps = (slide: Slide): number => {
  if (slide.type !== 'markdown') return 1;
  const contentWithoutHeader = slide.content.replace(/^#\s+.+\n?/, '');
  const fragments = parseFragments(contentWithoutHeader);
  return Math.max(1, fragments.length);
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
  const [step, setStep] = useState(0);
  const currentSlide = slides[index];
  const totalSteps = getSlideSteps(currentSlide);

  // Reset step when changing slides
  useEffect(() => {
    setStep(0);
  }, [index]);

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onExit({ type: 'quit' });
      exit();
    }

    // Right arrow: advance step or go to next slide
    if (key.rightArrow) {
      if (step < totalSteps - 1) {
        // More steps remain on current slide - reveal next fragment
        setStep(s => s + 1);
      } else {
        // All steps visible - move to next slide
        if (index < slides.length - 1) {
          setIndex(i => i + 1);
        }
      }
    }

    // Left arrow: go back a step or to previous slide
    if (key.leftArrow) {
      if (step > 0) {
        // Hide last fragment
        setStep(s => s - 1);
      } else {
        // Go to previous slide (showing all its steps)
        if (index > 0) {
          const prevSlide = slides[index - 1];
          const prevSteps = getSlideSteps(prevSlide);
          setIndex(i => i - 1);
          // Show all steps of previous slide
          setTimeout(() => setStep(prevSteps - 1), 0);
        }
      }
    }
  });

  const handlePlay = () => {
    if (currentSlide.type === 'cast') {
      onExit({ type: 'play', path: currentSlide.path, slideIndex: index });
      exit(); // Quit React so Asciinema can take over
    }
  };

  const handleStepChange = useCallback((newStep: number) => {
    setStep(newStep);
  }, []);

  return (
    <Box flexDirection="column" height="100%">
      <Box flexGrow={1} alignItems="center">
        {currentSlide.type === 'markdown' ? (
          <MarkdownSlide
            slide={currentSlide}
            isActive={true}
            step={step}
            totalSteps={totalSteps}
            onStepChange={handleStepChange}
          />
        ) : (
          <CastSlide slide={currentSlide} isActive={true} onPlay={handlePlay} />
        )}
      </Box>

      <Box justifyContent="space-between" paddingX={2} borderStyle="single" borderColor="gray">
        <Text dimColor>←/→ Nav/Reveal | ↑/↓/Space: Scroll | q: Quit</Text>
        <Text dimColor>Slide {index + 1}/{slides.length}</Text>
      </Box>
    </Box>
  );
};

// --- Supervisor (The Main Loop) ---
async function main() {
  const slides = loadSlides();
  let currentIndex = 0;
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
