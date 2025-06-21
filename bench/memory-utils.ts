import { Session } from "inspector";

export interface MemoryMeasurement {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  timestamp: number;
}

export interface AllocationProfile {
  beforeMeasurement: MemoryMeasurement;
  afterMeasurement: MemoryMeasurement;
  allocatedBytes: number;
  allocatedObjects?: number;
}

export class MemoryProfiler {
  private session: Session | null = null;
  private post: ((method: string, params?: Record<string, unknown>) => Promise<any>) | null = null;

  async start() {
    this.session = new Session();
    this.post = (method: string, params?: Record<string, unknown>): Promise<any> =>
      new Promise((resolve, reject) => {
        this.session!.post(method, params, (err: Error | null, result: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

    this.session.connect();
    await this.post("HeapProfiler.enable");
    await this.post("HeapProfiler.startSampling", { samplingInterval: 32768 });
  }

  async stop() {
    if (this.post) {
      await this.post("HeapProfiler.stopSampling");
      await this.post("HeapProfiler.disable");
    }
    if (this.session) {
      this.session.disconnect();
    }
  }

  measureMemory(): MemoryMeasurement {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      timestamp: Date.now(),
    };
  }

  async profileAllocation<T>(fn: () => T): Promise<{ result: T; profile: AllocationProfile }> {
    const beforeMeasurement = this.measureMemory();
    
    const result = fn();
    
    const afterMeasurement = this.measureMemory();
    
    const allocatedBytes = afterMeasurement.heapUsed - beforeMeasurement.heapUsed;
    
    return {
      result,
      profile: {
        beforeMeasurement,
        afterMeasurement,
        allocatedBytes,
      },
    };
  }

  async profileAsyncAllocation<T>(fn: () => Promise<T>): Promise<{ result: T; profile: AllocationProfile }> {
    const beforeMeasurement = this.measureMemory();
    
    const result = await fn();
    
    const afterMeasurement = this.measureMemory();
    
    const allocatedBytes = afterMeasurement.heapUsed - beforeMeasurement.heapUsed;
    
    return {
      result,
      profile: {
        beforeMeasurement,
        afterMeasurement,
        allocatedBytes,
      },
    };
  }
}

export const forceGC = () => {
  if (global.gc) {
    global.gc();
  } else {
    console.warn("Garbage collection is not exposed. Run with --expose-gc flag for more accurate measurements.");
  }
};

export const measureRuntimeAllocation = async <T>(
  fn: () => T,
  iterations: number = 1000,
  warmupIterations: number = 100
): Promise<{
  averageAllocationPerIteration: number;
  totalAllocations: number;
  measurements: number[];
}> => {
  const profiler = new MemoryProfiler();
  await profiler.start();

  const measurements: number[] = [];

  for (let i = 0; i < warmupIterations; i++) {
    fn();
  }

  forceGC();
  await new Promise(resolve => setTimeout(resolve, 100));

  for (let i = 0; i < iterations; i++) {
    const { profile } = await profiler.profileAllocation(fn);
    measurements.push(profile.allocatedBytes);
    
    if (i % 100 === 0) {
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  await profiler.stop();

  const totalAllocations = measurements.reduce((sum, allocation) => sum + Math.max(0, allocation), 0);
  const averageAllocationPerIteration = totalAllocations / iterations;

  return {
    averageAllocationPerIteration,
    totalAllocations,
    measurements,
  };
};
