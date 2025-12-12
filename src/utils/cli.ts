import { parseArgs } from 'node:util';
import fs from 'node:fs';
import type { ParsedArgs, SlidesSource } from '../types';
import { VERSION, DEFAULT_SLIDES_DIR, DOT_DECK_DIR } from './constants';

/**
 * Determine the slides source to use.
 * Priority: 1) explicit path (file or dir), 2) .deck directory, 3) ./slides
 */
const resolveSlidesSource = (explicitPath?: string): SlidesSource => {
  if (explicitPath) {
    // Check if it's a MARP file (single .md file)
    if (explicitPath.endsWith('.md') && fs.existsSync(explicitPath)) {
      const stats = fs.statSync(explicitPath);
      if (stats.isFile()) {
        return { type: 'marp', path: explicitPath };
      }
    }
    return { type: 'directory', path: explicitPath };
  }

  // Check for .deck directory in current working directory
  if (fs.existsSync(DOT_DECK_DIR) && fs.statSync(DOT_DECK_DIR).isDirectory()) {
    return { type: 'directory', path: DOT_DECK_DIR };
  }

  return { type: 'directory', path: DEFAULT_SLIDES_DIR };
};

export const showHelp = (): void => {
  console.log(`
mdplay - Terminal-based markdown presentation tool

Usage:
  mdplay [options] [slides-directory|marp-file.md]

Arguments:
  slides-directory    Path to slides directory (default: .deck or ./slides)
  marp-file.md        Single MARP-format markdown file with --- separators

Directory Resolution:
  1. If a path is provided, use it
  2. If .deck/ exists in current directory, use it
  3. Fall back to ./slides

Options:
  -s, --start-at <n>  Start at slide number (1-indexed, default: 1)
  -p, --presenter     Enable presenter mode with speaker notes
  -h, --help          Show this help message
  -v, --version       Show version number
  --wezterm-config    Show WezTerm config snippet for presentation mode

Examples:
  mdplay                           # Auto-detect .deck/ or ./slides
  mdplay ./my-talk                 # Use custom directory
  mdplay presentation.md           # Use MARP-format single file
  mdplay --start-at=5              # Start at slide 5
  mdplay --presenter               # Enable presenter mode
  mdplay ./presentations -s 3      # Custom dir, start at slide 3
`);
};

export const showWeztermConfig = (): void => {
  console.log(`
Add this to your ~/.wezterm.lua to enable presentation mode (hide tab bar):

-- mdplay presentation mode: hide tab bar when mdplay_presentation user var is set
wezterm.on('user-var-changed', function(window, pane, name, value)
  if name == 'mdplay_presentation' then
    local overrides = window:get_config_overrides() or {}
    if value == '1' then
      overrides.enable_tab_bar = false
      overrides.window_padding = { left = 0, right = 0, top = 0, bottom = 0 }
    else
      overrides.enable_tab_bar = nil
      overrides.window_padding = nil
    end
    window:set_config_overrides(overrides)
  end
end)
`);
};

export const showVersion = (): void => {
  console.log(`mdplay v${VERSION}`);
};

export const parseCliArgs = (): ParsedArgs => {
  try {
    const { values, positionals } = parseArgs({
      args: Bun.argv.slice(2),
      options: {
        'start-at': {
          type: 'string',
          short: 's',
        },
        presenter: {
          type: 'boolean',
          short: 'p',
        },
        help: {
          type: 'boolean',
          short: 'h',
        },
        version: {
          type: 'boolean',
          short: 'v',
        },
      },
      allowPositionals: true,
    });

    const slidesSource = resolveSlidesSource(positionals[0]);

    let startAt = 0;
    if (values['start-at']) {
      const parsed = parseInt(values['start-at'], 10);
      if (isNaN(parsed) || parsed < 1) {
        console.error(
          `Error: --start-at must be a positive integer (got: ${values['start-at']})`
        );
        process.exit(1);
      }
      startAt = parsed - 1;
    }

    return {
      slidesSource,
      startAt,
      showHelp: values.help ?? false,
      showVersion: values.version ?? false,
      presenterMode: values.presenter ?? false,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error parsing arguments: ${error.message}`);
    }
    console.error('Run with --help for usage information.');
    process.exit(1);
  }
};
