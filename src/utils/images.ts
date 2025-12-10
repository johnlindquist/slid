import fs from 'node:fs';
import path from 'node:path';
import terminalImage from 'terminal-image';
import type { ImageRef } from '../types/index.js';
import { IMAGE_REGEX } from './constants.js';

export const parseImageReferences = (content: string): ImageRef[] => {
  const images: ImageRef[] = [];
  // Create new regex instance to avoid shared state issues
  const regex = new RegExp(IMAGE_REGEX.source, IMAGE_REGEX.flags);
  let match;
  while ((match = regex.exec(content)) !== null) {
    images.push({
      fullMatch: match[0],
      altText: match[1] || 'Image',
      imagePath: match[2] || '',
    });
  }
  return images;
};

export const resolveImagePath = (imagePath: string, slideDir: string): string => {
  if (path.isAbsolute(imagePath)) {
    return imagePath;
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return path.resolve(slideDir, imagePath);
};

export const renderImageToString = async (
  imagePath: string,
  altText: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> => {
  try {
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return `[Image: ${altText}] (${imagePath})`;
    }

    if (!fs.existsSync(imagePath)) {
      return `[Image not found: ${altText}] (${imagePath})`;
    }

    const isGif = imagePath.toLowerCase().endsWith('.gif');

    if (isGif) {
      const buffer = await Bun.file(imagePath).arrayBuffer();
      const result = await terminalImage.buffer(new Uint8Array(buffer), {
        width: maxWidth,
        height: maxHeight,
        preserveAspectRatio: true,
      });
      return result || `[GIF: ${altText}]`;
    }

    const result = await terminalImage.file(imagePath, {
      width: maxWidth,
      height: maxHeight,
      preserveAspectRatio: true,
    });
    return result || `[Image: ${altText}]`;
  } catch {
    return `[Image: ${altText}] (failed to render)`;
  }
};

export const processMarkdownWithImages = async (
  content: string,
  slideDir: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> => {
  const images = parseImageReferences(content);

  if (images.length === 0) {
    return content;
  }

  let processedContent = content;

  for (const img of images) {
    const resolvedPath = resolveImagePath(img.imagePath, slideDir);
    const renderedImage = await renderImageToString(
      resolvedPath,
      img.altText,
      maxWidth,
      maxHeight
    );
    processedContent = processedContent.replace(img.fullMatch, `\n${renderedImage}\n`);
  }

  return processedContent;
};

export const hasImages = (content: string): boolean => {
  const regex = new RegExp(IMAGE_REGEX.source, IMAGE_REGEX.flags);
  return regex.test(content);
};
