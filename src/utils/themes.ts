import chalk, { type ChalkInstance } from 'chalk';
import type { GradientName } from 'ink-gradient';

export type AppTheme = {
  id: string;
  name: string;
  colors: {
    ui: {
      border: string;
      highlight: string;
      text: string;
      dim: string;
    };
    header: {
      gradient: GradientName;
      fallback: string;
    };
  };
  markdown: {
    code: ChalkInstance;
    blockquote: ChalkInstance;
    heading: ChalkInstance;
    firstHeading: ChalkInstance;
    strong: ChalkInstance;
    em: ChalkInstance;
    link: ChalkInstance;
    listitem: ChalkInstance;
    text: ChalkInstance;
  };
};

export const THEMES: Record<string, AppTheme> = {
  default: {
    id: 'default',
    name: 'Default (Cyber)',
    colors: {
      ui: { border: 'cyan', highlight: 'green', text: 'white', dim: 'gray' },
      header: { gradient: 'cristal', fallback: 'cyan' },
    },
    markdown: {
      code: chalk.yellow,
      blockquote: chalk.gray.italic,
      heading: chalk.green.bold,
      firstHeading: chalk.magenta.underline.bold,
      strong: chalk.bold.cyan,
      em: chalk.italic,
      link: chalk.blue,
      listitem: chalk.white,
      text: chalk.white,
    },
  },
  light: {
    id: 'light',
    name: 'High Contrast',
    colors: {
      ui: { border: 'blue', highlight: 'magenta', text: 'whiteBright', dim: 'blueBright' },
      header: { gradient: 'morning', fallback: 'blue' },
    },
    markdown: {
      code: chalk.bgGray.whiteBright,
      blockquote: chalk.blueBright.italic,
      heading: chalk.blueBright.bold,
      firstHeading: chalk.magentaBright.underline.bold,
      strong: chalk.bold.whiteBright,
      em: chalk.italic.cyanBright,
      link: chalk.magentaBright.underline,
      listitem: chalk.whiteBright,
      text: chalk.whiteBright,
    },
  },
  amber: {
    id: 'amber',
    name: 'Retro Amber',
    colors: {
      ui: { border: 'yellow', highlight: 'yellow', text: '#ffcc00', dim: '#664400' },
      header: { gradient: 'summer', fallback: 'yellow' },
    },
    markdown: {
      code: chalk.yellow,
      blockquote: chalk.yellow.dim,
      heading: chalk.yellow.bold,
      firstHeading: chalk.yellow.underline.bold,
      strong: chalk.bold.yellowBright,
      em: chalk.italic,
      link: chalk.yellow.underline,
      listitem: chalk.yellow,
      text: chalk.hex('#ffcc00'),
    },
  },
};
