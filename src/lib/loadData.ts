import fs from 'fs';
import isAbsolute from 'is-absolute';
import path from 'path';
import removeBOM from 'remove-bom-buffer';
import * as resolve from 'resolve';
import type { TSConfig, TSConfigSchema } from '../types.ts';
import mergeData from './mergeData.ts';
import parseJSONC from './parseJSONC.ts';

const resolveSync = (resolve.default ?? resolve).sync;
const isArray = Array.isArray || ((x) => Object.prototype.toString.call(x) === '[object Array]');
const moduleRegEx = /^[^./]|^\.[^./]|^\.\.[^/]/;
const pathRegEx = /\\|\//;

export default function loadData(specifier: string): TSConfig {
  const tsconfig = { path: specifier, config: parseJSONC(removeBOM(fs.readFileSync(specifier, 'utf8'))) as TSConfigSchema.TSConfigData };
  if (tsconfig.config.extends === undefined) return tsconfig;

  let extendData = {};
  const extendSpecifiers = isArray(tsconfig.config.extends) ? (tsconfig.config.extends as string[]).slice() : [tsconfig.config.extends as string];
  while (extendSpecifiers.length) {
    let extendSpecifier = extendSpecifiers.shift();
    if (moduleRegEx.test(extendSpecifier)) {
      // For bare package names (no path separator), resolve package.json then derive tsconfig.json path
      const hasSubpath = pathRegEx.test(extendSpecifier);
      const resolveTarget = hasSubpath ? extendSpecifier : `${extendSpecifier}/package.json`;
      const requirePath = resolveSync(resolveTarget, { basedir: path.dirname(specifier) });
      extendSpecifier = hasSubpath ? requirePath : path.join(path.dirname(requirePath), 'tsconfig.json');
    }

    const baseConfig = loadData(isAbsolute(extendSpecifier) ? extendSpecifier : path.join(path.dirname(tsconfig.path), extendSpecifier));
    extendData = mergeData(extendData, baseConfig.config);
  }

  tsconfig.config = mergeData(extendData, tsconfig.config);
  delete tsconfig.config.extends;
  return tsconfig;
}
