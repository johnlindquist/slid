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

    // Disable native protocols (iTerm/Kitty) as they produce single-line
    // sequences that can break Ink's layout system. Stick to standard ANSI blocks.
    const options = {
      width: maxWidth,
      height: maxHeight,
      preserveAspectRatio: true,
      preferNativeRender: false,
    };

    if (isGif) {
      const buffer = await Bun.file(imagePath).arrayBuffer();
      const result = await terminalImage.buffer(new Uint8Array(buffer), options);
      return result || `[GIF: ${altText}]`;
    }

    const result = await terminalImage.file(imagePath, options);
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
): Promise<{ content: string; replacements: Record<string, string> }> => {
  const images = parseImageReferences(content);
  const replacements: Record<string, string> = {};

  if (images.length === 0) {
    return { content, replacements };
  }

  let processedContent = content;

  for (const [index, img] of images.entries()) {
    const resolvedPath = resolveImagePath(img.imagePath, slideDir);
    const renderedImage = await renderImageToString(
      resolvedPath,
      img.altText,
      maxWidth,
      maxHeight
    );

    // Use a unique placeholder that won't trigger markdown formatting.
    // We add newlines to ensure it is treated as a distinct block element.
    const placeholder = `__SLIDE_IMG_${index}_${Date.now()}__`;
    replacements[placeholder] = renderedImage;

    // Replace the markdown image syntax with the placeholder
    processedContent = processedContent.replace(img.fullMatch, `\n\n${placeholder}\n\n`);
  }

  return { content: processedContent, replacements };
};

export const injectImages = (content: string, replacements: Record<string, string>): string => {
  let result = content;
  for (const [placeholder, image] of Object.entries(replacements)) {
    result = result.split(placeholder).join(image);
  }
  return result;
};

export const hasImages = (content: string): boolean => {
  const regex = new RegExp(IMAGE_REGEX.source, IMAGE_REGEX.flags);
  return regex.test(content);
};
