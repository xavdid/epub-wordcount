export interface Options {
    print?: boolean;
    sturdy?: boolean;
    quiet?: boolean;
    chars?: boolean;
}
export declare function countWords(path: string, options?: Options): Promise<number>;
