import React, { memo } from 'react';
import { Box, Text } from 'ink';
import type { AppTheme } from '../utils/themes.js';

type FooterProps = {
  terminalWidth: number;
  slideIndex: number;
  totalSlides: number;
  hasReloaded: boolean;
  theme: AppTheme;
  currentFont?: string;
};

/**
 * Renders the presentation footer with navigation hints and slide counter.
 */
export const Footer = memo(function Footer({
  terminalWidth,
  slideIndex,
  totalSlides,
  hasReloaded,
  theme,
  currentFont,
}: FooterProps) {
  return (
    <Box justifyContent="space-between">
      <Text color={theme.colors.ui.dim}> ←→ nav  ↑↓ scroll  f font  t theme  tab overview  q quit</Text>
      <Text color={theme.colors.ui.dim}>
        {hasReloaded ? '● ' : ''}
        {slideIndex + 1}/{totalSlides}
      </Text>
    </Box>
  );
});
