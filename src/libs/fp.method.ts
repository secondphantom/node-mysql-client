// import axios from "axios";

type AnyFn<T = any> = (...args: any[]) => T;

type TakeIntervalRes<T> = Array<{ message: "success" | "error"; data: T }>;

type basicType = {
  go: <T = any>(...args: any[]) => T;
  pipe: (...args: AnyFn[]) => AnyFn;
  take: <T = any>(
    limit: number,
    iter?: IterableIterator<any>
  ) => Promise<T> | T;
  takeAll: AnyFn;
  takeUnique: AnyFn;
  range: (limit: number) => number[];
  map: <T = any>(fn: AnyFn, iter?: IterableIterator<any>) => Promise<T> | T;
  filter: <T = any>(fn: AnyFn, iter?: IterableIterator<any>) => Promise<T> | T;
  reduce: <T = any>(fn: AnyFn, args: any[]) => T;
  flatten: AnyFn;
  split: <T = any>(
    limit: number,
    iter?: IterableIterator<any>
  ) => Promise<T> | T;
  takeIntervalFetch: <T = any>(
    options: {
      split: number;
      intervalMs: number;
      fetch: {
        method: "GET";
        retry: number;
        retryDelayMs: number;
      };
    },
    iter?: IterableIterator<any>
  ) => Promise<TakeIntervalRes<T>> | TakeIntervalRes<T>;
  takeIntervalPromise: <T>(
    options: {
      split: number;
      intervalMs: number;
      promise: {
        retry: number;
        retryDelayMs: number;
      };
    },
    iter: IterableIterator<any> | any[]
  ) => Promise<TakeIntervalRes<T>> | TakeIntervalRes<T>;
  takeInterval: <T = any>(
    options: {
      split: number;
      intervalMs: number;
      fn?: Generator;
    },
    iter?: IterableIterator<any>
  ) => Promise<T> | T;
  [key: string]: any;
};

export const _ = {} as basicType;

// go ,pipe
_.go = (...args: any[]) =>
  _.reduce((acc: any, fn: AnyFn) => {
    return fn(acc);
  }, args);

const goPromise = (a: any, fn: AnyFn) =>
  a instanceof Promise ? a.then(fn) : fn(a);

_.pipe =
  (fn: AnyFn, ...fns: AnyFn[]) =>
  (...args: any[]) =>
    _.go(fn(...args), ...fns);
// curry
const curry = (fn: AnyFn) => {
  return (a: any, ..._: any[]) => {
    return _.length ? fn(a, ..._) : (..._: any[]) => fn(a, ..._);
  };
};

_.take = curry(function (limit: number, iter: IterableIterator<any>) {
  const result: any[] = [];
  iter = iter[Symbol.iterator]();

  return (function recur(): any {
    let cur;
    while (!(cur = iter.next()).done) {
      const a = cur.value;

      if (a instanceof Promise) {
        return a
          .then((a: any) => {
            result.push(a);
            return result.length === limit ? result : recur();
          })
          .catch((e) => (e === nop ? recur() : Promise.reject(e)));
      }

      result.push(a);
      if (result.length === limit) return result;
    }
    return result;
  })();
});

_.takeAll = _.take(Infinity) as AnyFn;

_.takeUnique = function (iter: IterableIterator<any>) {
  const result = new Set<any>();
  iter = iter[Symbol.iterator]();

  return (function recur(): any {
    let cur;
    while (!(cur = iter.next()).done) {
      const a = cur.value;
      if (a instanceof Promise) {
        return a
          .then((a: any) => {
            result.add(a);
          })
          .catch((e) => (e === nop ? recur() : Promise.reject(e)));
      }
      result.add(a);
    }
    return Array.from(result);
  })();
};

_.range = function (limit: number) {
  const result: number[] = [];
  let count = 0;
  while (count < limit) {
    result.push(count);
    count++;
  }
  return result;
};

// map
_.map = curry(function (fn: AnyFn, iter: IterableIterator<any>) {
  const result: any[] = [];
  for (const a of iter) {
    result.push(fn(a));
  }

  return result;
});

// filter
_.filter = curry(function (fn: AnyFn, iter: IterableIterator<any>) {
  const result: any[] = [];
  for (const a of iter) {
    if (fn(a)) result.push(a);
  }
  return result;
});
// reduce
_.reduce = curry(function (fn: AnyFn, acc: any, iter: IterableIterator<any>) {
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

_.split = curry(function (limit: number, iter: IterableIterator<any>) {
  const result: any[] = [];
  let curLength = 0;

  for (const a of iter) {
    if (curLength === 0) result.push([]);
    result[result.length - 1].push(a);
    curLength++;
    if (curLength === limit) curLength = 0;
  }
  return result;
});

type LType = {
  range: (limit: number) => Generator<number>;
  map: <T = any>(fn: AnyFn) => Generator<T>;
  filter: <T = any>(fn: AnyFn) => Generator<T>;
  fetch: <T = any>(
    options: {
      method: "GET";
      retry: number;
      retryDelayMs: number;
    },
    iter?: IterableIterator<any>
  ) => Generator<T>;
  promise: <T = any>(
    options: {
      retry: number;
      retryDelayMs: number;
    },
    iter?: IterableIterator<any>
  ) => Generator<T>;
  flatten: <T = any>(iter: IterableIterator<any>) => Generator<T>;
  [key: string]: any;
};

export const L = {} as LType;

L.range = function* (limit: number) {
  let count = 0;
  while (count < limit) {
    yield count++;
  }
};

L.map = curry(function* (fn: AnyFn, iter: IterableIterator<any>) {
  for (const a of iter) {
    yield goPromise(a, fn);
  }
});

const nop = Symbol("nop");

L.filter = curry(function* (fn: AnyFn, iter: IterableIterator<any>) {
  for (const a of iter) {
    const b = goPromise(a, fn);

    if (b instanceof Promise) {
      yield b.then((b) => (b ? a : Promise.reject(nop)));
    } else if (b) {
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

L.promise = curry(function* (
  options: {
    retry: number;
    retryDelayMs: number;
  },
  iter: IterableIterator<any>
) {
  for (const a of iter) {
    let curRetry = 0;

    yield (function recur(): any {
      const promiseResult = a
        .then(async (res: any) => ({ message: "success", data: await res() }))
        .catch(async (e: any) => {
          if (options.retryDelayMs) await delay(options.retryDelayMs);
          curRetry++;
          if (curRetry < options.retry) return recur();
          return {
            message: "error",
            error: e,
          };
        });
      return promiseResult;
    })();
  }
});

_.takeIntervalFetch = curry(function (
  options: {
    split: number;
    intervalMs: number;
    fetch: {
      method: "GET";
      retry: number;
      retryDelayMs: number;
    };
  },
  iter: IterableIterator<any>
) {
  return _.takeInterval(
    {
      split: options.split,
      intervalMs: options.intervalMs,
      fn: L.fetch(options.fetch),
    },
    iter
  );
});

_.takeIntervalPromise = curry(function (
  options: {
    split: number;
    intervalMs: number;
    promise: {
      retry: number;
      retryDelayMs: number;
    };
  },
  iter: IterableIterator<any>
) {
  return _.takeInterval(
    {
      split: options.split,
      intervalMs: options.intervalMs,
      fn: L.promise(options.promise),
    },
    iter
  );
});

_.takeInterval = curry(function (
  options: {
    split: number;
    intervalMs: number;
    fn?: AnyFn;
  },
  iter: IterableIterator<any>
) {
  let index = -1;
  return _.go(
    iter,
    _.split(options.split),
    _.map((a: any) => {
      index++;
      return delay(index * options.intervalMs, () =>
        _.go(a, options.fn ? options.fn : L.map((a: any) => a), _.takeAll)
      );
    }),
    _.takeAll
  ).then(_.flatten);
});

const delay = (delayMs: number, a?: any) =>
  new Promise((res) => {
    setTimeout(() => {
      if (typeof a === "function") {
        res(a());
      } else {
        res(a);
      }
    }, delayMs);
  });

const isIterable = (a: any) => a && !!a[Symbol.iterator];

L.flatten = function* (iter: IterableIterator<any>) {
  for (const a of iter) {
    if (isIterable(a) && typeof a != "string") yield* a;
    else yield a;
  }
};

_.flatten = _.pipe(L.flatten, _.takeAll);

type FType = {
  getIntervalPromiseSuccessResult: typeof getIntervalPromiseSuccessResult;
  [key: string]: any;
};

export const F = {} as FType;

const getIntervalPromiseSuccessResult = async <T>(
  promiseFnAry: AnyFn<Promise<T>>[],
  options: {
    split: number;
    intervalMs: number;
    promise: { retry: number; retryDelayMs: number };
  }
) => {
  const fetchResult = await _.takeIntervalPromise<T>(options, promiseFnAry);
  const successResult = _.go<T>(
    fetchResult,
    _.filter(({ message }) => message !== "error"),
    _.map(({ data }) => data),
    _.flatten
  );
  return successResult;
};

F.getIntervalPromiseSuccessResult = getIntervalPromiseSuccessResult;
