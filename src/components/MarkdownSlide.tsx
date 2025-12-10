import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import type { MarkdownSlide as MarkdownSlideType } from '../types/index.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { renderMarkdown, parseFragments } from '../utils/markdown.js';
import { processMarkdownWithImages, hasImages } from '../utils/images.js';
import { SlideHeader } from './SlideHeader.js';
import { ScrollIndicator } from './ScrollIndicator.js';

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

type MarkdownSlideProps = {
  slide: MarkdownSlideType;
  isActive: boolean;
  step: number;
  totalSteps: number;
};

/**
 * Renders a markdown slide with scrolling, fragments, and image support.
 */
export const MarkdownSlide = memo(function MarkdownSlide({
  slide,
  isActive,
  step,
  totalSteps,
}: MarkdownSlideProps) {
  const [scrollY, setScrollY] = useState(0);
  const [processedContent, setProcessedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const contentLinesRef = useRef<number>(0);
  const { width: terminalWidth, height: terminalHeight } = useTerminalSize();

  // Calculate viewport dimensions
  const headerHeight = 4;
  const viewportHeight = Math.max(5, terminalHeight - headerHeight - 2);
  const contentWidth = Math.min(terminalWidth - 4, 80);

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

  // Process images asynchronously
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const processContent = async () => {
      try {
        const maxImageWidth = Math.min(contentWidth - 4, 80);
        const maxImageHeight = Math.floor(viewportHeight * 0.6);

        let finalContent: string;
        if (hasImages(visibleContent)) {
          const contentWithImages = await processMarkdownWithImages(
            visibleContent,
            slide.slideDir,
            maxImageWidth,
            maxImageHeight
          );
          finalContent = renderMarkdown(contentWithImages);
        } else {
          finalContent = renderMarkdown(visibleContent);
        }

        if (!cancelled) {
          setProcessedContent(finalContent);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setProcessedContent(renderMarkdown(visibleContent));
          setIsLoading(false);
        }
      }
    };

    processContent();

    return () => {
      cancelled = true;
    };
  }, [slide.filename, visibleContent, contentWidth, viewportHeight, slide.slideDir]);

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
    <Box flexDirection="column" width={terminalWidth} paddingLeft={leftPadding}>
      <Box flexDirection="column" width={dynamicWidth}>
        <SlideHeader
          text={headerText}
          terminalWidth={terminalWidth}
          contentWidth={dynamicWidth}
        />

        <Box height={viewportHeight} flexDirection="column" alignItems="center" overflow="hidden">
          <Box paddingX={2}>
            <Text>{visibleLines.join('\n')}</Text>
          </Box>
        </Box>

        <ScrollIndicator
          scrollY={scrollY}
          viewportHeight={viewportHeight}
          totalLines={contentLines.length}
          isLoading={isLoading}
          step={step}
          totalSteps={totalSteps}
        />
      </Box>
    </Box>
  );
});
