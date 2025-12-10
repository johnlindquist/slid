declare module 'marked-terminal' {
  import type { MarkedExtension } from 'marked';
  import type { ChalkInstance } from 'chalk';

  interface MarkedTerminalOptions {
    reflowText?: boolean;
    width?: number;
    unescape?: boolean;
    emoji?: boolean;
    tab?: number;
    tableOptions?: object;
    // Chalk styling functions for various markdown elements
    code?: ChalkInstance | ((code: string, language: string) => string);
    blockquote?: ChalkInstance;
    heading?: ChalkInstance;
    firstHeading?: ChalkInstance;
    strong?: ChalkInstance;
    em?: ChalkInstance;
    link?: ChalkInstance;
    listitem?: ChalkInstance;
    paragraph?: ChalkInstance;
    text?: ChalkInstance;
    hr?: ChalkInstance;
    del?: ChalkInstance;
    table?: ChalkInstance;
    codespan?: ChalkInstance;
  }

  interface HighlightOptions {
    ignoreIllegals?: boolean;
    theme?: object;
  }

  export function markedTerminal(
    options?: MarkedTerminalOptions,
    highlightOptions?: HighlightOptions
  ): MarkedExtension;
}
