import React, { memo } from 'react';
import { Box, Text, useInput } from 'ink';
import Gradient from 'ink-gradient';
import type { Slide } from '../types/index.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import type { AppTheme } from '../utils/themes.js';

type OverviewModeProps = {
  slides: Slide[];
  currentIndex: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
  theme: AppTheme;
};

type SlideCardProps = {
  slide: Slide;
  slideNum: number;
  isSelected: boolean;
  isCurrent: boolean;
  itemWidth: number;
  theme: AppTheme;
};

const SlideCard = memo(function SlideCard({
  slide,
  slideNum,
  isSelected,
  isCurrent,
  itemWidth,
  theme,
}: SlideCardProps) {
  const truncatedTitle =
    slide.title.length > itemWidth - 6
      ? slide.title.slice(0, itemWidth - 9) + '...'
      : slide.title;

  return (
    <Box
      width={itemWidth}
      borderStyle={isSelected ? 'bold' : 'single'}
      borderColor={isSelected ? theme.colors.ui.border : isCurrent ? theme.colors.ui.highlight : theme.colors.ui.dim}
      paddingX={1}
      marginRight={1}
    >
      <Box flexDirection="column">
        <Box>
          <Text
            color={isSelected ? theme.colors.ui.border : isCurrent ? theme.colors.ui.highlight : theme.colors.ui.text}
            bold={isSelected}
          >
            {slideNum.toString().padStart(2, '0')}
          </Text>
          <Text color={theme.colors.ui.dim}> {slide.type === 'cast' ? '[DEMO]' : ''}</Text>
        </Box>
        <Text color={isSelected ? theme.colors.ui.border : theme.colors.ui.text} wrap="truncate">
          {truncatedTitle}
        </Text>
      </Box>
    </Box>
  );
});

/**
 * Renders a grid overview of all slides for quick navigation.
 */
export const OverviewMode = memo(function OverviewMode({
  slides,
  currentIndex,
  selectedIndex,
  onSelect,
  theme,
}: OverviewModeProps) {
  const { width: terminalWidth, height: terminalHeight } = useTerminalSize();

  // Calculate grid dimensions
  const itemWidth = 30;
  const itemHeight = 3;
  const columns = Math.max(1, Math.floor((terminalWidth - 4) / (itemWidth + 2)));
  const maxRows = Math.floor((terminalHeight - 8) / itemHeight);
  const maxVisibleSlides = columns * maxRows;

  // Calculate scroll offset
  const selectedRow = Math.floor(selectedIndex / columns);
  const startRow = Math.max(0, selectedRow - Math.floor(maxRows / 2));
  const startIndex = startRow * columns;
  const visibleSlides = slides.slice(startIndex, startIndex + maxVisibleSlides);

  // Group slides into rows
  const rows: Slide[][] = [];
  for (let i = 0; i < visibleSlides.length; i += columns) {
    rows.push(visibleSlides.slice(i, i + columns));
  }

  useInput((_input, key) => {
    if (key.upArrow) {
      onSelect(Math.max(0, selectedIndex - columns));
    }
    if (key.downArrow) {
      onSelect(Math.min(slides.length - 1, selectedIndex + columns));
    }
    if (key.leftArrow) {
      onSelect(Math.max(0, selectedIndex - 1));
    }
    if (key.rightArrow) {
      onSelect(Math.min(slides.length - 1, selectedIndex + 1));
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} justifyContent="center">
        <Gradient name={theme.colors.header.gradient}>
          <Text bold>SLIDE OVERVIEW</Text>
        </Gradient>
        <Text color={theme.colors.ui.dim}> ({slides.length} slides)</Text>
      </Box>

      <Box flexDirection="column">
        {rows.map((row, rowIndex) => (
          <Box key={`row-${startIndex + rowIndex * columns}`}>
            {row.map((slide, colIndex) => {
              const absoluteIndex = startIndex + rowIndex * columns + colIndex;
              return (
                <SlideCard
                  key={`slide-${absoluteIndex}`}
                  slide={slide}
                  slideNum={absoluteIndex + 1}
                  isSelected={absoluteIndex === selectedIndex}
                  isCurrent={absoluteIndex === currentIndex}
                  itemWidth={itemWidth}
                  theme={theme}
                />
              );
            })}
          </Box>
        ))}
      </Box>

      {slides.length > maxVisibleSlides && (
        <Box marginTop={1} justifyContent="center">
          <Text color={theme.colors.ui.dim}>
            Showing {startIndex + 1}-
            {Math.min(startIndex + maxVisibleSlides, slides.length)} of {slides.length}
          </Text>
        </Box>
      )}
    </Box>
  );
});
