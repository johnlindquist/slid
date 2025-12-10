import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import matter from 'gray-matter';
import type { Slide, SlideMetadata } from '../types/index.js';
import { parseNotes, stripNotes, parseFragments } from './markdown.js';

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

export const getSlideSteps = (slide: Slide): number => {
  if (slide.type !== 'markdown') return 1;
  const contentWithoutHeader = slide.content.replace(/^#\s+.+\n?/, '');
  const fragments = parseFragments(contentWithoutHeader);
  return Math.max(1, fragments.length);
};
