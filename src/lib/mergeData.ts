import type { TSConfigSchema } from '../types.ts';

export default function mergeData(base: TSConfigSchema.TSConfigData, overrides: TSConfigSchema.TSConfigData): TSConfigSchema.TSConfigData {
  var compilerOptions = { ...(base.compilerOptions || {}), ...(overrides.compilerOptions || {}) };

  // TypeScript spec: references is excluded from inheritance
  // Extract references from base so it's not inherited
  var { references: _baseRefs, ...baseWithoutRefs } = base as TSConfigSchema.TSConfigData & { references?: unknown };

  return { ...baseWithoutRefs, ...overrides, compilerOptions };
}
