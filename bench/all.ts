import globby from "globby";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { benchTable, createSuite } from "./benchmark";
import { withCodSpeed } from "@codspeed/tinybench-plugin";

export const runAll = async () => {
  const argv = await yargs(hideBin(process.argv))
    .option("benchmarks", {
      alias: ["b", "t"],
      type: "string",
      describe: "Benchmark file pattern to match",
    })
    .usage("Usage: run.ts [options]")
    .help().argv;

  let benchmarkFiles = await globby(__dirname + "/**/*.benchmark.ts");
  let suite = createSuite();

  if (process.env.CI) {
    suite = withCodSpeed(suite);
  }

  if (argv.benchmarks) {
    benchmarkFiles = benchmarkFiles.filter((file) => file.includes(argv.benchmarks!));
  }
  console.info("running benchmarks", { benchmarkFiles });

  for (const file of benchmarkFiles) {
    let benchmark = await import(file);
    if (benchmark.default) {
      benchmark = benchmark.default;
    }
    suite = await benchmark.fn(suite);
  }

  await suite.warmup();
  await suite.run();

  console.table(benchTable(suite));
};

if (require.main === module) {
  void runAll();
}

