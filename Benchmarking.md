# Benchmarking

`mobx-quick-tree` is designed to be fast, so, we have some benchmarks set up to help understand how fast it really is in the `bench` folder!

## Running benchmarks

You can run a benchmark file with `pnpm x <the file>`:

```shell
pnpm x bench/create-large-root.ts
```

This will run the file and output a speed measurement for comparison between git branches.

## Profiling

It's nice to use the benchmarks for profiling to identify optimization candidates.

### CPU profiling

You can run a benchmark to generate a profile using node.js' built in sampling profiler

```shell
node -r ts-node/register/transpile-only --prof bench/create-large-root.ts
```

#### node.js built in reporting

```shell
node --prof-process isolate-*.log
```

#### Flamegraphs

You can postprocess the generated `isolate-0x<something>.log` file into the data `flamegraph` expects, and then feed it to `flamegraph` to see a visual breakdown of performance. You can do that in one command like so:

```shell
node --prof-process --preprocess -j isolate-*.log | p flamebearer
```

#### CPU profiling with VSCode

You can also use the profiler built into VSCode for executing scripts and profiling them. There's an example `launch.json` task in `launch.json` for running a script. You can also use `console.profile()` and `console.profileEnd()` to programmatically start a CPU profile in a benchmark while working on it.

### `deoptigate`

`deoptigate` is a powerful tool for analyzing how compliant with V8's optimizations our code is. Run a script through deoptigate by first building the TS into JS with `pnpm build`, then run deoptigate on the script:

```
pnpm build
pnpm deoptigate dist/bench/create-many-model-class.js
```
