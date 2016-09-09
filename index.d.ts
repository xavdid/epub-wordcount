import { Options } from './interfaces';
export { Options as WordCountOptions } from './interfaces';
export declare function countWords(path: string, options?: Options): Promise<number>;
