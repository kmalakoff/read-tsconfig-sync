import assert from 'assert';
import path from 'path';
// @ts-ignore
import readSync from 'read-tsconfig-sync';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');
const SRC_CONFIG = readSync(SRC_DIR, 'tsconfig.json');
const MODULE_CONFIG = readSync(path.dirname(path.dirname(__dirname)), 'tsconfig.json');

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
    assert.deepEqual(tsconfigExtended.config, MODULE_CONFIG.config);
  });

  it('extend-absolute-config-file.json', () => {
    const tsconfigExtended = readSync(SRC_DIR, 'extend-absolute-config-file.json');
    assert.equal(tsconfigExtended.path, path.join(path.dirname(SRC_DIR), 'extend-absolute-config-file.json'));
    assert.deepEqual(tsconfigExtended.config, MODULE_CONFIG.config);
  });
});
