import { test, expect, describe } from "bun:test";

describe("Module imports", () => {
  test("imports work correctly without .js extensions", async () => {
    // This test verifies that all module imports resolve correctly
    // The test passes if the modules can be imported without errors
    const imports = await Promise.all([
      import("./components/App"),
      import("./types"),
      import("./utils/cli"),
      import("./utils/slides"),
      import("./utils/presenter"),
      import("./hooks/useTerminalSize"),
      import("./hooks/useSlideWatcher"),
      import("./hooks/useSlideNavigation"),
    ]);
    
    expect(imports.length).toBe(8);
    // Verify each import resolved
    imports.forEach((mod) => {
      expect(mod).toBeTruthy();
    });
  });
});
