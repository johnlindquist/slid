import { Marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import { FRAGMENT_SEPARATOR } from './constants.js';
import type { AppTheme } from './themes.js';

// Factory: Creates a renderer configured for the specific theme
export const createMarkdownRenderer = (theme: AppTheme) => {
  const marked = new Marked();
  marked.use(
    markedTerminal(
      {
        width: 80,
        reflowText: true,
        code: theme.markdown.code,
        blockquote: theme.markdown.blockquote,
        heading: theme.markdown.heading,
        firstHeading: theme.markdown.firstHeading,
        strong: theme.markdown.strong,
        em: theme.markdown.em,
        link: theme.markdown.link,
        listitem: theme.markdown.listitem,
        paragraph: theme.markdown.text,
      },
      {
        // cli-highlight options for syntax highlighting
        ignoreIllegals: true,
      }
    )
  );

  return (content: string) => marked.parse(content) as string;
};

// Default renderer for backward compatibility
const defaultMarked = new Marked();
defaultMarked.use(
  markedTerminal(
    {
      reflowText: true,
      width: 80,
    },
    {
      ignoreIllegals: true,
    }
  )
);

export const renderMarkdown = (content: string): string => {
  return defaultMarked.parse(content) as string;
};

export const parseNotes = (content: string): string => {
  const notesMatch = content.match(/<!--\s*notes:\s*([\s\S]*?)\s*-->/i);
  return notesMatch?.[1]?.trim() ?? '';
};

export const stripNotes = (content: string): string => {
  return content.replace(/<!--\s*notes:\s*[\s\S]*?\s*-->/gi, '').trim();
};

export const parseFragments = (content: string): string[] => {
  const fragments = content.split(FRAGMENT_SEPARATOR);
  return fragments.map((f) => f.trim()).filter((f) => f.length > 0);
};
