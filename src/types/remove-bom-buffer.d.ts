declare module 'remove-bom-buffer' {
  function removeBOM(buf: Buffer): Buffer;
  function removeBOM(str: string): string;
  export = removeBOM;
}
