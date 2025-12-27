#!/usr/bin/env node
/**
 * Debug script to understand Vercel build environment
 */
import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(__dirname, '..');
const repoRoot = resolve(apiRoot, '../..');

console.log('\n========== DEBUG BUILD INFO ==========\n');

// 1. Environment info
console.log('--- ENVIRONMENT ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CWD:', process.cwd());
console.log('Node version:', process.version);

// 2. TypeScript version
console.log('\n--- TYPESCRIPT VERSION ---');
try {
  const tscVersion = execSync('npx tsc --version 2>/dev/null', { encoding: 'utf8', cwd: apiRoot }).trim();
  console.log('tsc --version:', tscVersion);
} catch (e) {
  console.log('tsc --version: ERROR -', e.message);
}

// 3. Drizzle version
console.log('\n--- DRIZZLE VERSION ---');
try {
  const drizzlePkg = resolve(apiRoot, 'node_modules/drizzle-orm/package.json');
  if (existsSync(drizzlePkg)) {
    const pkg = JSON.parse(readFileSync(drizzlePkg, 'utf8'));
    console.log('drizzle-orm version:', pkg.version);
  } else {
    // Try from repo root (hoisted)
    const drizzlePkgRoot = resolve(repoRoot, 'node_modules/drizzle-orm/package.json');
    if (existsSync(drizzlePkgRoot)) {
      const pkg = JSON.parse(readFileSync(drizzlePkgRoot, 'utf8'));
      console.log('drizzle-orm version (hoisted):', pkg.version);
    } else {
      console.log('drizzle-orm: NOT FOUND');
    }
  }
} catch (e) {
  console.log('drizzle-orm version: ERROR -', e.message);
}

// 4. Schema file analysis
console.log('\n--- SCHEMA ANALYSIS ---');
const schemaPath = resolve(apiRoot, 'src/db/schema.ts');
if (existsSync(schemaPath)) {
  const schema = readFileSync(schemaPath, 'utf8');
  const hasName = schema.includes("name: varchar");
  const hasPicture = schema.includes("picture: varchar");
  const hasGoogleId = schema.includes("googleId: varchar");
  const hasUpdatedAt = schema.includes("updatedAt: timestamp");
  console.log('Has name column:', hasName);
  console.log('Has picture column:', hasPicture);
  console.log('Has googleId column:', hasGoogleId);
  console.log('Has updatedAt column:', hasUpdatedAt);
  
  // Count total columns in users table
  const usersMatch = schema.match(/export const users = pgTable\('users', \{([^}]+)\}/s);
  if (usersMatch) {
    const columnCount = (usersMatch[1].match(/\w+:\s*(uuid|varchar|timestamp|text|boolean|jsonb)/g) || []).length;
    console.log('Users table column count:', columnCount);
  }
} else {
  console.log('Schema file NOT FOUND:', schemaPath);
}

// 5. @app/shared resolution
console.log('\n--- @app/shared RESOLUTION ---');
const sharedPaths = [
  resolve(apiRoot, 'node_modules/@app/shared'),
  resolve(repoRoot, 'packages/shared'),
];
for (const p of sharedPaths) {
  if (existsSync(p)) {
    const pkgPath = resolve(p, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      console.log(`${p.replace(repoRoot, '.')}:`);
      console.log(`  main: ${pkg.main}, types: ${pkg.types}`);
    }
  }
}

// 6. Check shared/dist exists
const sharedDist = resolve(repoRoot, 'packages/shared/dist');
if (existsSync(sharedDist)) {
  const contents = readdirSync(sharedDist).filter(f => f.endsWith('.d.ts'));
  console.log('shared/dist type declarations:', contents.join(', '));
} else {
  console.log('WARNING: packages/shared/dist NOT FOUND');
}

console.log('\n========== END DEBUG INFO ==========\n');
