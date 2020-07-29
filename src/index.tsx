import React from "react";

const accepts: ((keys: string[]) => void)[] = [];

function subscribe() {
  return new Promise<string[]>((accept) => {
    accepts.push(accept);
  });
}

// returns true if a and b contain elements in common
function intersects<T>(a: T[], b: T[]) {
  return a.filter((value) => b.includes(value));
}

function useAbortSignal(
  fn: (signal: AbortSignal) => void,
  deps: React.DependencyList | undefined = []
) {
  React.useEffect(function () {
    const abortController = new AbortController();

    fn(abortController.signal);

    return function () {
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    };
  }, deps);
}

function invertPromise(promise: Promise<any>) {
  return new Promise<any>((resolve, reject) => promise.then(reject, resolve));
}

// return the result from the first promise to resolve
function raceToSuccess(...promises: Promise<any>[]) {
  return invertPromise(Promise.all(promises.map(invertPromise)));
}

function useListen<T>(
  keys: string[],
  getter: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList | undefined = []
) {
  const [data, setData] = React.useState<T>();
  const [error, setError] = React.useState();

  // always start loading the data on initial render
  useAbortSignal(
    async function (signal: AbortSignal) {
      try {
        const data = await getter(signal);

        if (signal.aborted) {
          return;
        }

        setData(data);
      } catch (e) {
        if (e instanceof DOMException && e.code == e.ABORT_ERR) {
          return;
        }
        if (!signal.aborted) {
          setError(e);
        }
      }
    },
    [...keys, ...deps]
  );

  React.useEffect(
    function () {
      var done = false;
      var unsubscribe: () => void;

      const unsubscribed = new Promise<undefined>(function (accept) {
        unsubscribe = function () {
          done = true;
          accept();
        };
      });

      const subscription = (async function* () {
        while (!done) {
          // loop until the component unmounts or useData resolves
          // a promise acquired from Context
          const value: undefined | string[] = await raceToSuccess(
            unsubscribed,
            subscribe()
          );
          if (done) {
            return;
          }
          if (value) {
            // yield keys passed from onData
            yield value;
          }
        }
      })();

      const abortController = new AbortController();

      (async function listen() {
        for await (const notifications of subscription) {
          // if any of the keys appear that are being tracked
          // trigger a re-render with setData
          if (intersects(notifications, keys)) {
            try {
              const data = await getter(abortController.signal);

              if (!abortController.signal.aborted) {
                setData(data);
              }
            } catch (e) {
              if (e instanceof DOMException && e.code == e.ABORT_ERR) {
                return;
              }
              if (!abortController.signal.aborted) {
                // the getter failed
                // trigger a re-render that will throw the error
                setError(e);
              }
            }
          }
        }
      })();

      return () => {
        abortController.abort();
        unsubscribe();
      };
    },
    [...keys, ...deps]
  );

  if (error) {
    throw error;
  }

  return data;
}

function notify(...keys: string[]) {
  if (keys.length > 0) {
    for (const accept of accepts) {
      accept(keys);
    }
    accepts.splice(0, accepts.length);
  }
}

export { notify, useListen };
