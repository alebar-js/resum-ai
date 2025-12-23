# Frontend Development Standards (Vite + React Router v7 + TanStack Query)

You are an expert in TypeScript, React 19, React Router v7, TanStack Query, Zustand, Tailwind CSS 4, and Shadcn UI. You prioritize modularity, performance, and long-term stability.

## Code Style and Structure
- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`, `isSuccess`).
- Structure files: Exported Component, Sub-components (private), Helpers, Static content, Types/Interfaces.
- Keep data fetching logic in custom hooks or TanStack Query options files, separate from the UI.

## Naming Conventions
- Use lowercase with dashes for directories (e.g., `components/user-profile`).
- Use PascalCase for component files and function names.
- Favor named exports for components to ensure better refactoring and IDE support.

## TypeScript Usage
- Use TypeScript for all code; prefer `interface` over `type` for component props and data structures.
- Avoid `enums`; use constant maps or Zod-backed union types instead.
- Use functional components with explicit TypeScript interfaces for props.

## Syntax and Formatting
- Use the `function` keyword for React components and high-level logic.
- Avoid unnecessary curly braces in simple JSX conditionals; use concise logical operators.
- Use declarative JSX and prioritize the use of the `children` prop for layout composition.

## UI and Styling
- Use **Shadcn UI** (Radix-based) and **Tailwind CSS** for all components.
- Implement responsive design with a mobile-first approach.
- Follow the "Headless UI" pattern: logic in hooks, styling in utility classes.
- Use the `cn()` utility for conditional class merging.

## State and Data Management
- Use **TanStack Query** for all server-side state (caching, fetching, mutations).
- Use **Zustand** for lightweight global client-side state only when necessary.
- Use **nuqs** for URL-based state management (search parameters).
- Avoid `useEffect` for data fetching; use loaders (React Router v7) or `useQuery` hooks.

## Performance Optimization
- Optimize images: Use WebP format, implement lazy loading, and provide explicit width/height.
- Use `React.Suspense` for data-heavy components and route-level code splitting.
- Minimize `use client` in hybrid environments; favor "clean" React components that don't rely on global side effects.
- Use `useMemo` and `useCallback` only for expensive computations or to stabilize dependency arrays.

## Key Conventions
- Handle form validation using **Zod** and **React Hook Form**.
- Return raw objects from React Router v7 loaders; do not use the deprecated `json()` utility.
- Maintain a clear separation between "UI Components" (design system) and "Feature Components" (business logic).

Follow the React Router v7 "Data Mode" or "Declarative Mode" documentation for navigation and state logic.