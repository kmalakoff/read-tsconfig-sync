import fs from 'fs';
import isAbsolute from 'is-absolute';
import path from 'path';
import removeBOM from 'remove-bom-buffer';
import * as resolve from 'resolve';
import type { TSConfig, TSConfigSchema } from '../types.ts';
import mergeData from './mergeData.ts';
import parseJSONC from './parseJSONC.ts';

const resolveSync = resolve.sync || resolve.default.sync;
const isArray = Array.isArray || ((x) => Object.prototype.toString.call(x) === '[object Array]');
const moduleRegEx = /^[^./]|^\.[^./]|^\.\.[^/]/;
const pathRegEx = /\\|\//;

export default function loadData(specifier: string): TSConfig {
  const tsconfig = { path: specifier, config: parseJSONC(removeBOM(fs.readFileSync(specifier, 'utf8'))) as TSConfigSchema.TSConfigData };
  if (tsconfig.config.extends === undefined) return tsconfig;

  var extendData = {};
  var extendSpecifiers = isArray(tsconfig.config.extends) ? (tsconfig.config.extends as string[]).slice() : [tsconfig.config.extends as string];
  while (extendSpecifiers.length) {
    var extendSpecifier = extendSpecifiers.shift();
    if (moduleRegEx.test(extendSpecifier)) {
      const requirePath = resolveSync(extendSpecifier, { basedir: path.dirname(specifier) });
      extendSpecifier = pathRegEx.test(extendSpecifier) ? requirePath : path.join.apply(null, requirePath.split(extendSpecifier).slice(0, -1).concat([extendSpecifier, 'tsconfig.json']));
    }

    const baseConfig = loadData(isAbsolute(extendSpecifier) ? extendSpecifier : path.join(path.dirname(tsconfig.path), extendSpecifier));
    extendData = mergeData(extendData, baseConfig.config);
  }

  tsconfig.config = mergeData(extendData, tsconfig.config);
  delete tsconfig.config.extends;
  return tsconfig;
}
