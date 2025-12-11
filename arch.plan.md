I'll analyze the TypeScript files in the src directory to understand the current architecture and provide recommendations.

Now let me examine the key files to understand the current structure:

Based on my analysis of the codebase, here are my **top 3 recommendations** for improving the architecture:

## 1. **Extract Complex State Logic from `index.tsx` into a Custom Hook**
   
   **Problem:** The main file contains a complex supervisor loop mixing presentation mode lifecycle, asciinema playback control, and keyboard handling. This is hard to test and modify.
   
   **Solution:** Create a `useAppLifecycle` hook that encapsulates:
   - Presentation mode enter/exit
   - The supervisor loop state machine
   - Asciinema playback navigation
   
   This separates concerns and makes the logic testable.

---

## 2. **Split `utils/slides.ts` Into Smaller Modules by Responsibility**
   
   **Problem:** The file mixes three distinct concerns:
   - Slide discovery & validation (file system operations)
   - Metadata parsing (frontmatter, notes, fragments)
   - Step calculation (rendering logic)
   
   **Solution:** Reorganize into:
   ```
   utils/slides/
   ├── loader.ts (validateSlidesDir, loadSlides)
   ├── parser.ts (metadata parsing, notes extraction)
   ├── steps.ts (getSlideSteps, fragment logic)
   └── index.ts (re-exports)
   ```
   This reduces coupling and improves testability of each concern.

---

## 3. **Create an `ImageService` Class to Encapsulate Image Processing**
   
   **Problem:** `utils/images.ts` has multiple functions with related concerns (parsing, resolving, rendering). It's procedural and mixes high-level logic with low-level operations.
   
   **Solution:** Create a class-based service:
   ```typescript
   class ImageService {
     constructor(private slideDir: string, private maxWidth: number, private maxHeight: number) {}
     processMarkdown(content: string): Promise<ProcessedContent>
     renderImage(imagePath: string, altText: string): Promise<string>
   }
   ```
   This groups related functionality, makes dependencies explicit, and simplifies testing through dependency injection.

