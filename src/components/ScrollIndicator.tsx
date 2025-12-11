import React, { memo } from 'react';
import { Box, Text } from 'ink';
import type { AppTheme } from '../utils/themes';

type ScrollIndicatorProps = {
  scrollY: number;
  viewportHeight: number;
  totalLines: number;
  isLoading: boolean;
  step?: number;
  totalSteps?: number;
  theme: AppTheme;
};

/**
 * Shows scroll position indicators and loading state.
 */
export const ScrollIndicator = memo(function ScrollIndicator({
  scrollY,
  viewportHeight,
  totalLines,
  isLoading,
  step,
  totalSteps,
  theme,
}: ScrollIndicatorProps) {
  const showSteps = totalSteps !== undefined && totalSteps > 1;

  return (
    <Box justifyContent="space-between">
      <Text color={theme.colors.ui.dim}>
        {scrollY > 0 ? '↑' : ' '}
        {scrollY + viewportHeight < totalLines ? '↓' : ' '}
        {isLoading ? ' …' : ''}
      </Text>
      {showSteps && (
        <Text color={theme.colors.ui.dim}>
          Step {(step ?? 0) + 1}/{totalSteps}
        </Text>
      )}
    </Box>
  );
});
