import assert from 'assert';
import readSync from 'read-tsconfig-sync';

describe('exports .mjs', () => {
  it('readSync', () => {
    assert.equal(typeof readSync, 'function');
  });
});
