import React, { memo } from 'react';
import { Box, Text } from 'ink';
import type { AppTheme } from '../utils/themes.js';

type FooterProps = {
  terminalWidth: number;
  slideIndex: number;
  totalSlides: number;
  hasReloaded: boolean;
  theme: AppTheme;
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
}: FooterProps) {
  return (
    <Box flexDirection="column" paddingX={2}>
      <Text color={theme.colors.ui.dim}>{'─'.repeat(terminalWidth - 4)}</Text>
      <Box justifyContent="space-between">
        <Text color={theme.colors.ui.dim}>←→ nav  ↑↓ scroll  t theme  Tab overview  q quit</Text>
        <Text color={theme.colors.ui.dim}>
          {hasReloaded ? '● ' : ''}
          {slideIndex + 1}/{totalSlides}
        </Text>
      </Box>
    </Box>
  );
});
