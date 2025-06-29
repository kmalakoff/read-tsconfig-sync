import fs from 'fs';
import isAbsolute from 'is-absolute';
import Module from 'module';
import path from 'path';
import removeBOM from 'remove-bom-buffer';
import type { TSConfig } from '../types.ts';
import mergeData from './mergeData.ts';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const isArray = Array.isArray || ((x) => Object.prototype.toString.call(x) === '[object Array]');
const moduleRegEx = /^[^./]|^\.[^./]|^\.\.[^/]/;
const pathRegEx = /\\|\//g;

export default function loadData(specifier: string): TSConfig {
  const tsconfig = { path: specifier, config: JSON.parse(removeBOM(fs.readFileSync(specifier, 'utf8'))) };
  if (tsconfig.config.extends === undefined) return tsconfig;

  let extendData = {};
  const extendSpecifiers = isArray(tsconfig.config.extends) ? (tsconfig.config.extends as string[]) : [tsconfig.config.extends as string];
  while (extendSpecifiers.length) {
    let extendSpecifier = extendSpecifiers.pop();
    if (moduleRegEx.test(extendSpecifier)) {
      const requirePath = _require.resolve(extendSpecifier, { paths: [specifier] });
      extendSpecifier = pathRegEx.test(extendSpecifier) ? requirePath : path.join.apply(null, requirePath.split(extendSpecifier).slice(0, -1).concat([extendSpecifier, 'tsconfig.json']));
    }

    const baseConfig = loadData(isAbsolute(extendSpecifier) ? extendSpecifier : path.join(path.dirname(tsconfig.path), extendSpecifier));
    extendData = mergeData(extendData, baseConfig.config);
  }

  tsconfig.config = mergeData(extendData, tsconfig.config);
  delete tsconfig.config.extends;
  return tsconfig;
}
