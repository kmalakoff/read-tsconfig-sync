import assert from 'assert';
import path from 'path';
import readSync from 'read-tsconfig-sync';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

describe('TypeScript tsconfig.json compliance', () => {
  describe('array extends (TypeScript 5.0+)', () => {
    const ARRAY_EXTENDS_DIR = path.join(DATA_DIR, 'array-extends');

    it('should process extends array left-to-right (later configs override earlier)', () => {
      // TypeScript behavior: with extends: ["base1", "base2"]
      // - base1 is applied first
      // - base2 is applied second (overrides base1)
      // - child is applied last (overrides both)
      // So conflicting properties should come from base2, not base1
      const result = readSync(ARRAY_EXTENDS_DIR, 'child.json');

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
      const result = readSync(ARRAY_EXTENDS_DIR, 'child.json');

      // base2 defines include: ["base2-src"], which should override base1's include
      assert.deepEqual(result.config.include, ['base2-src'], 'include should be from base2 (last in extends array)');
      assert.deepEqual(result.config.exclude, ['base2-exclude'], 'exclude should be from base2 (last in extends array)');
    });

    it('should allow child to override inherited arrays', () => {
      const result = readSync(ARRAY_EXTENDS_DIR, 'child-with-include.json');

      // Child defines its own include, should replace inherited value
      assert.deepEqual(result.config.include, ['child-src'], 'child include should replace inherited include');
    });
  });

  describe('property merging behavior', () => {
    const MERGING_DIR = path.join(DATA_DIR, 'merging');

    it('should merge compilerOptions (child overrides base)', () => {
      const result = readSync(MERGING_DIR, 'child-replaces-arrays.json');

      // Base has target: "es5", child has target: "es2020"
      assert.equal(result.config.compilerOptions.target, 'es2020', 'child target should override base');

      // Base has lib: ["es5", "dom"], child does not define lib
      assert.deepEqual(result.config.compilerOptions.lib, ['es5', 'dom'], 'base lib should be preserved');
    });

    it('should replace include array (not merge)', () => {
      const result = readSync(MERGING_DIR, 'child-replaces-arrays.json');

      // TypeScript REPLACES arrays like include, exclude, files - does not merge them
      // Child has include: ["child-include"], should not include base's "base-include"
      assert.deepEqual(result.config.include, ['child-include'], 'include should be replaced, not merged');
    });

    it('should replace files array (not merge)', () => {
      const result = readSync(MERGING_DIR, 'child-replaces-arrays.json');

      // Child has files: ["child-file.ts"], should not include base's "base-file.ts"
      assert.deepEqual(result.config.files, ['child-file.ts'], 'files should be replaced, not merged');
    });

    it('should inherit arrays when child does not define them', () => {
      const result = readSync(MERGING_DIR, 'child-no-override.json');

      // Child does not define include/exclude/files, should inherit from base
      assert.deepEqual(result.config.include, ['base-include'], 'should inherit include from base');
      assert.deepEqual(result.config.exclude, ['base-exclude'], 'should inherit exclude from base');
      assert.deepEqual(result.config.files, ['base-file.ts'], 'should inherit files from base');
    });

    it('should inherit compilerOptions when child does not override', () => {
      const result = readSync(MERGING_DIR, 'child-no-override.json');

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
      const result = readSync(DATA_DIR, 'extend-config.json');
      assert.equal(result.config.extends, undefined, 'extends should be removed from final config');
    });
  });

  describe('references inheritance (should NOT inherit)', () => {
    const REFS_DIR = path.join(DATA_DIR, 'references');

    it('should NOT inherit references from base config', () => {
      // TypeScript spec: references is excluded from inheritance
      const result = readSync(REFS_DIR, 'child-no-refs.json');

      // Base has references, child does not define any
      // Result should NOT have references (they are not inherited)
      assert.equal(result.config.references, undefined, 'references should NOT be inherited from base');
    });

    it('should use child references when defined', () => {
      const result = readSync(REFS_DIR, 'child-own-refs.json');

      // Child defines its own references
      assert.deepEqual(result.config.references, [{ path: '../other' }], 'child references should be used');
    });

    it('should inherit other properties while excluding references', () => {
      const result = readSync(REFS_DIR, 'child-no-refs.json');

      // compilerOptions should still be inherited
      assert.equal(result.config.compilerOptions.composite, true, 'composite should be inherited');
      assert.equal(result.config.compilerOptions.target, 'es2020', 'target should be inherited');
      assert.equal(result.config.compilerOptions.outDir, 'dist', 'child outDir should be present');
    });
  });

  describe('compilerOptions arrays (replaced, not merged)', () => {
    const ARRAYS_DIR = path.join(DATA_DIR, 'compiler-options-arrays');

    it('should replace lib array (not merge)', () => {
      const result = readSync(ARRAYS_DIR, 'child.json');

      // Base has lib: ["es5", "dom"], child has lib: ["es2020"]
      // Child's lib should completely replace base's lib
      assert.deepEqual(result.config.compilerOptions.lib, ['es2020'], 'lib should be replaced, not merged');
    });

    it('should replace paths object (not merge)', () => {
      const result = readSync(ARRAYS_DIR, 'child.json');

      // Base has paths with @utils/* and @common/*, child has only @app/*
      // Child's paths should completely replace base's paths
      assert.deepEqual(result.config.compilerOptions.paths, { '@app/*': ['src/app/*'] }, 'paths should be replaced, not merged');
    });

    it('should inherit arrays when child does not override', () => {
      const result = readSync(ARRAYS_DIR, 'child.json');

      // Base has types: ["node", "jest"], child does not define types
      assert.deepEqual(result.config.compilerOptions.types, ['node', 'jest'], 'types should be inherited from base');

      // Base has typeRoots: ["./base-types"], child does not define typeRoots
      assert.deepEqual(result.config.compilerOptions.typeRoots, ['./base-types'], 'typeRoots should be inherited from base');
    });
  });

  describe('deep/nested extends chains', () => {
    const DEEP_DIR = path.join(DATA_DIR, 'deep-extends');

    it('should resolve deep extends chain (A extends B extends C)', () => {
      const result = readSync(DEEP_DIR, 'level3.json');

      // level1: target=es5, strict=true, include=["level1-src"]
      // level2 extends level1: target=es2015, module=commonjs
      // level3 extends level2: target=es2020, outDir=dist, include=["level3-src"]

      // target should be from level3 (overrides level2 which overrides level1)
      assert.equal(result.config.compilerOptions.target, 'es2020', 'target from level3');

      // module should be from level2 (level3 doesn't override)
      assert.equal(result.config.compilerOptions.module, 'commonjs', 'module from level2');

      // strict should be from level1 (not overridden)
      assert.equal(result.config.compilerOptions.strict, true, 'strict from level1');

      // outDir should be from level3
      assert.equal(result.config.compilerOptions.outDir, 'dist', 'outDir from level3');

      // include should be from level3 (replaces level1's include)
      assert.deepEqual(result.config.include, ['level3-src'], 'include from level3');
    });
  });

  describe('other top-level options (replaced, not merged)', () => {
    const OPTIONS_DIR = path.join(DATA_DIR, 'other-options');

    it('should replace watchOptions (not merge)', () => {
      const result = readSync(OPTIONS_DIR, 'child.json');

      // Base has watchOptions with watchFile and watchDirectory
      // Child defines watchOptions with only watchFile
      // Child's watchOptions should completely replace base's
      assert.deepEqual(result.config.watchOptions, { watchFile: 'dynamicPriorityPolling' }, 'watchOptions should be replaced, not merged');
    });

    it('should inherit buildOptions when child does not define', () => {
      const result = readSync(OPTIONS_DIR, 'child.json');

      // Child does not define buildOptions, should inherit from base
      assert.deepEqual(result.config.buildOptions, { verbose: true }, 'buildOptions should be inherited');
    });

    it('should inherit typeAcquisition when child does not define', () => {
      const result = readSync(OPTIONS_DIR, 'child.json');

      // Child does not define typeAcquisition, should inherit from base
      assert.deepEqual(result.config.typeAcquisition, { enable: true, include: ['jquery'] }, 'typeAcquisition should be inherited');
    });
  });

  describe('JSONC support (comments and trailing commas)', () => {
    const JSONC_DIR = path.join(DATA_DIR, 'jsonc');

    it('should parse tsconfig with comments', () => {
      // tsconfig.json supports JSONC format (JSON with comments)
      const result = readSync(JSONC_DIR, 'with-comments.json');

      assert.equal(result.config.compilerOptions.target, 'es2020', 'should parse target');
      assert.equal(result.config.compilerOptions.module, 'esnext', 'should parse module');
      assert.deepEqual(result.config.include, ['src'], 'should parse include');
    });

    it('should parse tsconfig with trailing commas', () => {
      // tsconfig.json supports trailing commas
      const result = readSync(JSONC_DIR, 'with-trailing-commas.json');

      assert.equal(result.config.compilerOptions.target, 'es2020', 'should parse target');
      assert.equal(result.config.compilerOptions.module, 'esnext', 'should parse module');
      assert.deepEqual(result.config.include, ['src'], 'should parse include');
    });
  });
});
