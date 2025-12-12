// --- Slide Types ---
export type SlideLayout = 'default' | 'center' | 'split';
export type SlideTheme = 'default' | 'neon' | 'minimal';

export type SlideMetadata = {
  title?: string;
  subtitle?: string;
  layout?: SlideLayout;
  theme?: SlideTheme;
  hidden?: boolean;
  notes?: string;
};

export type MarkdownSlide = {
  type: 'markdown';
  content: string;
  title: string;
  filename: string;
  metadata: SlideMetadata;
  notes: string;
  slideDir: string;
};

export type CastSlide = {
  type: 'cast';
  path: string;
  title: string;
  filename: string;
  metadata: SlideMetadata;
  notes: string;
};

export type Slide = MarkdownSlide | CastSlide;

// --- Image Types ---
export type ImageRef = {
  fullMatch: string;
  altText: string;
  imagePath: string;
};

// --- App Types ---
export type AppAction =
  | { type: 'quit' }
  | { type: 'play'; path: string; slideIndex: number };

export type AppMode = 'presentation' | 'overview';

// --- Presenter Mode Types ---
export type PresenterMessage = {
  type: 'slide';
  slideIndex: number;
  totalSlides: number;
  title: string;
  notes: string;
  nextTitle: string | null;
};

// --- CLI Types ---
export type SlidesSource =
  | { type: 'directory'; path: string }
  | { type: 'marp'; path: string };

export interface ParsedArgs {
  slidesSource: SlidesSource;
  startAt: number;
  showHelp: boolean;
  showVersion: boolean;
  presenterMode: boolean;
}
