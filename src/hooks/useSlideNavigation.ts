import { useState, useEffect, useCallback } from 'react';
import { useInput, useApp } from 'ink';
import type { Slide, AppAction, AppMode } from '../types';
import { getSlideSteps } from '../utils/slides';

type SlideNavigationOptions = {
  slides: Slide[];
  initialIndex: number;
  onExit: (action: AppAction) => void;
  onSlideChange?: (index: number) => void;
  isPaused?: boolean;
};

type SlideNavigationResult = {
  index: number;
  step: number;
  mode: AppMode;
  overviewSelectedIndex: number;
  currentSlide: Slide | undefined;
  totalSteps: number;
  setMode: (mode: AppMode) => void;
  setOverviewSelectedIndex: (index: number) => void;
  jumpToSlide: (index: number) => void;
  handlePlay: () => void;
};

/**
 * Hook that manages slide navigation state and keyboard controls.
 * Encapsulates all navigation logic including fragments/steps.
 */
export const useSlideNavigation = ({
  slides,
  initialIndex,
  onExit,
  onSlideChange,
  isPaused = false,
}: SlideNavigationOptions): SlideNavigationResult => {
  const { exit } = useApp();
  const [index, setIndex] = useState(initialIndex);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<AppMode>('presentation');
  const [overviewSelectedIndex, setOverviewSelectedIndex] = useState(initialIndex);

  // Adjust index if current slide no longer exists after reload
  useEffect(() => {
    if (index >= slides.length && slides.length > 0) {
      setIndex(Math.max(0, slides.length - 1));
    }
  }, [slides.length, index]);

  const currentSlide = slides[index];
  const totalSteps = currentSlide ? getSlideSteps(currentSlide) : 1;

  // Reset step when changing slides
  useEffect(() => {
    setStep(0);
  }, [index]);

  // Notify presenter view of slide changes
  useEffect(() => {
    onSlideChange?.(index);
  }, [index, onSlideChange]);

  const jumpToSlide = useCallback((newIndex: number) => {
    setIndex(newIndex);
    setMode('presentation');
  }, []);

  const handlePlay = useCallback(() => {
    if (currentSlide?.type === 'cast') {
      onExit({ type: 'play', path: currentSlide.path, slideIndex: index });
      exit();
    }
  }, [currentSlide, index, onExit, exit]);

  useInput((input, key) => {
    // Skip all input when paused (e.g., theme selector open)
    if (isPaused) return;

    // Handle mode toggle with Tab or 'g'
    if (key.tab || input === 'g') {
      if (mode === 'presentation') {
        setMode('overview');
        setOverviewSelectedIndex(index);
      } else {
        setMode('presentation');
      }
      return;
    }

    if (mode === 'overview') {
      if (key.escape) {
        setMode('presentation');
        return;
      }
      if (key.return) {
        jumpToSlide(overviewSelectedIndex);
        return;
      }
      // Arrow navigation handled by OverviewMode component
      return;
    }

    // Presentation mode controls
    if (key.escape || input === 'q') {
      onExit({ type: 'quit' });
      exit();
    }

    // Right arrow: advance step or go to next slide
    if (key.rightArrow) {
      if (step < totalSteps - 1) {
        setStep((s) => s + 1);
      } else if (index < slides.length - 1) {
        setIndex((i) => i + 1);
      }
    }

    // Left arrow: go back a step or to previous slide
    if (key.leftArrow) {
      if (step > 0) {
        setStep((s) => s - 1);
      } else if (index > 0) {
        const prevSlide = slides[index - 1];
        const prevSteps = prevSlide ? getSlideSteps(prevSlide) : 1;
        setIndex((i) => i - 1);
        // Use setTimeout to set step after index change triggers step reset
        setTimeout(() => setStep(prevSteps - 1), 0);
      }
    }
  });

  return {
    index,
    step,
    mode,
    overviewSelectedIndex,
    currentSlide,
    totalSteps,
    setMode,
    setOverviewSelectedIndex,
    jumpToSlide,
    handlePlay,
  };
};
