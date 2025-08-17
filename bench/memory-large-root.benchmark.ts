import findRoot from "find-root";
import fs from "fs";
import { LargeRoot } from "../spec/fixtures/LargeRoot";
import { benchmarker, newInspectorSession } from "./benchmark";

const snapshot = JSON.parse(fs.readFileSync(findRoot(__dirname) + "/spec/fixtures/large-root-snapshot.json", "utf8"));

const roots: any[] = [];
const key = Date.now();
let wrote = false;

export default benchmarker(
  async (suite) => {
    const N = Number(process.env.MQT_MEMORY_N || 10);

    suite.add(`instantiate and retain LargeRoot (N=${N})`, function () {
      try {
        if ((globalThis as any).gc) (globalThis as any).gc();
        const before = process.memoryUsage().heapUsed;

        for (let i = 0; i < N; i++) {
          roots.push(LargeRoot.createReadOnly(snapshot));
        }

        if ((globalThis as any).gc) (globalThis as any).gc();
        const after = process.memoryUsage().heapUsed;

        if (!wrote) {
          wrote = true;

          const jsonPath = `./bench-LargeRoot-${key}.json`;
          fs.writeFileSync(
            jsonPath,
            JSON.stringify({ N, before, after, delta: after - before }, null, 2),
            "utf8"
          );
          console.log(`Wrote ${jsonPath}`);

          if (!(process.env.CI || process.env.CODSPEED || process.env.MQT_MEMORY_HEAPSNAP === "0")) {
            try {
              const { session, post } = newInspectorSession();
              const chunks: string[] = [];
              session.on("HeapProfiler.addHeapSnapshotChunk", (m: any) => chunks.push(m.params.chunk));
              post("HeapProfiler.enable")
                .then(() => post("HeapProfiler.takeHeapSnapshot", { reportProgress: false }))
                .then(() => {
                  const hsPath = `./bench-LargeRoot-${key}.heapsnapshot`;
                  fs.writeFileSync(hsPath, chunks.join(""), "utf8");
                  console.log(`Wrote ${hsPath}`);
                })
                .finally(() => {
                  void post("HeapProfiler.disable").catch(() => {});
                })
                .catch((e: any) => {
                  console.error("Heap snapshot error", e?.message || e);
                });
            } catch (e: any) {
              console.error("Inspector session error", e?.message || e);
            }
          }
        }
      } catch (e: any) {
        console.error("Memory benchmark task error", e?.message || e);
      }
    });

    return suite;
  },
  { iterations: 1, warmupIterations: 0, warmupTime: 0, time: 0 }
);
