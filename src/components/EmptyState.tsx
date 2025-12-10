import React, { memo } from 'react';
import { Box, Text } from 'ink';

type EmptyStateProps = {
  slidesDir: string;
};

/**
 * Shown when no slides are found in the directory.
 */
export const EmptyState = memo(function EmptyState({ slidesDir }: EmptyStateProps) {
  return (
    <Box flexDirection="column" padding={2}>
      <Text color="yellow">No slides found in {slidesDir}/</Text>
      <Text dimColor>Add .md or .cast files to the slides directory.</Text>
      <Text dimColor>Press q to quit.</Text>
    </Box>
  );
});
