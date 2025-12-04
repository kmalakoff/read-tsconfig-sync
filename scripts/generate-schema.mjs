#!/usr/bin/env node

/**
 * Generates TSConfigSchema.ts from the official SchemaStore JSON schema.
 *
 * Usage: node scripts/generate-schema.mjs
 *
 * Requires: json-schema-to-typescript (installed as devDependency)
 */

import { writeFileSync } from 'fs';
import { compile } from 'json-schema-to-typescript';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_URL = 'https://json.schemastore.org/tsconfig.json';
const OUTPUT_PATH = join(__dirname, '..', 'src', 'lib', 'TSConfigSchema.ts');

async function fetchSchema() {
  console.log('Fetching schema from', SCHEMA_URL);
  const response = await fetch(SCHEMA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function generateTypes(schema) {
  console.log('Generating TypeScript types...');

  // Compile the schema to TypeScript
  let ts = await compile(schema, 'TSConfigData', {
    bannerComment: `// Auto-generated from ${SCHEMA_URL}
// Run: npm run generate:schema
// Source: https://github.com/SchemaStore/schemastore/blob/master/src/schemas/json/tsconfig.json
`,
    additionalProperties: false,
    strictIndexSignatures: false,
    enableConstEnums: false,
    declareExternallyReferenced: true,
    unreachableDefinitions: false,
  });

  // The schema's root type has a long name - add a shorter alias for backwards compatibility
  // Find the root type name (usually something like JSONSchemaForTheTypeScriptCompilerSConfigurationFile)
  const rootTypeMatch = ts.match(/^export type (\w+) =/m);
  if (rootTypeMatch && rootTypeMatch[1] !== 'TSConfigData') {
    const rootTypeName = rootTypeMatch[1];
    ts += `\n// Alias for backwards compatibility\nexport type TSConfigData = ${rootTypeName};\n`;
  }

  // Fix: The schema uses a union for FilesDefinition | ExcludeDefinition | IncludeDefinition | ReferencesDefinition
  // but TypeScript actually allows all of these properties together. Change to intersection.
  ts = ts.replace(/\(FilesDefinition \| ExcludeDefinition \| IncludeDefinition \| ReferencesDefinition\)/g, 'FilesDefinition & ExcludeDefinition & IncludeDefinition & ReferencesDefinition');

  // Fix: Replace empty object type {} with Record<string, unknown> to avoid linting errors
  ts = ts.replace(/\{\} \| null/g, 'Record<string, unknown> | null');
  ts = ts.replace(/: \{\};/g, ': Record<string, unknown>;');

  return ts;
}

async function main() {
  try {
    const schema = await fetchSchema();
    const types = await generateTypes(schema);

    writeFileSync(OUTPUT_PATH, types, 'utf8');
    console.log('Generated', OUTPUT_PATH);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
