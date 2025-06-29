import type * as TSConfigSchema from './lib/TSConfigSchema.ts';

export * as TSConfigSchema from './lib/TSConfigSchema.ts';
export interface TSConfig {
  path: string;
  config: TSConfigSchema.TSConfigData;
}
