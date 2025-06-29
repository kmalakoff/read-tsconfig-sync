import type { TSConfigSchema } from '../types.ts';

export default function mergeData(base: TSConfigSchema.TSConfigData, overrides: TSConfigSchema.TSConfigData): TSConfigSchema.TSConfigData {
  const compilerOptions = { ...(base.compilerOptions || {}), ...(overrides.compilerOptions || {}) };
  return { ...base, ...overrides, compilerOptions };
}
