import { writeFile } from "fs-extra";
import { compact } from "lodash";
import { Bench, type Options } from "tinybench";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { Profiler } from "inspector";
import { Session } from "inspector";

export const BENCHMARK_CONFIG = {
  iterations: 1000,
  warmupIterations: 100,
  warmupTime: 1000,
  time: 5000,
} as const;

export const newInspectorSession = () => {
  const session = new Session();
  const post = (method: string, params?: Record<string, unknown>): any =>
    new Promise((resolve, reject) => {
      session.post(method, params, (err: Error | null, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

  session.connect();
  return { session, post };
};

export type BenchmarkGenerator = ((suite: Bench) => Bench | Promise<Bench>) & { options?: Options };

/**
 * Set up a new benchmark in our library of benchmarks
 * If this file is executed directly, it will run the benchmark
 * Otherwise, it will export the benchmark for use in other files
 *
 * @example
 * export default benchmarker((suite) => {
 *   return suite.add("My Benchmark", async () => {
 *      // something expensive
 *   });
 * });
 **/
export const benchmarker = (fn: BenchmarkGenerator, options?: Options) => {
  fn.options = options;

  const err = new NiceStackError();
  const callerFile = (err.stack as unknown as NodeJS.CallSite[])[2].getFileName();

  if (require.main?.filename === callerFile) {
    void runBenchmark(fn);
  } else {
    return { fn };
  }
};

/** Wrap a plain old async function in the weird deferred management code benchmark.js requires */
export const asyncBench = (fn: () => Promise<void>) => {
  return {
    defer: true,
    fn: async (deferred: any) => {
      await fn();
      deferred.resolve();
    },
  };
};

/** Boot up a benchmark suite for registering new cases on */
export const createSuite = (options: Options = BENCHMARK_CONFIG) => {
  const suite = new Bench(options);

  suite.addEventListener("error", (event: any) => {
    console.error(event);
  });

  return suite;
};

/** Run one benchmark function in isolation */
const runBenchmark = async (fn: BenchmarkGenerator) => {
  const args = await yargs(hideBin(process.argv))
    .option("p", {
      alias: "profile",
      default: false,
      describe: "profile each benchmarked case as it runs, writing a CPU profile to disk for each",
      type: "boolean",
    })
    .option("b", {
      alias: "blocking",
      default: false,
      describe: "track event loop blocking time during each iteration, which changes the stats",
      type: "boolean",
    }).argv;

  let suite = createSuite(fn.options);

  if (args.profile) {
    const key = formatDateForFile();

    const { post } = newInspectorSession();
    await post("Profiler.enable");
    await post("Profiler.setSamplingInterval", { interval: 20 });

    suite.addEventListener("add", (event) => {
      const oldBeforeAll = event.task.opts.beforeAll;
      const oldAfterAll = event.task.opts.beforeAll;

      event.task.opts.beforeAll = async function () {
        await post("Profiler.start");
        await oldBeforeAll?.call(this);
      };
      event.task.opts.afterAll = async function () {
        await oldAfterAll?.call(this);
        const { profile } = (await post("Profiler.stop")) as Profiler.StopReturnType;
        await writeFile(`./bench-${event.task.name}-${key}.cpuprofile`, JSON.stringify(profile));
      };
    });
  }

  suite = await fn(suite);

  console.log("running benchmark");

  await suite.warmup();
  await suite.run();

  console.table(benchTable(suite));
};

class NiceStackError extends Error {
  constructor() {
    super();
    const oldStackTrace = Error.prepareStackTrace;
    try {
      Error.prepareStackTrace = (err, structuredStackTrace) => structuredStackTrace;

      Error.captureStackTrace(this);

      this.stack; // Invoke the getter for `stack`.
    } finally {
      Error.prepareStackTrace = oldStackTrace;
    }
  }
}

const formatDateForFile = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(
    now.getHours()
  ).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
};

export const benchTable = (bench: Bench) => {
  return compact(
    bench.tasks.map(({ name: t, result: e }) => {
      if (!e) return null;
      return {
        "Task Name": t,
        "ops/sec": e.error ? "NaN" : parseInt(e.hz.toString(), 10).toLocaleString(),
        "Average Time (ms)": e.error ? "NaN" : e.mean.toFixed(4),
        "p99 Time (ms)": e.error ? "NaN" : (e.p99 || 0).toFixed(4),
        "p995 Time (ms)": e.error ? "NaN" : (e.p995 || 0).toFixed(4),
        Margin: e.error ? "NaN" : `±${e.rme.toFixed(2)}%`,
        Samples: e.error ? "NaN" : e.samples.length,
        "Min (ms)": e.error ? "NaN" : (e.min || 0).toFixed(4),
        "Max (ms)": e.error ? "NaN" : (e.max || 0).toFixed(4),
      };
    })
  );
};
