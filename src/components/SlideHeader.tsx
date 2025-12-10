import React, { memo } from 'react';
import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import type { AppTheme } from '../utils/themes.js';

type SlideHeaderProps = {
  text: string;
  terminalWidth: number;
  contentWidth: number;
  theme: AppTheme;
};

/**
 * Renders slide header with BigText for short titles,
 * or styled text box for longer titles.
 */
export const SlideHeader = memo(function SlideHeader({
  text,
  terminalWidth,
  contentWidth,
  theme,
}: SlideHeaderProps) {
  // BigText "tiny" font uses ~5 chars width per character
  const maxBigTextChars = Math.floor(terminalWidth / 5) - 2;
  const useBigText = text.length <= maxBigTextChars;

  return (
    <Box flexDirection="column" alignItems="center">
      {useBigText ? (
        <Gradient name={theme.colors.header.gradient}>
          <BigText text={text} font="tiny" />
        </Gradient>
      ) : (
        <Text bold color={theme.colors.header.fallback}>
          {'═'.repeat(Math.min(text.length + 4, contentWidth))}
          {'\n  '}
          {text}
          {'  \n'}
          {'═'.repeat(Math.min(text.length + 4, contentWidth))}
        </Text>
      )}
    </Box>
  );
});
