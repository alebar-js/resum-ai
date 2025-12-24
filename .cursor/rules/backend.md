---
description: Standards for Node.js, Fastify, and Drizzle logic within the api package
globs: ["packages/api/**/*", "packages/shared/**/*"]
---
# Backend Development Standards...

## Monorepo Conventions
- Always use pnpm: `pnpm add <pkg> --filter api`.
- Database: Use `pnpm --filter api run db:generate` and `pnpm --filter api run db:migrate`.
- Shared Logic: Import Zod schemas from `@app/shared`. DO NOT redefine schemas locally in the API.

# Backend Development Standards (Fastify + Drizzle + Zod)

You are an expert in TypeScript, Node.js, Fastify, Drizzle ORM, PostgreSQL, and Zod. You prioritize type safety, high performance, and modular architecture.

## Code Style and Structure
- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes (except for custom Error classes if necessary).
- Use a modular plugin architecture for Fastify: separate routes, hooks, and database logic.
- Structure files: schema definitions, route handlers, service logic/helpers, type exports.
- Use descriptive variable names with auxiliary verbs (e.g., `isAuthorized`, `hasConflict`).

## Naming Conventions
- Use lowercase with dashes for directories (e.g., `routes/user-auth`).
- Favor named exports for services and route handlers.
- Use camelCase for variables and function names.
- Database tables in Drizzle should use snake_case (standard PostgreSQL convention).

## TypeScript and Validation
- Use TypeScript for all code; prefer `interface` over `type` for public APIs.
- Use **Zod** for all input validation (params, query, body) and environment variables.
- Avoid `enums`; use constant maps or Zod literals.
- Leverage `TypeBox` if extreme performance is needed, but default to `zod-to-json-schema` for Fastify validation.

## Database and ORM (Drizzle)
- Use **Drizzle ORM** for all database interactions.
- Prefer "SQL-like" syntax in Drizzle over complex relational queries when performance is critical.
- Keep schemas centralized in `src/db/schema.ts` or a `schema/` directory.
- Use migrations for all schema changes; never use `push` in production environments.
- Always use `db.execute()` for complex queries that Drizzle's API cannot express cleanly.

## Syntax and Formatting
- Use the `function` keyword for top-level logic and route handlers.
- Use arrow functions for small utility callbacks or inside higher-order functions.
- Avoid unnecessary curly braces in conditionals for simple return statements.
- Use `async/await` for all asynchronous operations; avoid `.then()` chains.

## API Design and Performance
- Implement a global error handler using `fastify.setErrorHandler`.
- Use Fastify Hooks (`preHandler`, `onRequest`) for cross-cutting concerns like authentication.
- Implement graceful shutdown using `fastify.addHook('onClose', ...)`.
- Use `zod-fetch` or similar patterns to ensure the backend and frontend stay in sync without breaking changes.
- Ensure all routes have explicit `schema` definitions for both requests and responses (using Fastify's built-in JSON schema support).

## Key Conventions
- Use **PostgreSQL** as the primary data store.
- Use **Argon2** or **scrypt** for password hashing (via Fastify-compatible libraries).
- Handle CORS explicitly; do not use wildcards in production.
- Keep logic out of route handlers: Route -> Controller/Service -> Database.

Follow Fastify's "Plugin System" documentation and Drizzle's "SQL-first" philosophy.