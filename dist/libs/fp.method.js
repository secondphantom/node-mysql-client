"use strict";
// import axios from "axios";
Object.defineProperty(exports, "__esModule", { value: true });
exports.F = exports.L = exports._ = void 0;
exports._ = {};
// go ,pipe
exports._.go = (...args) => exports._.reduce((acc, fn) => {
    return fn(acc);
}, args);
const goPromise = (a, fn) => a instanceof Promise ? a.then(fn) : fn(a);
exports._.pipe =
    (fn, ...fns) => (...args) => exports._.go(fn(...args), ...fns);
// curry
const curry = (fn) => {
    return (a, ..._) => {
        return _.length ? fn(a, ..._) : (..._) => fn(a, ..._);
    };
};
exports._.take = curry(function (limit, iter) {
    const result = [];
    iter = iter[Symbol.iterator]();
    return (function recur() {
        let cur;
        while (!(cur = iter.next()).done) {
            const a = cur.value;
            if (a instanceof Promise) {
                return a
                    .then((a) => {
                    result.push(a);
                    return result.length === limit ? result : recur();
                })
                    .catch((e) => (e === nop ? recur() : Promise.reject(e)));
            }
            result.push(a);
            if (result.length === limit)
                return result;
        }
        return result;
    })();
});
exports._.takeAll = exports._.take(Infinity);
exports._.takeUnique = function (iter) {
    const result = new Set();
    iter = iter[Symbol.iterator]();
    return (function recur() {
        let cur;
        while (!(cur = iter.next()).done) {
            const a = cur.value;
            if (a instanceof Promise) {
                return a
                    .then((a) => {
                    result.add(a);
                })
                    .catch((e) => (e === nop ? recur() : Promise.reject(e)));
            }
            result.add(a);
        }
        return Array.from(result);
    })();
};
exports._.range = function (limit) {
    const result = [];
    let count = 0;
    while (count < limit) {
        result.push(count);
        count++;
    }
    return result;
};
// map
exports._.map = curry(function (fn, iter) {
    const result = [];
    for (const a of iter) {
        result.push(fn(a));
    }
    return result;
});
// filter
exports._.filter = curry(function (fn, iter) {
    const result = [];
    for (const a of iter) {
        if (fn(a))
            result.push(a);
    }
    return result;
});
// reduce
exports._.reduce = curry(function (fn, acc, iter) {
    if (!iter) {
        iter = acc[Symbol.iterator]();
        acc = iter.next().value;
    }
    iter = iter[Symbol.iterator]();
    let cur;
    while (!(cur = iter.next()).done) {
        acc = fn(acc, cur.value);
    }
    return acc;
});
exports._.split = curry(function (limit, iter) {
    const result = [];
    let curLength = 0;
    for (const a of iter) {
        if (curLength === 0)
            result.push([]);
        result[result.length - 1].push(a);
        curLength++;
        if (curLength === limit)
            curLength = 0;
    }
    return result;
});
exports.L = {};
exports.L.range = function* (limit) {
    let count = 0;
    while (count < limit) {
        yield count++;
    }
};
exports.L.map = curry(function* (fn, iter) {
    for (const a of iter) {
        yield goPromise(a, fn);
    }
});
const nop = Symbol("nop");
exports.L.filter = curry(function* (fn, iter) {
    for (const a of iter) {
        const b = goPromise(a, fn);
        if (b instanceof Promise) {
            yield b.then((b) => (b ? a : Promise.reject(nop)));
        }
        else if (b) {
            yield a;
        }
    }
});
// L.fetch = curry(function* (
//   options: {
//     method: string;
//     retry: number;
//     retryDelayMs: number;
//   },
//   iter: IterableIterator<any>
// ) {
//   for (const a of iter) {
//     let curRetry = 0;
//     yield (function recur(): any {
//       const fetchAxios = axios(a, {
//         method: options.method,
//       })
//         .then((res) => ({ message: "success", data: res.data }))
//         .catch(async () => {
//           if (options.retryDelayMs) await delay(options.retryDelayMs);
//           curRetry++;
//           if (curRetry < options.retry) return recur();
//           return {
//             message: "error",
//             url: a,
//           };
//         });
//       if (a instanceof Promise) {
//         return a.then((a) => fetchAxios);
//       }
//       return fetchAxios;
//     })();
//   }
// });
exports.L.promise = curry(function* (options, iter) {
    for (const a of iter) {
        let curRetry = 0;
        yield (function recur() {
            const promiseResult = a
                .then(async (res) => ({ message: "success", data: await res() }))
                .catch(async (e) => {
                if (options.retryDelayMs)
                    await delay(options.retryDelayMs);
                curRetry++;
                if (curRetry < options.retry)
                    return recur();
                return {
                    message: "error",
                    error: e,
                };
            });
            return promiseResult;
        })();
    }
});
exports._.takeIntervalFetch = curry(function (options, iter) {
    return exports._.takeInterval({
        split: options.split,
        intervalMs: options.intervalMs,
        fn: exports.L.fetch(options.fetch),
    }, iter);
});
exports._.takeIntervalPromise = curry(function (options, iter) {
    return exports._.takeInterval({
        split: options.split,
        intervalMs: options.intervalMs,
        fn: exports.L.promise(options.promise),
    }, iter);
});
exports._.takeInterval = curry(function (options, iter) {
    let index = -1;
    return exports._.go(iter, exports._.split(options.split), exports._.map((a) => {
        index++;
        return delay(index * options.intervalMs, () => exports._.go(a, options.fn ? options.fn : exports.L.map((a) => a), exports._.takeAll));
    }), exports._.takeAll).then(exports._.flatten);
});
const delay = (delayMs, a) => new Promise((res) => {
    setTimeout(() => {
        if (typeof a === "function") {
            res(a());
        }
        else {
            res(a);
        }
    }, delayMs);
});
const isIterable = (a) => a && !!a[Symbol.iterator];
exports.L.flatten = function* (iter) {
    for (const a of iter) {
        if (isIterable(a) && typeof a != "string")
            yield* a;
        else
            yield a;
    }
};
exports._.flatten = exports._.pipe(exports.L.flatten, exports._.takeAll);
exports.F = {};
const getIntervalPromiseSuccessResult = async (promiseFnAry, options) => {
    const fetchResult = await exports._.takeIntervalPromise(options, promiseFnAry);
    const successResult = exports._.go(fetchResult, exports._.filter(({ message }) => message !== "error"), exports._.map(({ data }) => data), exports._.flatten);
    return successResult;
};
exports.F.getIntervalPromiseSuccessResult = getIntervalPromiseSuccessResult;
