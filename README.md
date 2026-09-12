# read-tsconfig-sync

Loads tsconfig.json files including extends.

```bash
npm install read-tsconfig-sync
```

```js
import readSync from 'read-tsconfig-sync';

const loaded = readSync(process.cwd());
if (loaded) {
  console.log(loaded.path);
  console.log(loaded.config.compilerOptions);
}
```

The first argument is the directory where the search starts. Pass a second argument
to search for a name other than `tsconfig.json`:

```js
const loaded = readSync('packages/example', 'tsconfig.build.json');
```

The result contains the merged config and the path of the file that was loaded.
Configuration inherited through `extends` is included. If no matching file is
found, the function returns `null`; relative paths are resolved from the current
working directory.

## Documentation

[API Docs](https://kmalakoff.github.io/read-tsconfig-sync/)
