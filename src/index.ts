import moduleRoot from 'module-root-sync';
import path from 'path';
import loadData from './lib/loadData.ts';
import type { TSConfig } from './types.ts';

export * from './types.ts';

export default function loadConfigSync(dir: string, name?: string): TSConfig {
  if (name === undefined) name = 'tsconfig.json';
  let configDir: string | null = null;
  try {
    configDir = moduleRoot(dir, { name });
  } catch (_) {}
  if (!configDir) return null;

  const configPath = path.join(configDir, name);
  const res = loadData(configPath);
  return res;
}
