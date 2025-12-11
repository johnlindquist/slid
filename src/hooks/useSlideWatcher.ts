import { useState, useEffect, useCallback, useRef } from 'react';
import fs from 'node:fs';
import path from 'node:path';
import type { Slide } from '../types';
import { loadSlides } from '../utils/slides';

type SlideWatcherResult = {
  slides: Slide[];
  reloadCount: number;
};

/**
 * Hook that watches the slides directory and reloads slides when files change.
 * Includes debouncing to avoid multiple rapid reloads.
 */
export const useSlideWatcher = (
  initialSlides: Slide[],
  slidesDir: string
): SlideWatcherResult => {
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [reloadCount, setReloadCount] = useState(0);
  const watcherRef = useRef<fs.FSWatcher | null>(null);
  const slidesDirAbs = path.resolve(slidesDir);

  const reloadSlides = useCallback(() => {
    try {
      const newSlides = loadSlides(slidesDir);
      setSlides(newSlides);
      setReloadCount((c) => c + 1);
    } catch {
      // Keep existing slides if reload fails
    }
  }, [slidesDir]);

  useEffect(() => {
    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleChange = (_event: fs.WatchEventType, filename: string | null) => {
      // Only react to .md and .cast files
      if (filename && (filename.endsWith('.md') || filename.endsWith('.cast'))) {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        debounceTimeout = setTimeout(() => {
          reloadSlides();
        }, 100);
      }
    };

    try {
      watcherRef.current = fs.watch(slidesDirAbs, { persistent: true }, handleChange);
    } catch {
      // Directory might not exist yet
    }

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      if (watcherRef.current) {
        watcherRef.current.close();
        watcherRef.current = null;
      }
    };
  }, [reloadSlides, slidesDirAbs]);

  return { slides, reloadCount };
};
