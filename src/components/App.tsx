import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Slide, AppAction } from '../types/index.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { useSlideWatcher } from '../hooks/useSlideWatcher.js';
import { useSlideNavigation } from '../hooks/useSlideNavigation.js';
import { MarkdownSlide } from './MarkdownSlide.js';
import { CastSlide } from './CastSlide.js';
import { OverviewMode } from './OverviewMode.js';
import { Footer } from './Footer.js';
import { EmptyState } from './EmptyState.js';
import { ThemeSelector } from './ThemeSelector.js';
import { THEMES, type AppTheme } from '../utils/themes.js';

type AppProps = {
  slides: Slide[];
  initialIndex: number;
  slidesDir: string;
  onExit: (action: AppAction) => void;
  onSlideChange?: (index: number) => void;
};

/**
 * Main presentation app component.
 * Manages slide display, navigation, and mode switching.
 */
export function App({
  slides: initialSlides,
  initialIndex,
  slidesDir,
  onExit,
  onSlideChange,
}: AppProps) {
  const { slides, reloadCount } = useSlideWatcher(initialSlides, slidesDir);
  const { width: terminalWidth, height: terminalHeight } = useTerminalSize();

  // Theme state
  const [theme, setTheme] = useState<AppTheme>(THEMES.default!);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Global toggle for theme menu
  useInput((input) => {
    if (input === 't' && !showThemeSelector) {
      setShowThemeSelector(true);
    }
  });

  const {
    index,
    step,
    mode,
    overviewSelectedIndex,
    currentSlide,
    totalSteps,
    setOverviewSelectedIndex,
    handlePlay,
  } = useSlideNavigation({
    slides,
    initialIndex,
    onExit,
    onSlideChange,
    isPaused: showThemeSelector,
  });

  // Handle empty slides or undefined currentSlide
  if (slides.length === 0 || !currentSlide) {
    return <EmptyState slidesDir={slidesDir} />;
  }

  // Theme selector overlay
  if (showThemeSelector) {
    return (
      <Box
        height={terminalHeight}
        width={terminalWidth}
        alignItems="center"
        justifyContent="center"
      >
        <ThemeSelector
          currentTheme={theme}
          onSelect={setTheme}
          onClose={() => setShowThemeSelector(false)}
        />
      </Box>
    );
  }

  // Overview mode
  if (mode === 'overview') {
    return (
      <Box flexDirection="column" height="100%">
        <Box flexGrow={1}>
          <OverviewMode
            slides={slides}
            currentIndex={index}
            selectedIndex={overviewSelectedIndex}
            onSelect={setOverviewSelectedIndex}
            theme={theme}
          />
        </Box>
        <Box justifyContent="space-between" paddingX={2} borderStyle="single" borderColor={theme.colors.ui.border}>
          <Text color={theme.colors.ui.border}>↑/↓/←/→ Navigate | Enter: Jump | Tab/Esc: Exit Overview</Text>
          <Text color={theme.colors.ui.border}>
            Selected: {overviewSelectedIndex + 1}/{slides.length}
          </Text>
        </Box>
      </Box>
    );
  }

  // Presentation mode
  const contentHeight = terminalHeight - 3;

  return (
    <Box flexDirection="column" width={terminalWidth}>
      <Box height={contentHeight} width={terminalWidth}>
        {currentSlide.type === 'markdown' ? (
          <MarkdownSlide
            slide={currentSlide}
            isActive={true}
            step={step}
            totalSteps={totalSteps}
            theme={theme}
          />
        ) : (
          <CastSlide slide={currentSlide} isActive={true} onPlay={handlePlay} theme={theme} />
        )}
      </Box>

      <Footer
        terminalWidth={terminalWidth}
        slideIndex={index}
        totalSlides={slides.length}
        hasReloaded={reloadCount > 0}
        theme={theme}
      />
    </Box>
  );
}
