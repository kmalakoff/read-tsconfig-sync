import assert from 'assert';
import path from 'path';
import readSync from 'read-tsconfig-sync';
import url from 'url';

var __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
var DATA_DIR = path.join(__dirname, '..', 'data');

describe('TypeScript tsconfig.json compliance', () => {
  describe('array extends (TypeScript 5.0+)', () => {
    var ARRAY_EXTENDS_DIR = path.join(DATA_DIR, 'array-extends');

    it('should process extends array left-to-right (later configs override earlier)', () => {
      // TypeScript behavior: with extends: ["base1", "base2"]
      // - base1 is applied first
      // - base2 is applied second (overrides base1)
      // - child is applied last (overrides both)
      // So conflicting properties should come from base2, not base1
      var result = readSync(ARRAY_EXTENDS_DIR, 'child.json');

      // base1 has target: "es5", base2 has target: "es2020"
      // base2 should win since it comes later in the array
      assert.equal(result.config.compilerOptions.target, 'es2020', 'target should be es2020 from base2 (later in extends array)');

      // base1 has module: "commonjs", base2 does not define module
      // base1's module should be preserved
      assert.equal(result.config.compilerOptions.module, 'commonjs', 'module should be commonjs from base1');

      // base1 has strict: true, base2 does not define strict
      // base1's strict should be preserved
      assert.equal(result.config.compilerOptions.strict, true, 'strict should be true from base1');

      // base2 has sourceMap: true, base1 does not define sourceMap
      // base2's sourceMap should be present
      assert.equal(result.config.compilerOptions.sourceMap, true, 'sourceMap should be true from base2');

      // child has outDir: "dist"
      assert.equal(result.config.compilerOptions.outDir, 'dist', 'outDir should be dist from child');
    });

    it('should replace include/exclude with last base that defines them', () => {
      // When child does not define include/exclude, it inherits from the last base that does
      var result = readSync(ARRAY_EXTENDS_DIR, 'child.json');

      // base2 defines include: ["base2-src"], which should override base1's include
      assert.deepEqual(result.config.include, ['base2-src'], 'include should be from base2 (last in extends array)');
      assert.deepEqual(result.config.exclude, ['base2-exclude'], 'exclude should be from base2 (last in extends array)');
    });

    it('should allow child to override inherited arrays', () => {
      var result = readSync(ARRAY_EXTENDS_DIR, 'child-with-include.json');

      // Child defines its own include, should replace inherited value
      assert.deepEqual(result.config.include, ['child-src'], 'child include should replace inherited include');
    });
  });

  describe('property merging behavior', () => {
    var MERGING_DIR = path.join(DATA_DIR, 'merging');

    it('should merge compilerOptions (child overrides base)', () => {
      var result = readSync(MERGING_DIR, 'child-replaces-arrays.json');

      // Base has target: "es5", child has target: "es2020"
      assert.equal(result.config.compilerOptions.target, 'es2020', 'child target should override base');

      // Base has lib: ["es5", "dom"], child does not define lib
      assert.deepEqual(result.config.compilerOptions.lib, ['es5', 'dom'], 'base lib should be preserved');
    });

    it('should replace include array (not merge)', () => {
      var result = readSync(MERGING_DIR, 'child-replaces-arrays.json');

      // TypeScript REPLACES arrays like include, exclude, files - does not merge them
      // Child has include: ["child-include"], should not include base's "base-include"
      assert.deepEqual(result.config.include, ['child-include'], 'include should be replaced, not merged');
    });

    it('should replace files array (not merge)', () => {
      var result = readSync(MERGING_DIR, 'child-replaces-arrays.json');

      // Child has files: ["child-file.ts"], should not include base's "base-file.ts"
      assert.deepEqual(result.config.files, ['child-file.ts'], 'files should be replaced, not merged');
    });

    it('should inherit arrays when child does not define them', () => {
      var result = readSync(MERGING_DIR, 'child-no-override.json');

      // Child does not define include/exclude/files, should inherit from base
      assert.deepEqual(result.config.include, ['base-include'], 'should inherit include from base');
      assert.deepEqual(result.config.exclude, ['base-exclude'], 'should inherit exclude from base');
      assert.deepEqual(result.config.files, ['base-file.ts'], 'should inherit files from base');
    });

    it('should inherit compilerOptions when child does not override', () => {
      var result = readSync(MERGING_DIR, 'child-no-override.json');

      // Base has target: "es5", child does not override
      assert.equal(result.config.compilerOptions.target, 'es5', 'should inherit target from base');
      // Base has lib: ["es5", "dom"]
      assert.deepEqual(result.config.compilerOptions.lib, ['es5', 'dom'], 'should inherit lib from base');
      // Child adds sourceMap: true
      assert.equal(result.config.compilerOptions.sourceMap, true, 'child should add sourceMap');
    });
  });

  describe('extends removal', () => {
    it('should remove extends property from final config', () => {
      var result = readSync(DATA_DIR, 'extend-config.json');
      assert.equal(result.config.extends, undefined, 'extends should be removed from final config');
    });
  });
});
