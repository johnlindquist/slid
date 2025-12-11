import { parseArgs } from 'node:util';
import type { ParsedArgs } from '../types/index.js';
import { VERSION, DEFAULT_SLIDES_DIR } from './constants.js';

export const showHelp = (): void => {
  console.log(`
slid - Terminal-based presentation tool

Usage:
  bun run index.tsx [options] [slides-directory]

Arguments:
  slides-directory    Path to slides directory (default: ./slides)

Options:
  -s, --start-at <n>  Start at slide number (1-indexed, default: 1)
  -p, --presenter     Enable presenter mode with speaker notes
  -h, --help          Show this help message
  -v, --version       Show version number
  --wezterm-config    Show WezTerm config snippet for presentation mode

Examples:
  bun run index.tsx                      # Use ./slides directory
  bun run index.tsx ./my-talk            # Use custom directory
  bun run index.tsx --start-at=5         # Start at slide 5
  bun run index.tsx --presenter          # Enable presenter mode
  bun run index.tsx ./presentations -s 3 # Custom dir, start at slide 3
`);
};

export const showWeztermConfig = (): void => {
  console.log(`
Add this to your ~/.wezterm.lua to enable presentation mode (hide tab bar):

-- Slid presentation mode: hide tab bar when slid_presentation user var is set
wezterm.on('user-var-changed', function(window, pane, name, value)
  if name == 'slid_presentation' then
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
  console.log(`slid v${VERSION}`);
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

    const slidesDir = positionals[0] || DEFAULT_SLIDES_DIR;

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
      slidesDir,
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
