## read-tsconfig-sync

Loads tsconfig.json files including extends.

```
import readSync from 'read-tsconfig-sync';

const loadedCWD = readSync(); // { path: 'path/to/tsconfig.json', config: { /* compilerOptions */ } }

const loadedPath = readSync('path/to'); // { path: 'path/to/tsconfig.json', config: { /* compilerOptions */ } }

const loadedPathName = readSync('path/to', 'tsconfig-es5.json'); // { path: 'path/to/tsconfig-es5.json', config: { /* compilerOptions */ } }

```

### Documentation

[API Docs](https://kmalakoff.github.io/read-tsconfig-sync/)
