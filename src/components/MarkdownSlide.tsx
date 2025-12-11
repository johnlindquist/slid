import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import type { MarkdownSlide as MarkdownSlideType } from '../types';
import { useTerminalSize } from '../hooks/useTerminalSize';
import { createMarkdownRenderer, parseFragments } from '../utils/markdown';
import { processMarkdownWithImages, hasImages, injectImages } from '../utils/images';
import { SlideHeader, type BigTextFont } from './SlideHeader';
import { ScrollIndicator } from './ScrollIndicator';
import type { AppTheme } from '../utils/themes';

// Strip ANSI escape codes to measure actual visible width
const stripAnsi = (str: string): string =>
  str.replace(/\u001B\[[0-9;]*m/g, '');

// Measure the widest line in text (after stripping ANSI codes)
const measureTextWidth = (text: string): number => {
  const lines = text.split('\n');
  return Math.max(...lines.map((line) => stripAnsi(line).length), 0);
};

// Estimate BigText width (tiny font is ~5 chars per letter)
const estimateBigTextWidth = (text: string): number => text.length * 5;

// Estimate BigText height based on font (approximate line counts)
const estimateBigTextHeight = (font: BigTextFont): number => {
  const heights: Record<BigTextFont, number> = {
    tiny: 5,
    simple: 5,
    slick: 6,
    grid: 6,
    pallet: 6,
    shade: 6,
    block: 8,
    simpleBlock: 8,
    '3d': 8,
    simple3d: 8,
    chrome: 8,
    huge: 10,
  };
  return heights[font] ?? 7;
};

type MarkdownSlideProps = {
  slide: MarkdownSlideType;
  isActive: boolean;
  step: number;
  totalSteps: number;
  theme: AppTheme;
  headerFont?: BigTextFont;
};

/**
 * Renders a markdown slide with scrolling, fragments, and image support.
 */
export const MarkdownSlide = memo(function MarkdownSlide({
  slide,
  isActive,
  step,
  totalSteps,
  theme,
  headerFont,
}: MarkdownSlideProps) {
  const [scrollY, setScrollY] = useState(0);
  const [processedContent, setProcessedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const contentLinesRef = useRef<number>(0);
  const { width: terminalWidth, height: terminalHeight } = useTerminalSize();

  // Calculate viewport dimensions accounting for fixed elements:
  // - 1 line for footer (reserved by parent)
  // - 1 line for padding above header
  // - BigText header height (varies by font)
  // - 1 line for ScrollIndicator
  const headerHeightEstimate = estimateBigTextHeight(headerFont ?? 'tiny');
  const fixedOverhead = 1 + 1 + headerHeightEstimate + 1; // footer + padding + header + scroll indicator
  const viewportHeight = Math.max(5, terminalHeight - fixedOverhead);

  // Handle scroll input
  useInput((input, key) => {
    if (!isActive) return;
    const maxScroll = Math.max(0, contentLinesRef.current - viewportHeight);
    if (key.upArrow) setScrollY((y) => Math.max(0, y - 1));
    if (key.downArrow) setScrollY((y) => Math.min(maxScroll, y + 1));
    if (input === ' ') setScrollY((y) => Math.min(maxScroll, y + 5));
  });

  // Reset scroll on slide change
  useEffect(() => {
    setScrollY(0);
  }, [slide.filename]);

  // Parse header text
  const lines = slide.content.split('\n');
  const contentHeader = lines.find((l) => l.startsWith('# '))?.replace('# ', '');
  const headerText = slide.metadata.title || contentHeader || slide.title;

  // Remove header and parse fragments
  const contentWithoutHeader = slide.content.replace(/^#\s+.+\n?/, '');
  const fragments = parseFragments(contentWithoutHeader);
  const visibleContent = fragments.slice(0, step + 1).join('\n\n');

  // Process images asynchronously with themed renderer
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const processContent = async () => {
      // Create renderer for current theme
      const render = createMarkdownRenderer(theme);

      try {
        // FIX: Calculate exact max width available for images based on layout.
        // We use 66% of terminal width for the container.
        const containerWidth = Math.floor(terminalWidth * 0.66);
        // Subtract 6 for padding to prevent wrapping
        const availableWidth = Math.max(20, containerWidth - 6);
        // Cap at 80 to maintain standard text-column feel on large screens
        const maxImageWidth = Math.min(availableWidth, 80);

        const maxImageHeight = Math.floor(viewportHeight * 0.6);

        let finalContent: string;

        if (hasImages(visibleContent)) {
          // 1. Get content with placeholders (prevents markdown parser from mangling images)
          const { content: contentWithPlaceholders, replacements } = await processMarkdownWithImages(
            visibleContent,
            slide.slideDir,
            maxImageWidth,
            maxImageHeight
          );

          // 2. Render markdown first (placeholders are treated as safe text blocks)
          const renderedMarkdown = render(contentWithPlaceholders);

          // 3. Swap placeholders with the actual ANSI image strings
          finalContent = injectImages(renderedMarkdown, replacements);
        } else {
          finalContent = render(visibleContent);
        }

        if (!cancelled) {
          setProcessedContent(finalContent);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          const render = createMarkdownRenderer(theme);
          setProcessedContent(render(visibleContent));
          setIsLoading(false);
        }
      }
    };

    processContent();

    return () => {
      cancelled = true;
    };
  }, [slide.filename, visibleContent, terminalWidth, viewportHeight, slide.slideDir, theme]);

  const displayContent = isLoading ? processedContent || 'Loading...' : processedContent || '';
  const contentLines = displayContent.split('\n');
  contentLinesRef.current = contentLines.length;

  const visibleLines = contentLines.slice(scrollY, scrollY + viewportHeight);

  // Measure actual content width and calculate dynamic container size
  const maxBigTextChars = Math.floor(terminalWidth / 5) - 2;
  const useBigText = headerText.length <= maxBigTextChars;

  const dynamicWidth = useMemo(() => {
    const measuredContentWidth = measureTextWidth(displayContent);
    const headerWidth = useBigText
      ? estimateBigTextWidth(headerText)
      : headerText.length + 4;

    // Container = max of header and content, plus padding for content
    const neededWidth = Math.max(measuredContentWidth + 4, headerWidth);
    // Cap at 66% of terminal width for better presentation readability
    const maxWidth = Math.floor(terminalWidth * 0.66);
    return Math.min(Math.max(neededWidth, 40), maxWidth);
  }, [displayContent, headerText, useBigText, terminalWidth]);

  const leftPadding = Math.floor((terminalWidth - dynamicWidth) / 2);

  return (
    <Box flexDirection="column" width={terminalWidth} height="100%" overflow="hidden">
      {/* One line of padding above header */}
      <Text> </Text>
      {/* Header rendered at full terminal width, centered */}
      <Box justifyContent="center" width={terminalWidth}>
        <SlideHeader
          text={headerText}
          terminalWidth={terminalWidth}
          contentWidth={terminalWidth}
          theme={theme}
          font={headerFont}
        />
      </Box>
      {/* Content constrained to dynamicWidth for readability */}
      <Box flexDirection="column" width={dynamicWidth} marginLeft={leftPadding} flexGrow={1} overflow="hidden">
        <Box flexGrow={1} flexDirection="column" overflow="hidden">
          <Text>{visibleLines.join('\n')}</Text>
        </Box>

        <ScrollIndicator
          scrollY={scrollY}
          viewportHeight={viewportHeight}
          totalLines={contentLines.length}
          isLoading={isLoading}
          step={step}
          totalSteps={totalSteps}
          theme={theme}
        />
      </Box>
    </Box>
  );
});
