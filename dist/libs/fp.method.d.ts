type AnyFn<T = any> = (...args: any[]) => T;
type TakeIntervalRes<T> = Array<{
    message: "success" | "error";
    data: T;
}>;
type basicType = {
    go: <T = any>(...args: any[]) => T;
    pipe: (...args: AnyFn[]) => AnyFn;
    take: <T = any>(limit: number, iter?: IterableIterator<any>) => Promise<T> | T;
    takeAll: AnyFn;
    takeUnique: AnyFn;
    range: (limit: number) => number[];
    map: <T = any>(fn: AnyFn, iter?: IterableIterator<any>) => Promise<T> | T;
    filter: <T = any>(fn: AnyFn, iter?: IterableIterator<any>) => Promise<T> | T;
    reduce: <T = any>(fn: AnyFn, args: any[]) => T;
    flatten: AnyFn;
    split: <T = any>(limit: number, iter?: IterableIterator<any>) => Promise<T> | T;
    takeIntervalFetch: <T = any>(options: {
        split: number;
        intervalMs: number;
        fetch: {
            method: "GET";
            retry: number;
            retryDelayMs: number;
        };
    }, iter?: IterableIterator<any>) => Promise<TakeIntervalRes<T>> | TakeIntervalRes<T>;
    takeIntervalPromise: <T>(options: {
        split: number;
        intervalMs: number;
        promise: {
            retry: number;
            retryDelayMs: number;
        };
    }, iter: IterableIterator<any> | any[]) => Promise<TakeIntervalRes<T>> | TakeIntervalRes<T>;
    takeInterval: <T = any>(options: {
        split: number;
        intervalMs: number;
        fn?: Generator;
    }, iter?: IterableIterator<any>) => Promise<T> | T;
    [key: string]: any;
};
export declare const _: basicType;
type LType = {
    range: (limit: number) => Generator<number>;
    map: <T = any>(fn: AnyFn) => Generator<T>;
    filter: <T = any>(fn: AnyFn) => Generator<T>;
    fetch: <T = any>(options: {
        method: "GET";
        retry: number;
        retryDelayMs: number;
    }, iter?: IterableIterator<any>) => Generator<T>;
    promise: <T = any>(options: {
        retry: number;
        retryDelayMs: number;
    }, iter?: IterableIterator<any>) => Generator<T>;
    flatten: <T = any>(iter: IterableIterator<any>) => Generator<T>;
    [key: string]: any;
};
export declare const L: LType;
type FType = {
    getIntervalPromiseSuccessResult: typeof getIntervalPromiseSuccessResult;
    [key: string]: any;
};
export declare const F: FType;
declare const getIntervalPromiseSuccessResult: <T>(promiseFnAry: AnyFn<Promise<T>>[], options: {
    split: number;
    intervalMs: number;
    promise: {
        retry: number;
        retryDelayMs: number;
    };
}) => Promise<T>;
export {};
