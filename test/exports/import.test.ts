import assert from 'assert';
// @ts-ignore
import readSync from 'read-tsconfig-sync';

describe('exports .ts', () => {
  it('readSync', () => {
    assert.equal(typeof readSync, 'function');
  });
});
