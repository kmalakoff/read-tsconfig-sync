import assert from 'assert';
import path from 'path';
import readSync from 'read-tsconfig-sync';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SRC_DIR = path.join(DATA_DIR, 'src');
const SRC_CONFIG = readSync(SRC_DIR, 'tsconfig.json');
const ROOT_DIR = path.dirname(path.dirname(__dirname));
const MODULE_CONFIG = readSync(path.join(ROOT_DIR, 'node_modules', '@sourcegraph', 'tsconfig', 'tsconfig.json'));
const TSDS_CONFIG = readSync(path.join(ROOT_DIR, 'node_modules', 'tsds-config', 'tsconfig.json'));

describe('read', () => {
  it('default name', () => {
    const tsconfigExtended = readSync(SRC_DIR);
    assert.equal(tsconfigExtended.path, path.join(path.dirname(SRC_DIR), 'tsconfig.json'));
    assert.deepEqual(tsconfigExtended.config, SRC_CONFIG.config);
  });

  it('extend-config.json', () => {
    const tsconfigExtended = readSync(SRC_DIR, 'extend-config.json');
    assert.equal(tsconfigExtended.path, path.join(path.dirname(SRC_DIR), 'extend-config.json'));
    assert.deepEqual(tsconfigExtended.config, SRC_CONFIG.config);
  });

  it('extend-absolute-config.json', () => {
    const tsconfigExtended = readSync(SRC_DIR, 'extend-absolute-config.json');
    assert.equal(tsconfigExtended.path, path.join(path.dirname(SRC_DIR), 'extend-absolute-config.json'));
    assert.equal(tsconfigExtended.config.compilerOptions.moduleResolution, 'classic');
    tsconfigExtended.config.compilerOptions.moduleResolution = 'node';
    assert.deepEqual(tsconfigExtended.config, MODULE_CONFIG.config);
  });

  it('extend-absolute-config-file.json', () => {
    const tsconfigExtended = readSync(SRC_DIR, 'extend-absolute-config-file.json');
    assert.equal(tsconfigExtended.path, path.join(path.dirname(SRC_DIR), 'extend-absolute-config-file.json'));
    assert.equal(tsconfigExtended.config.compilerOptions.moduleResolution, 'classic');
    tsconfigExtended.config.compilerOptions.moduleResolution = 'node';
    assert.deepEqual(tsconfigExtended.config, MODULE_CONFIG.config);
  });

  it('extend-relative-config-file.json', () => {
    const tsconfigExtended = readSync(SRC_DIR, 'extend-relative-config-file.json');
    assert.equal(tsconfigExtended.path, path.join(path.dirname(SRC_DIR), 'extend-relative-config-file.json'));
    assert.equal(tsconfigExtended.config.compilerOptions.moduleResolution, 'classic');
    tsconfigExtended.config.compilerOptions.moduleResolution = 'node';
    assert.deepEqual(tsconfigExtended.config, MODULE_CONFIG.config);
  });

  it('package subpath extends should work consistently across multiple calls', () => {
    // This tests the global regex bug: /\\|\//g has state that causes alternating results
    // When extends has a path separator (like @sourcegraph/tsconfig/tsconfig.json),
    // the regex with global flag returns true, then false, then true on subsequent calls
    for (let i = 0; i < 5; i++) {
      const tsconfigExtended = readSync(SRC_DIR, 'extend-absolute-config-file.json');
      assert.equal(tsconfigExtended.path, path.join(path.dirname(SRC_DIR), 'extend-absolute-config-file.json'), `Failed on iteration ${i}`);
      assert.equal(tsconfigExtended.config.compilerOptions.moduleResolution, 'classic', `Failed on iteration ${i}`);
    }
  });
});

describe('module resolution', () => {
  it('extends non-scoped package (tsds-config)', () => {
    const tsconfig = readSync(DATA_DIR, 'extend-module.json');
    assert.equal(tsconfig.path, path.join(DATA_DIR, 'extend-module.json'));
    assert.equal(tsconfig.config.compilerOptions.strict, true);
    // Should inherit from tsds-config
    assert.deepEqual(tsconfig.config.compilerOptions.lib, TSDS_CONFIG.config.compilerOptions.lib);
  });

  it('extends non-scoped package with subpath (tsds-config/tsconfig.json)', () => {
    const tsconfig = readSync(DATA_DIR, 'extend-module-subpath.json');
    assert.equal(tsconfig.path, path.join(DATA_DIR, 'extend-module-subpath.json'));
    assert.equal(tsconfig.config.compilerOptions.strict, true);
    // Should inherit from tsds-config
    assert.deepEqual(tsconfig.config.compilerOptions.lib, TSDS_CONFIG.config.compilerOptions.lib);
  });

  it('extends scoped package (@sourcegraph/tsconfig)', () => {
    const tsconfig = readSync(SRC_DIR, 'extend-absolute-config.json');
    assert.equal(tsconfig.config.compilerOptions.moduleResolution, 'classic');
  });

  it('extends scoped package with subpath (@sourcegraph/tsconfig/tsconfig.json)', () => {
    const tsconfig = readSync(SRC_DIR, 'extend-absolute-config-file.json');
    assert.equal(tsconfig.config.compilerOptions.moduleResolution, 'classic');
  });
});
