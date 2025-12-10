import { useState, useEffect, useCallback } from 'react';
import { useStdout } from 'ink';

type TerminalSize = {
  width: number;
  height: number;
};

/**
 * Custom hook for reactive terminal dimensions.
 * Automatically updates when terminal is resized.
 */
export const useTerminalSize = (): TerminalSize => {
  const { stdout } = useStdout();

  const getSize = useCallback(
    (): TerminalSize => ({
      width: stdout?.columns || process.stdout.columns || 80,
      height: stdout?.rows || process.stdout.rows || 24,
    }),
    [stdout]
  );

  const [size, setSize] = useState<TerminalSize>(getSize);

  useEffect(() => {
    // Update immediately in case stdout became available
    setSize(getSize());

    const handleResize = () => setSize(getSize());

    process.stdout.on('resize', handleResize);

    return () => {
      process.stdout.off('resize', handleResize);
    };
  }, [stdout, getSize]);

  return size;
};
