declare module 'opentype.js' {
  interface Path {
    toPathData(decimalPlaces?: number): string;
    toSVG(decimalPlaces?: number): string;
  }

  interface Font {
    getPath(text: string, x: number, y: number, fontSize: number, options?: object): Path;
    getAdvanceWidth(text: string, fontSize: number, options?: object): number;
  }

  function loadSync(path: string): Font;
  function load(path: string): Promise<Font>;
}
