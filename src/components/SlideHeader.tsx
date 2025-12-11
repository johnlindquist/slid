import React, { memo } from 'react';
import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import type { AppTheme } from '../utils/themes.js';

export const BIGTEXT_FONTS = [
  'block',
  'slick',
  'tiny',
  'grid',
  'pallet',
  'shade',
  'simple',
  'simpleBlock',
  '3d',
  'simple3d',
  'chrome',
  'huge',
] as const;

export type BigTextFont = (typeof BIGTEXT_FONTS)[number];

type SlideHeaderProps = {
  text: string;
  terminalWidth: number;
  contentWidth: number;
  theme: AppTheme;
  font?: BigTextFont;
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
  font = 'tiny',
}: SlideHeaderProps) {
  // Always use BigText - disable length-based fallback
  const useBigText = true;

  return (
    <Box alignItems="center">
      {useBigText ? (
        <Gradient name={theme.colors.header.gradient}>
          <BigText text={text} font={font} />
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
