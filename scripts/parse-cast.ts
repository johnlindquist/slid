#!/usr/bin/env bun
/**
 * Parse asciinema .cast files and extract readable text
 * Usage: bun scripts/parse-cast.ts <path-to-cast-file>
 */

import { readFileSync } from 'fs';

const castFile = process.argv[2];

if (!castFile) {
  console.error('Usage: bun scripts/parse-cast.ts <path-to-cast-file>');
  process.exit(1);
}

const cast = readFileSync(castFile, 'utf-8');
const lines = cast.split('\n').filter(l => l.startsWith('['));

let buffer = '';

for (const line of lines) {
  try {
    const [time, type, data] = JSON.parse(line);
    if (type === 'o') {
      // Strip ANSI escape codes
      const clean = data
        .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
        .replace(/\x1b\][^\x07]*\x07/g, '')
        .replace(/\x1b\\\\/g, '')
        .replace(/[\x00-\x1f]/g, (c: string) => (c === '\n' || c === '\r' ? c : ''));
      buffer += clean;
    }
  } catch {}
}

// Extract lines and deduplicate
const outputLines = buffer.split(/[\r\n]+/).filter(l => l.trim());
const seen = new Set<string>();

for (const line of outputLines) {
  const trimmed = line.trim();
  if (trimmed && !seen.has(trimmed) && trimmed.length > 3) {
    // Filter out spinner chars and UI noise
    if (!/^[⣾⣽⣻⢿⡿⣟◎∙●◉✓○]/.test(trimmed) && !/^[─│]+$/.test(trimmed)) {
      seen.add(trimmed);
      console.log(trimmed);
    }
  }
}
