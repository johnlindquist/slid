import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import matter from 'gray-matter';
import type { Slide, SlideMetadata, SlidesSource } from '../types';
import { parseNotes, stripNotes, parseFragments } from './markdown';

// MARP slide separator (horizontal rule with 3+ dashes on its own line)
const MARP_SLIDE_SEPARATOR = /^---$/gm;

export const validateSlidesDir = (slidesDir: string): void => {
  const resolvedPath = path.resolve(slidesDir);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Slides directory not found: ${resolvedPath}`);
    console.error('');
    console.error('Please provide a valid path to a directory containing .md or .cast files.');
    process.exit(1);
  }

  const stats = fs.statSync(resolvedPath);
  if (!stats.isDirectory()) {
    console.error(`Error: Path is not a directory: ${resolvedPath}`);
    process.exit(1);
  }

  const slides = globSync(`${resolvedPath}/*.{md,cast}`);
  if (slides.length === 0) {
    console.error(`Error: No slides found in: ${resolvedPath}`);
    console.error('');
    console.error('The directory should contain .md (Markdown) or .cast (Asciinema) files.');
    console.error('Files are sorted alphabetically, so prefix them with numbers (e.g., 01_intro.md).');
    process.exit(1);
  }
};

export const validateMarpFile = (filePath: string): void => {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: MARP file not found: ${resolvedPath}`);
    process.exit(1);
  }

  const stats = fs.statSync(resolvedPath);
  if (!stats.isFile()) {
    console.error(`Error: Path is not a file: ${resolvedPath}`);
    process.exit(1);
  }

  if (!resolvedPath.endsWith('.md')) {
    console.error(`Error: MARP file must be a .md file: ${resolvedPath}`);
    process.exit(1);
  }
};

/**
 * Validate slides source (directory or MARP file)
 */
export const validateSlidesSource = (source: SlidesSource): void => {
  if (source.type === 'directory') {
    validateSlidesDir(source.path);
  } else {
    validateMarpFile(source.path);
  }
};

export const loadSlides = (slidesDir: string): Slide[] => {
  const resolvedPath = path.resolve(slidesDir);

  return globSync(`${resolvedPath}/*.{md,cast}`)
    .sort()
    .map((filePath) => {
      const ext = path.extname(filePath);
      const filename = path.basename(filePath);
      const slideDir = path.resolve(path.dirname(filePath));
      const filenameTitle = filename
        .replace(ext, '')
        .replace(/^\d+[_-]/, '')
        .replace(/[_-]/g, ' ');

      if (ext === '.cast') {
        return {
          type: 'cast' as const,
          path: filePath,
          title: filenameTitle,
          filename,
          metadata: {} as SlideMetadata,
          notes: '',
        };
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content: frontmatterContent } = matter(fileContent);

      const metadata: SlideMetadata = {
        title: typeof frontmatter.title === 'string' ? frontmatter.title : undefined,
        subtitle: typeof frontmatter.subtitle === 'string' ? frontmatter.subtitle : undefined,
        layout: ['default', 'center', 'split'].includes(frontmatter.layout)
          ? frontmatter.layout
          : undefined,
        theme: ['default', 'neon', 'minimal'].includes(frontmatter.theme)
          ? frontmatter.theme
          : undefined,
        hidden: typeof frontmatter.hidden === 'boolean' ? frontmatter.hidden : undefined,
        notes: typeof frontmatter.notes === 'string' ? frontmatter.notes : undefined,
      };

      const notes = parseNotes(frontmatterContent) || metadata.notes || '';
      const content = stripNotes(frontmatterContent);
      const title = metadata.title || filenameTitle;

      return {
        type: 'markdown' as const,
        content,
        title,
        filename,
        metadata,
        notes,
        slideDir,
      };
    })
    .filter((slide) => !slide.metadata.hidden);
};

/**
 * Load slides from a MARP-format file (single .md with --- separators)
 * MARP format: frontmatter at top, then slides separated by ---
 */
export const loadMarpSlides = (filePath: string): Slide[] => {
  const resolvedPath = path.resolve(filePath);
  const slideDir = path.dirname(resolvedPath);
  const filename = path.basename(resolvedPath);
  const fileContent = fs.readFileSync(resolvedPath, 'utf-8');

  // Parse frontmatter from the entire file (global settings)
  const { data: globalFrontmatter, content: contentAfterFrontmatter } = matter(fileContent);

  // Split content by --- (MARP slide separator)
  // The separator must be on its own line
  const slideTexts = contentAfterFrontmatter
    .split(/\n---\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (slideTexts.length === 0) {
    console.error(`Error: No slides found in MARP file: ${resolvedPath}`);
    console.error('');
    console.error('MARP files should have slides separated by --- on its own line.');
    process.exit(1);
  }

  const slides: Slide[] = [];

  for (let index = 0; index < slideTexts.length; index++) {
    const slideText = slideTexts[index]!;
    // Each slide can have its own frontmatter (local directives)
    const { data: slideFrontmatter, content: slideContent } = matter(slideText);

    // Merge global and local frontmatter (local takes precedence)
    const mergedFrontmatter = { ...globalFrontmatter, ...slideFrontmatter };

    const metadata: SlideMetadata = {
      title: typeof mergedFrontmatter.title === 'string' ? mergedFrontmatter.title : undefined,
      subtitle: typeof mergedFrontmatter.subtitle === 'string' ? mergedFrontmatter.subtitle : undefined,
      layout: ['default', 'center', 'split'].includes(mergedFrontmatter.layout)
        ? mergedFrontmatter.layout
        : undefined,
      theme: ['default', 'neon', 'minimal'].includes(mergedFrontmatter.theme)
        ? mergedFrontmatter.theme
        : undefined,
      hidden: typeof mergedFrontmatter.hidden === 'boolean' ? mergedFrontmatter.hidden : undefined,
      notes: typeof mergedFrontmatter.notes === 'string' ? mergedFrontmatter.notes : undefined,
    };

    // Skip hidden slides
    if (metadata.hidden) continue;

    const notes = parseNotes(slideContent) || metadata.notes || '';
    const content = stripNotes(slideContent);

    // Extract title from frontmatter or first heading
    const headingMatch = content.match(/^#\s+(.+)$/m);
    const title = metadata.title ?? headingMatch?.[1] ?? `Slide ${index + 1}`;

    slides.push({
      type: 'markdown' as const,
      content,
      title,
      filename: `${filename}#${index + 1}`,
      metadata,
      notes,
      slideDir,
    });
  }

  return slides;
};

/**
 * Load slides from either a directory or MARP file
 */
export const loadSlidesFromSource = (source: SlidesSource): Slide[] => {
  if (source.type === 'marp') {
    return loadMarpSlides(source.path);
  }
  return loadSlides(source.path);
};

/**
 * Get the slides directory path for file watching
 */
export const getSlidesWatchPath = (source: SlidesSource): string => {
  if (source.type === 'marp') {
    return path.dirname(path.resolve(source.path));
  }
  return path.resolve(source.path);
};

export const getSlideSteps = (slide: Slide): number => {
  if (slide.type !== 'markdown') return 1;
  const contentWithoutHeader = slide.content.replace(/^#\s+.+\n?/, '');
  const fragments = parseFragments(contentWithoutHeader);
  return Math.max(1, fragments.length);
};

export const thisNeedsToBeTested = (slide: Slide): void => { }