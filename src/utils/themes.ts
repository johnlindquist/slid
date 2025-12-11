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
    codespan: ChalkInstance;
    hr: ChalkInstance;
    del: ChalkInstance;
    table: ChalkInstance;
  };
};

export const THEMES: Record<string, AppTheme> = {
  default: {
    id: 'default',
    name: 'Default',
    colors: {
      ui: { border: 'whiteBright', highlight: 'cyanBright', text: 'whiteBright', dim: 'gray' },
      header: { gradient: 'cristal', fallback: 'cyanBright' },
    },
    markdown: {
      code: chalk.bgGray.whiteBright,
      blockquote: chalk.gray.italic,
      heading: chalk.cyanBright.bold,
      firstHeading: chalk.whiteBright.underline.bold,
      strong: chalk.bold.whiteBright,
      em: chalk.italic.white,
      link: chalk.cyanBright.underline,
      listitem: chalk.whiteBright,
      text: chalk.whiteBright,
      codespan: chalk.yellowBright,
      hr: chalk.gray,
      del: chalk.gray.strikethrough,
      table: chalk.whiteBright,
    },
  },
  light: {
    id: 'light',
    name: 'High Contrast',
    colors: {
      ui: { border: 'blueBright', highlight: 'magentaBright', text: 'whiteBright', dim: 'blueBright' },
      header: { gradient: 'morning', fallback: 'blueBright' },
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
      codespan: chalk.yellowBright,
      hr: chalk.blueBright,
      del: chalk.gray.strikethrough,
      table: chalk.whiteBright,
    },
  },
  amber: {
    id: 'amber',
    name: 'Retro Amber',
    colors: {
      ui: { border: 'yellowBright', highlight: 'yellowBright', text: 'yellowBright', dim: '#664400' },
      header: { gradient: 'summer', fallback: 'yellowBright' },
    },
    markdown: {
      code: chalk.bgHex('#332200').yellowBright,
      blockquote: chalk.yellow.italic,
      heading: chalk.yellowBright.bold,
      firstHeading: chalk.yellowBright.underline.bold,
      strong: chalk.bold.yellowBright,
      em: chalk.italic.yellow,
      link: chalk.yellowBright.underline,
      listitem: chalk.yellowBright,
      text: chalk.yellowBright,
      codespan: chalk.yellowBright.bold,
      hr: chalk.yellow,
      del: chalk.hex('#664400').strikethrough,
      table: chalk.yellowBright,
    },
  },
};
