---
description: Standards for shared Zod schemas and TypeScript types
globs: ["packages/shared/**/*"]
---
# Shared Package Standards

- This package is the "Source of Truth" for the entire stack.
- **Contract First:** Define all API request/response shapes here as Zod schemas first.
- **Inference:** Export inferred types using `z.infer<typeof Schema>`.
- **Zero Dependencies:** Keep this package lean. Only `zod` and basic TS logic should live here.
- **Validation:** Ensure schemas include clear error messages as they will be displayed in the UI.