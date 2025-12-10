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
import terminalImage from 'terminal-image';

// Configure marked for terminal output
marked.setOptions({
  renderer: new TerminalRenderer({
    reflowText: true,
    width: 80,
  }),
});

// --- Configuration ---
const SLIDES_DIR = './slides';

// --- Types ---
type Slide =
  | { type: 'markdown'; content: string; title: string; filename: string; slideDir: string }
  | { type: 'cast'; path: string; title: string; filename: string };

// --- Image Types ---
type ImageRef = {
  fullMatch: string;
  altText: string;
  imagePath: string;
};

// --- Image Parsing ---
const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

const parseImageReferences = (content: string): ImageRef[] => {
  const images: ImageRef[] = [];
  let match;
  while ((match = IMAGE_REGEX.exec(content)) !== null) {
    images.push({
      fullMatch: match[0],
      altText: match[1] || 'Image',
      imagePath: match[2] || '',
    });
  }
  return images;
};

// --- Resolve Image Path ---
const resolveImagePath = (imagePath: string, slideDir: string): string => {
  // Handle absolute paths
  if (path.isAbsolute(imagePath)) {
    return imagePath;
  }
  // Handle URLs (skip them for now)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Resolve relative paths against slide directory
  return path.resolve(slideDir, imagePath);
};

// --- Check if terminal supports images ---
const checkTerminalImageSupport = (): boolean => {
  const env = process.env;
  // iTerm2
  if (env.TERM_PROGRAM === 'iTerm.app') return true;
  // Kitty and similar
  if (env.TERM === 'xterm-kitty' || env.KITTY_WINDOW_ID) return true;
  // WezTerm
  if (env.TERM_PROGRAM === 'WezTerm') return true;
  // Konsole
  if (env.KONSOLE_VERSION) return true;
  // VS Code terminal (limited support)
  if (env.TERM_PROGRAM === 'vscode') return true;
  // Ghostty
  if (env.TERM_PROGRAM === 'ghostty' || env.GHOSTTY_RESOURCES_DIR) return true;
  // Default: assume ANSI fallback will work
  return true;
};

// --- Render image to terminal string ---
const renderImageToString = async (
  imagePath: string,
  altText: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> => {
  try {
    // Skip URLs for now
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return `[Image: ${altText}] (${imagePath})`;
    }

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return `[Image not found: ${altText}] (${imagePath})`;
    }

    // Determine if it's a GIF
    const isGif = imagePath.toLowerCase().endsWith('.gif');

    if (isGif) {
      // For GIFs, just render the first frame as a static image
      const buffer = await Bun.file(imagePath).arrayBuffer();
      const result = await terminalImage.buffer(new Uint8Array(buffer), {
        width: maxWidth,
        height: maxHeight,
        preserveAspectRatio: true,
      });
      return result || `[GIF: ${altText}]`;
    }

    // Render static image
    const result = await terminalImage.file(imagePath, {
      width: maxWidth,
      height: maxHeight,
      preserveAspectRatio: true,
    });
    return result || `[Image: ${altText}]`;
  } catch (error) {
    // Graceful fallback
    return `[Image: ${altText}] (failed to render)`;
  }
};

// --- Process markdown content and replace images ---
const processMarkdownWithImages = async (
  content: string,
  slideDir: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> => {
  const images = parseImageReferences(content);

  if (images.length === 0) {
    return content;
  }

  let processedContent = content;

  for (const img of images) {
    const resolvedPath = resolveImagePath(img.imagePath, slideDir);
    const renderedImage = await renderImageToString(
      resolvedPath,
      img.altText,
      maxWidth,
      maxHeight
    );
    // Replace the markdown image syntax with the rendered image
    // We use a placeholder that won't be affected by marked's rendering
    processedContent = processedContent.replace(
      img.fullMatch,
      `\n${renderedImage}\n`
    );
  }

  return processedContent;
};

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
      const slideDir = path.resolve(path.dirname(filePath));
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
        slideDir,
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
  const [processedContent, setProcessedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // Process images asynchronously
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const processContent = async () => {
      try {
        // Calculate max image dimensions (leave room for borders and padding)
        const maxImageWidth = Math.min(contentWidth - 4, 80);
        const maxImageHeight = Math.floor(viewportHeight * 0.6); // Images take up to 60% of viewport height

        // Check if content has images
        const hasImages = IMAGE_REGEX.test(contentWithoutHeader);
        IMAGE_REGEX.lastIndex = 0; // Reset regex state

        let finalContent: string;
        if (hasImages) {
          // Process images first, then render markdown
          const contentWithImages = await processMarkdownWithImages(
            contentWithoutHeader,
            slide.slideDir,
            maxImageWidth,
            maxImageHeight
          );
          finalContent = renderMarkdown(contentWithImages);
        } else {
          finalContent = renderMarkdown(contentWithoutHeader);
        }

        if (!cancelled) {
          setProcessedContent(finalContent);
          setIsLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setProcessedContent(renderMarkdown(contentWithoutHeader));
          setIsLoading(false);
        }
      }
    };

    processContent();

    return () => {
      cancelled = true;
    };
  }, [slide.filename, slide.content, contentWidth, viewportHeight]);

  // While loading, show loading indicator or cached content
  const displayContent = isLoading
    ? processedContent || 'Loading...'
    : processedContent || '';

  const contentLines = displayContent.split('\n');

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
          {isLoading ? ' (loading images...)' : ''}
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
