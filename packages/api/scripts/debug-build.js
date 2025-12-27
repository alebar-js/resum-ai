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
console.log('API ROOT:', apiRoot);
console.log('REPO ROOT:', repoRoot);
console.log('Node version:', process.version);

// 2. TypeScript version
console.log('\n--- TYPESCRIPT VERSIONS ---');
try {
  const tscVersion = execSync('npx tsc --version', { encoding: 'utf8', cwd: apiRoot }).trim();
  console.log('tsc --version (api):', tscVersion);
} catch (e) {
  console.log('tsc --version (api): ERROR -', e.message);
}

try {
  const tscVersionRoot = execSync('npx tsc --version', { encoding: 'utf8', cwd: repoRoot }).trim();
  console.log('tsc --version (root):', tscVersionRoot);
} catch (e) {
  console.log('tsc --version (root): ERROR -', e.message);
}

// 3. Drizzle version
console.log('\n--- DRIZZLE VERSION ---');
try {
  const drizzlePkg = resolve(apiRoot, 'node_modules/drizzle-orm/package.json');
  if (existsSync(drizzlePkg)) {
    const pkg = JSON.parse(readFileSync(drizzlePkg, 'utf8'));
    console.log('drizzle-orm version:', pkg.version);
  } else {
    console.log('drizzle-orm package.json not found at:', drizzlePkg);
    // Try from repo root
    const drizzlePkgRoot = resolve(repoRoot, 'node_modules/drizzle-orm/package.json');
    if (existsSync(drizzlePkgRoot)) {
      const pkg = JSON.parse(readFileSync(drizzlePkgRoot, 'utf8'));
      console.log('drizzle-orm version (from root):', pkg.version);
    }
  }
} catch (e) {
  console.log('drizzle-orm version: ERROR -', e.message);
}

// 4. tsconfig.json contents
console.log('\n--- TSCONFIG (api) ---');
const apiTsconfig = resolve(apiRoot, 'tsconfig.json');
if (existsSync(apiTsconfig)) {
  console.log(readFileSync(apiTsconfig, 'utf8'));
} else {
  console.log('NOT FOUND:', apiTsconfig);
}

console.log('\n--- TSCONFIG (root) ---');
const rootTsconfig = resolve(repoRoot, 'tsconfig.json');
if (existsSync(rootTsconfig)) {
  console.log(readFileSync(rootTsconfig, 'utf8'));
} else {
  console.log('NOT FOUND:', rootTsconfig);
}

// 5. Schema file
console.log('\n--- SCHEMA FILE (src/db/schema.ts) ---');
const schemaPath = resolve(apiRoot, 'src/db/schema.ts');
if (existsSync(schemaPath)) {
  const schema = readFileSync(schemaPath, 'utf8');
  console.log(schema);
  
  // Check if users table has the expected columns
  console.log('\n--- SCHEMA ANALYSIS ---');
  const hasName = schema.includes("name: varchar");
  const hasPicture = schema.includes("picture: varchar");
  const hasGoogleId = schema.includes("googleId: varchar");
  const hasUpdatedAt = schema.includes("updatedAt: timestamp");
  console.log('Has name column:', hasName);
  console.log('Has picture column:', hasPicture);
  console.log('Has googleId column:', hasGoogleId);
  console.log('Has updatedAt column:', hasUpdatedAt);
} else {
  console.log('NOT FOUND:', schemaPath);
}

// 6. Check @app/shared resolution
console.log('\n--- @app/shared RESOLUTION ---');
const sharedPaths = [
  resolve(apiRoot, 'node_modules/@app/shared'),
  resolve(repoRoot, 'node_modules/@app/shared'),
  resolve(repoRoot, 'packages/shared'),
];
for (const p of sharedPaths) {
  console.log(`${p}: ${existsSync(p) ? 'EXISTS' : 'NOT FOUND'}`);
  if (existsSync(p)) {
    const pkgPath = resolve(p, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      console.log(`  - main: ${pkg.main}`);
      console.log(`  - types: ${pkg.types}`);
    }
    // List contents
    try {
      const contents = readdirSync(p);
      console.log(`  - contents: ${contents.join(', ')}`);
    } catch (e) {
      console.log(`  - contents: ERROR - ${e.message}`);
    }
  }
}

// 7. Check if shared/dist exists and has types
console.log('\n--- @app/shared DIST ---');
const sharedDist = resolve(repoRoot, 'packages/shared/dist');
if (existsSync(sharedDist)) {
  const contents = readdirSync(sharedDist);
  console.log('packages/shared/dist contents:', contents.join(', '));
} else {
  console.log('packages/shared/dist NOT FOUND');
}

// 8. List all tsconfig files in the repo
console.log('\n--- ALL TSCONFIG FILES ---');
try {
  const tsconfigFiles = execSync('find . -name "tsconfig.json" -not -path "*/node_modules/*" 2>/dev/null || true', {
    encoding: 'utf8',
    cwd: repoRoot,
  }).trim();
  console.log(tsconfigFiles || 'No tsconfig files found');
} catch (e) {
  console.log('ERROR finding tsconfig files:', e.message);
}

// 9. Check what TypeScript sees for the schema
console.log('\n--- TYPESCRIPT TYPE CHECK (schema only) ---');
try {
  const result = execSync('npx tsc --noEmit --pretty false src/db/schema.ts 2>&1 || true', {
    encoding: 'utf8',
    cwd: apiRoot,
  });
  console.log(result || '(no errors)');
} catch (e) {
  console.log('ERROR:', e.message);
}

// 10. Check what TypeScript sees for auth.ts
console.log('\n--- TYPESCRIPT TYPE CHECK (auth.ts only) ---');
try {
  const result = execSync('npx tsc --noEmit --pretty false src/plugins/auth.ts 2>&1 || true', {
    encoding: 'utf8',
    cwd: apiRoot,
  });
  console.log(result || '(no errors)');
} catch (e) {
  console.log('ERROR:', e.message);
}

console.log('\n========== END DEBUG INFO ==========\n');

