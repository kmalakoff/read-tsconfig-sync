const assert = require('assert');
const readSync = require('read-tsconfig-sync');

describe('exports .cjs', () => {
  it('readSync', () => {
    assert.equal(typeof readSync, 'function');
  });
});
