#!/usr/bin/env bun
/**
 * Resize a cast file's terminal dimensions.
 * Usage: bun scripts/resize-cast.ts <file.cast> [cols] [rows]
 * 
 * If cols/rows not provided, uses current terminal size.
 */

import fs from 'node:fs';

const file = process.argv[2];
const cols = process.argv[3] ? parseInt(process.argv[3]) : process.stdout.columns || 120;
const rows = process.argv[4] ? parseInt(process.argv[4]) : process.stdout.rows || 40;

if (!file) {
  console.error('Usage: bun scripts/resize-cast.ts <file.cast> [cols] [rows]');
  process.exit(1);
}

const content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');

// Parse and modify the header (first line)
if (!lines[0]) {
  throw new Error(`Invalid cast file: ${file} - missing header`);
}
const header = JSON.parse(lines[0]);
const oldCols = header.term?.cols || header.width;
const oldRows = header.term?.rows || header.height;

console.log(`Resizing ${file} from ${oldCols}x${oldRows} to ${cols}x${rows}`);

if (header.term) {
  header.term.cols = cols;
  header.term.rows = rows;
} else {
  header.width = cols;
  header.height = rows;
}

lines[0] = JSON.stringify(header);
fs.writeFileSync(file, lines.join('\n'));

console.log('Done!');
