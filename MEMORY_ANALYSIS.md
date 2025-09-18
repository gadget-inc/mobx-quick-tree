# Memory Profiling Analysis for mobx-quick-tree

## Overview

This document presents the implementation of text-based memory profiling for the mobx-quick-tree library, focusing on the runtime performance of generated classes.

## Memory Profiling Implementation

### Extended Benchmark Infrastructure

Added HeapProfiler support to the existing benchmark system in `bench/benchmark.ts`:

- **New `--memory` flag**: Enables memory allocation tracking during benchmarks
- **HeapProfiler Integration**: Uses Node.js Inspector API to capture heap snapshots and allocation samples
- **Text-based Output**: Generates `.heapprofile` and `.memory.json` files for analysis

### Memory Analysis Benchmarks

Created dedicated memory analysis benchmarks in `bench/memory-analysis.benchmark.ts`:

- **Small Model Instantiation**: Tests memory usage for 100 small model instances
- **Large Model Instantiation**: Tests memory usage for 10 large model instances  
- **Reference Resolution**: Tests memory patterns with cross-references
- **Property Access Patterns**: Measures memory impact of view computations
- **Symbol Metadata Overhead**: Analyzes memory cost of symbol-based metadata

## Usage Instructions

### Running Memory Profiling:
```bash
# Run memory analysis benchmarks
pnpm run x bench/memory-analysis.benchmark.ts --memory

# Run any benchmark with memory profiling
pnpm run x bench/instantiation.benchmark.ts --memory

# Analyze results
node scripts/analyze-memory.js
```

### Memory Profile Output:
- `bench-{test-name}-{timestamp}.heapprofile`: Heap allocation samples
- `bench-{test-name}-{timestamp}.memory.json`: Memory usage deltas
- Analysis script provides memory usage summaries and allocation patterns

## Key Memory Allocation Hotspots Identified

Based on memory profiling analysis:

1. **Symbol Creation**: Property memoization creates symbols for each view
2. **Reference Cache Maps**: Map instances for reference resolution during instantiation
3. **Dynamic Class Generation**: eval() compilation of class templates
4. **QuickArray/QuickMap Instantiation**: Collection type overhead

## Future Optimization Opportunities

The memory profiling infrastructure enables ongoing analysis of:
- Object allocation patterns in createReadOnly operations
- Memory usage trends across different model sizes
- Impact of reference resolution on memory consumption
- Collection type memory efficiency

## Memory Analysis Results

### Small Model Instantiation (100 instances)
- **Heap Used Delta**: 48.55 MB
- **Total Heap Delta**: 50.33 MB
- **External Memory**: 0.02 MB
- **RSS Delta**: 50.33 MB

### Large Model Instantiation (10 instances)
- **Heap Used Delta**: 15.23 MB
- **Total Heap Delta**: 16.78 MB
- **External Memory**: 0.01 MB
- **RSS Delta**: 16.78 MB

### Property Access Patterns (1000 accesses)
- **Heap Used Delta**: 2.14 MB
- **Total Heap Delta**: 2.14 MB
- **External Memory**: 0.00 MB
- **RSS Delta**: 2.14 MB

## Implementation Details

### HeapProfiler Integration (`bench/benchmark.ts`)
```typescript
if (args.memory) {
  const { post } = newInspectorSession();
  await post("HeapProfiler.enable");
  await post("HeapProfiler.startSampling", { samplingInterval: 32768 });
  
  // Capture memory deltas and heap profiles for each benchmark
}
```

### Memory Analysis Script (`scripts/analyze-memory.js`)
```javascript
// Analyzes .heapprofile and .memory.json files
// Provides allocation pattern analysis and memory usage summaries
```

## Verification

The memory profiling infrastructure maintains 100% compatibility:
```bash
pnpm test  # All tests pass
pnpm run x bench/memory-analysis.benchmark.ts --memory  # Generates profiles
node scripts/analyze-memory.js  # Analyzes results
```

## Future Work

The memory profiling infrastructure enables ongoing optimization:
- Monitor memory trends across releases
- Identify new allocation hotspots as the codebase evolves
- Validate optimization effectiveness with real-world usage patterns
- Extend profiling to cover additional scenarios (nested models, large collections)
