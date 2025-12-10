import React, { memo } from 'react';
import { Box, Text, useInput } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import type { CastSlide as CastSlideType } from '../types/index.js';
import type { AppTheme } from '../utils/themes.js';

type CastSlideProps = {
  slide: CastSlideType;
  isActive: boolean;
  onPlay: () => void;
  theme: AppTheme;
};

/**
 * Renders a cast (asciinema recording) slide placeholder.
 */
export const CastSlide = memo(function CastSlide({
  slide,
  isActive,
  onPlay,
  theme,
}: CastSlideProps) {
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
      borderColor={theme.colors.ui.border}
    >
      <Gradient name={theme.colors.header.gradient}>
        <BigText text="DEMO" font="block" />
      </Gradient>
      <Text bold color={theme.colors.ui.highlight}>
        {slide.title}
      </Text>
      <Box marginTop={2} padding={1} borderStyle="single" borderColor={theme.colors.ui.highlight}>
        <Text color={theme.colors.ui.text}>PRESS [SPACE] TO PLAY RECORDING</Text>
      </Box>
    </Box>
  );
});
