import EPub = require('epub');
export interface Options {
    print?: boolean;
    sturdy?: boolean;
    quiet?: boolean;
    chars?: boolean;
    text?: boolean;
}
export declare const countWords: (path: string, { print, sturdy, quiet, chars, text }?: Options) => Promise<string | number>;
export declare const newCountWords: (book: EPub) => Promise<number>;
export declare const countCharacters: (book: EPub) => Promise<number>;
export declare const readTextForBook: (book: EPub) => Promise<string[]>;
