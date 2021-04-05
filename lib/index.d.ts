export interface Option {
    name?: string;
    inputDir?: string;
    cwd: string;
    cjsDir: string;
    esmDir: string;
    typesDir?: string;
}
export declare const cherryPick: (inputOptions: Option) => Promise<string[]>;
export declare const clean: (inputOptions: Option) => Promise<string[]>;
