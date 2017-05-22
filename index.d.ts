export interface Options {
    print?: boolean;
    sturdy?: boolean;
    quiet?: boolean;
}
export declare function countWords(path: string, options?: Options): Promise<number>;
