# Memory Allocation Analysis Results

## Benchmark Results Summary

Based on runtime memory allocation measurements using Node.js heap profiling, the following garbage generation patterns were identified in the mobx-quick-tree hot paths:

### Runtime Allocation Measurements

#### Model Instantiation
- **Small model (NameExample)**: ~1262 bytes per instance
- **Diverse model (TestClassModel)**: ~3326 bytes per instance (runtime only)
- **Large model (LargeRoot)**: Not measured due to benchmark timeout
- **Compilation overhead**: ~4930 bytes (one-time cost per model type)

#### Hot Path Allocations
- **TreeContext creation**: ~832 bytes per context
  - Includes new Map() for referenceCache
  - Includes new array for referencesToResolve
- **Reference resolution objects**: ~1328 bytes per batch of 5 reference descriptors
- **Reference-heavy instantiation**: ~2403 bytes per State instance with child references
- **Memoized property access**: ~792 bytes per batch across 10 instances

### Key Insights

1. **Compilation vs Runtime**: The benchmarks successfully distinguished between one-time compilation costs (~4930 bytes) and repeated runtime allocations (~3326 bytes per instance).

2. **TreeContext is a major hotspot**: At ~832 bytes per instantiation, TreeContext creation represents ~25% of the total allocation for diverse models.

3. **Reference resolution overhead**: Reference-heavy models show significantly higher allocation (~2403 bytes vs ~1262 bytes for simple models).

4. **Property access is relatively efficient**: Memoized property access shows low allocation overhead (~79 bytes per instance per access batch).

### Optimization Opportunities (Data-Driven)

Based on measured allocations, the highest-impact optimizations would be:

1. **TreeContext pooling**: Could reduce ~832 bytes per instantiation by reusing context objects
2. **Reference resolution object pooling**: Could reduce ~265 bytes per reference descriptor
3. **Optimized Map initialization**: TreeContext Map creation could be optimized for common use cases

### Methodology

- Used Node.js `--expose-gc` flag for accurate garbage collection control
- Measured heap usage before/after operations using `process.memoryUsage()`
- Included warmup iterations to separate compilation from runtime costs
- Used forced garbage collection between measurements for accuracy
- Averaged results over 100-1000 iterations depending on operation cost

### Next Steps

The benchmark infrastructure is now in place to:
1. Measure the impact of proposed optimizations
2. Establish regression testing for memory usage
3. Profile specific allocation patterns in more detail
4. Compare memory usage across different model types and sizes
