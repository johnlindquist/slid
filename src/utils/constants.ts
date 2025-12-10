export const VERSION = '1.0.0';
export const DEFAULT_SLIDES_DIR = './slides';
export const PRESENTER_PORT = 3333;

// Fragment separator - uses HTML comment syntax that won't render
export const FRAGMENT_SEPARATOR = /<!--\s*fragment\s*-->/gi;

// Image regex for parsing markdown images
export const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;
