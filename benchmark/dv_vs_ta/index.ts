/**
 * Comprehensive TypedArray vs DataView Benchmark
 * Tests various data types, sizes, access patterns, and endianness
 */

type DataType =
  | "Int8"
  | "Uint8"
  | "Int16"
  | "Uint16"
  | "Int32"
  | "Uint32"
  | "Float32"
  | "Float64"
  | "BigInt64"
  | "BigUint64";
type AccessPattern = "sequential" | "random" | "stride";
type Operation = "read" | "write" | "readWrite";

interface BenchmarkConfig {
  size: number;
  dataType: DataType;
  accessPattern: AccessPattern;
  operation: Operation;
  littleEndian: boolean;
  iterations: number;
  warmupRuns: number;
}

interface BenchmarkResult {
  config: BenchmarkConfig;
  typedArrayTime: number;
  dataViewTime: number;
  speedup: number;
  winner: "TypedArray" | "DataView";
}

const BYTE_SIZES: Record<DataType, number> = {
  Int8: 1,
  Uint8: 1,
  Int16: 2,
  Uint16: 2,
  Int32: 4,
  Uint32: 4,
  Float32: 4,
  Float64: 8,
  BigInt64: 8,
  BigUint64: 8,
};

class BenchmarkRunner {
  private results: BenchmarkResult[] = [];

  /**
   * Create a TypedArray of the specified type
   */
  private createTypedArray(type: DataType, size: number): any {
    switch (type) {
      case "Int8":
        return new Int8Array(size);
      case "Uint8":
        return new Uint8Array(size);
      case "Int16":
        return new Int16Array(size);
      case "Uint16":
        return new Uint16Array(size);
      case "Int32":
        return new Int32Array(size);
      case "Uint32":
        return new Uint32Array(size);
      case "Float32":
        return new Float32Array(size);
      case "Float64":
        return new Float64Array(size);
      case "BigInt64":
        return new BigInt64Array(size);
      case "BigUint64":
        return new BigUint64Array(size);
    }
  }

  /**
   * Generate test data based on data type
   */
  private generateValue(type: DataType, index: number): any {
    if (type === "BigInt64" || type === "BigUint64") {
      return BigInt(index % 1000);
    }
    if (type.startsWith("Float")) {
      return Math.random() * 1000;
    }
    return index % 256;
  }

  /**
   * Generate access indices based on pattern
   */
  private generateAccessIndices(
    size: number,
    pattern: AccessPattern,
  ): number[] {
    const indices: number[] = [];

    switch (pattern) {
      case "sequential":
        for (let i = 0; i < size; i++) {
          indices.push(i);
        }
        break;

      case "random":
        for (let i = 0; i < size; i++) {
          indices.push(Math.floor(Math.random() * size));
        }
        break;

      case "stride":
        // Access every 16th element, then fill gaps
        const stride = 16;
        for (let offset = 0; offset < stride; offset++) {
          for (let i = offset; i < size; i += stride) {
            indices.push(i);
          }
        }
        break;
    }

    return indices;
  }

  /**
   * Benchmark TypedArray operations
   */
  private benchmarkTypedArray(config: BenchmarkConfig): number {
    const { size, dataType, accessPattern, operation } = config;
    const array = this.createTypedArray(dataType, size);
    const indices = this.generateAccessIndices(size, accessPattern);

    let sum: any = dataType.startsWith("Big") ? BigInt(0) : 0;

    const start = performance.now();

    switch (operation) {
      case "write":
        for (let i = 0; i < indices.length; i++) {
          const idx = indices[i];
          array[idx] = this.generateValue(dataType, idx);
        }
        break;

      case "read":
        for (let i = 0; i < indices.length; i++) {
          const idx = indices[i];
          if (dataType.startsWith("Big")) {
            sum = (sum as bigint) + (array[idx] as bigint);
          } else {
            sum += array[idx];
          }
        }
        break;

      case "readWrite":
        for (let i = 0; i < indices.length; i++) {
          const idx = indices[i];
          array[idx] = this.generateValue(dataType, idx);
          if (dataType.startsWith("Big")) {
            sum = (sum as bigint) + (array[idx] as bigint);
          } else {
            sum += array[idx];
          }
        }
        break;
    }

    const end = performance.now();

    // Prevent optimization
    if (sum === -999999999) console.log(sum);

    // Ensure we return at least a small value to avoid division by zero
    return Math.max(end - start, 0.001);
  }

  /**
   * Benchmark DataView operations
   */
  private benchmarkDataView(config: BenchmarkConfig): number {
    const { size, dataType, accessPattern, operation, littleEndian } = config;
    const byteSize = BYTE_SIZES[dataType];
    const buffer = new ArrayBuffer(size * byteSize);
    const dataView = new DataView(buffer);
    const indices = this.generateAccessIndices(size, accessPattern);

    let sum: any = dataType.startsWith("Big") ? BigInt(0) : 0;

    const start = performance.now();

    switch (operation) {
      case "write":
        for (let i = 0; i < indices.length; i++) {
          const idx = indices[i];
          const offset = idx * byteSize;
          const value = this.generateValue(dataType, idx);

          switch (dataType) {
            case "Int8":
              dataView.setInt8(offset, value);
              break;
            case "Uint8":
              dataView.setUint8(offset, value);
              break;
            case "Int16":
              dataView.setInt16(offset, value, littleEndian);
              break;
            case "Uint16":
              dataView.setUint16(offset, value, littleEndian);
              break;
            case "Int32":
              dataView.setInt32(offset, value, littleEndian);
              break;
            case "Uint32":
              dataView.setUint32(offset, value, littleEndian);
              break;
            case "Float32":
              dataView.setFloat32(offset, value, littleEndian);
              break;
            case "Float64":
              dataView.setFloat64(offset, value, littleEndian);
              break;
            case "BigInt64":
              dataView.setBigInt64(offset, value, littleEndian);
              break;
            case "BigUint64":
              dataView.setBigUint64(offset, value, littleEndian);
              break;
          }
        }
        break;

      case "read":
        for (let i = 0; i < indices.length; i++) {
          const idx = indices[i];
          const offset = idx * byteSize;
          let value: any;

          switch (dataType) {
            case "Int8":
              value = dataView.getInt8(offset);
              break;
            case "Uint8":
              value = dataView.getUint8(offset);
              break;
            case "Int16":
              value = dataView.getInt16(offset, littleEndian);
              break;
            case "Uint16":
              value = dataView.getUint16(offset, littleEndian);
              break;
            case "Int32":
              value = dataView.getInt32(offset, littleEndian);
              break;
            case "Uint32":
              value = dataView.getUint32(offset, littleEndian);
              break;
            case "Float32":
              value = dataView.getFloat32(offset, littleEndian);
              break;
            case "Float64":
              value = dataView.getFloat64(offset, littleEndian);
              break;
            case "BigInt64":
              value = dataView.getBigInt64(offset, littleEndian);
              break;
            case "BigUint64":
              value = dataView.getBigUint64(offset, littleEndian);
              break;
          }

          if (dataType.startsWith("Big")) {
            sum = (sum as bigint) + (value as bigint);
          } else {
            sum += value;
          }
        }
        break;

      case "readWrite":
        for (let i = 0; i < indices.length; i++) {
          const idx = indices[i];
          const offset = idx * byteSize;
          const writeValue = this.generateValue(dataType, idx);
          let readValue: any;

          switch (dataType) {
            case "Int8":
              dataView.setInt8(offset, writeValue);
              readValue = dataView.getInt8(offset);
              break;
            case "Uint8":
              dataView.setUint8(offset, writeValue);
              readValue = dataView.getUint8(offset);
              break;
            case "Int16":
              dataView.setInt16(offset, writeValue, littleEndian);
              readValue = dataView.getInt16(offset, littleEndian);
              break;
            case "Uint16":
              dataView.setUint16(offset, writeValue, littleEndian);
              readValue = dataView.getUint16(offset, littleEndian);
              break;
            case "Int32":
              dataView.setInt32(offset, writeValue, littleEndian);
              readValue = dataView.getInt32(offset, littleEndian);
              break;
            case "Uint32":
              dataView.setUint32(offset, writeValue, littleEndian);
              readValue = dataView.getUint32(offset, littleEndian);
              break;
            case "Float32":
              dataView.setFloat32(offset, writeValue, littleEndian);
              readValue = dataView.getFloat32(offset, littleEndian);
              break;
            case "Float64":
              dataView.setFloat64(offset, writeValue, littleEndian);
              readValue = dataView.getFloat64(offset, littleEndian);
              break;
            case "BigInt64":
              dataView.setBigInt64(offset, writeValue, littleEndian);
              readValue = dataView.getBigInt64(offset, littleEndian);
              break;
            case "BigUint64":
              dataView.setBigUint64(offset, writeValue, littleEndian);
              readValue = dataView.getBigUint64(offset, littleEndian);
              break;
          }

          if (dataType.startsWith("Big")) {
            sum = (sum as bigint) + (readValue as bigint);
          } else {
            sum += readValue;
          }
        }
        break;
    }

    const end = performance.now();

    // Prevent optimization
    if (sum === -999999999) console.log(sum);

    // Ensure we return at least a small value to avoid division by zero
    return Math.max(end - start, 0.001);
  }

  /**
   * Run a single benchmark configuration
   */
  private runBenchmark(config: BenchmarkConfig): BenchmarkResult {
    // Warmup runs
    for (let i = 0; i < config.warmupRuns; i++) {
      this.benchmarkTypedArray(config);
      this.benchmarkDataView(config);
    }

    // Actual benchmark runs
    let typedArrayTotal = 0;
    let dataViewTotal = 0;

    for (let i = 0; i < config.iterations; i++) {
      // Alternate order to reduce bias
      if (i % 2 === 0) {
        typedArrayTotal += this.benchmarkTypedArray(config);
        dataViewTotal += this.benchmarkDataView(config);
      } else {
        dataViewTotal += this.benchmarkDataView(config);
        typedArrayTotal += this.benchmarkTypedArray(config);
      }
    }

    const typedArrayTime = typedArrayTotal / config.iterations;
    const dataViewTime = dataViewTotal / config.iterations;
    const speedup = dataViewTime / typedArrayTime;

    return {
      config,
      typedArrayTime,
      dataViewTime,
      speedup,
      winner: speedup > 1 ? "TypedArray" : "DataView",
    };
  }

  /**
   * Run comprehensive benchmark suite
   */
  public runSuite(): void {
    console.log("=".repeat(80));
    console.log("COMPREHENSIVE TYPEDARRAY VS DATAVIEW BENCHMARK");
    console.log("=".repeat(80));
    console.log();

    const sizes = [1_000, 100_000, 1_000_000, 10_000_000];
    const dataTypes: DataType[] = [
      "Int8",
      "Uint8",
      "Int16",
      "Uint16",
      "Int32",
      "Uint32",
      "Float32",
      "Float64",
    ];
    const accessPatterns: AccessPattern[] = ["sequential", "random", "stride"];
    const operations: Operation[] = ["read", "write", "readWrite"];
    const endianness = [true, false];

    let totalBenchmarks = 0;

    // Run benchmarks for different sizes
    for (const size of sizes) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`SIZE: ${size.toLocaleString()} elements`);
      console.log("=".repeat(80));

      // Test each data type
      for (const dataType of dataTypes) {
        console.log(`\n--- DataType: ${dataType} ---`);

        // Test each operation
        for (const operation of operations) {
          console.log(`  Operation: ${operation}`);

          // Test each access pattern
          for (const accessPattern of accessPatterns) {
            // For multi-byte types, test endianness
            const endianTests = BYTE_SIZES[dataType] > 1 ? endianness : [true];

            for (const littleEndian of endianTests) {
              const config: BenchmarkConfig = {
                size,
                dataType,
                accessPattern,
                operation,
                littleEndian,
                iterations: size >= 1_000_000 ? 5 : 10,
                warmupRuns: 2,
              };

              const result = this.runBenchmark(config);
              this.results.push(result);
              totalBenchmarks++;

              const endianStr =
                BYTE_SIZES[dataType] > 1
                  ? ` (${littleEndian ? "LE" : "BE"})`
                  : "";
              console.log(
                `    ${accessPattern.padEnd(12)} ${endianStr.padEnd(6)}: ` +
                  `TA: ${result.typedArrayTime.toFixed(3)}ms | ` +
                  `DV: ${result.dataViewTime.toFixed(3)}ms | ` +
                  `Speedup: ${result.speedup.toFixed(2)}x | ` +
                  `Winner: ${result.winner}`,
              );
            }
          }
        }
      }
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log("SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total benchmarks run: ${totalBenchmarks}`);
    this.printSummary();
  }

  /**
   * Print summary statistics
   */
  private printSummary(): void {
    // Filter out invalid results (where times are too small or invalid)
    const validResults = this.results.filter(
      (r) =>
        isFinite(r.speedup) &&
        !isNaN(r.speedup) &&
        r.typedArrayTime > 0 &&
        r.dataViewTime > 0,
    );

    if (validResults.length === 0) {
      console.log("\nNo valid results to summarize.");
      return;
    }

    const typedArrayWins = validResults.filter(
      (r) => r.winner === "TypedArray",
    ).length;
    const dataViewWins = validResults.filter(
      (r) => r.winner === "DataView",
    ).length;

    console.log(`\nOverall Winner Distribution:`);
    console.log(
      `  TypedArray wins: ${typedArrayWins} (${((typedArrayWins / validResults.length) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  DataView wins: ${dataViewWins} (${((dataViewWins / validResults.length) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  Valid results: ${validResults.length} / ${this.results.length}`,
    );

    // Average speedup by data type
    console.log(`\nAverage Speedup by Data Type (TA/DV):`);
    const dataTypes: DataType[] = [
      "Int8",
      "Uint8",
      "Int16",
      "Uint16",
      "Int32",
      "Uint32",
      "Float32",
      "Float64",
    ];
    for (const dataType of dataTypes) {
      const filtered = validResults.filter(
        (r) => r.config.dataType === dataType,
      );
      if (filtered.length === 0) continue;
      const avgSpeedup =
        filtered.reduce((sum, r) => sum + r.speedup, 0) / filtered.length;
      console.log(`  ${dataType.padEnd(10)}: ${avgSpeedup.toFixed(2)}x`);
    }

    // Average speedup by access pattern
    console.log(`\nAverage Speedup by Access Pattern (TA/DV):`);
    const patterns: AccessPattern[] = ["sequential", "random", "stride"];
    for (const pattern of patterns) {
      const filtered = validResults.filter(
        (r) => r.config.accessPattern === pattern,
      );
      if (filtered.length === 0) continue;
      const avgSpeedup =
        filtered.reduce((sum, r) => sum + r.speedup, 0) / filtered.length;
      console.log(`  ${pattern.padEnd(12)}: ${avgSpeedup.toFixed(2)}x`);
    }

    // Average speedup by operation
    console.log(`\nAverage Speedup by Operation (TA/DV):`);
    const operations: Operation[] = ["read", "write", "readWrite"];
    for (const operation of operations) {
      const filtered = validResults.filter(
        (r) => r.config.operation === operation,
      );
      if (filtered.length === 0) continue;
      const avgSpeedup =
        filtered.reduce((sum, r) => sum + r.speedup, 0) / filtered.length;
      console.log(`  ${operation.padEnd(10)}: ${avgSpeedup.toFixed(2)}x`);
    }

    // Best and worst cases
    const sorted = [...validResults].sort((a, b) => b.speedup - a.speedup);
    if (sorted.length === 0) return;
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    console.log(`\nBest Case for TypedArray:`);
    console.log(
      `  ${best.speedup.toFixed(2)}x faster - ${best.config.dataType}, ${best.config.accessPattern}, ${best.config.operation}, size: ${best.config.size.toLocaleString()}`,
    );

    console.log(`\nBest Case for DataView:`);
    console.log(
      `  ${(1 / worst.speedup).toFixed(2)}x faster - ${worst.config.dataType}, ${worst.config.accessPattern}, ${worst.config.operation}, size: ${worst.config.size.toLocaleString()}`,
    );
  }

  /**
   * Export results to CSV
   */
  public exportToCSV(): string {
    const headers = [
      "Size",
      "DataType",
      "AccessPattern",
      "Operation",
      "LittleEndian",
      "TypedArrayTime(ms)",
      "DataViewTime(ms)",
      "Speedup",
      "Winner",
    ];

    const rows = this.results.map((r) => [
      r.config.size.toString(),
      r.config.dataType,
      r.config.accessPattern,
      r.config.operation,
      r.config.littleEndian.toString(),
      r.typedArrayTime.toFixed(6),
      r.dataViewTime.toFixed(6),
      r.speedup.toFixed(6),
      r.winner,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );

    return csv;
  }

  /**
   * Print CSV to console
   */
  public printCSV(): void {
    console.log("\n" + "=".repeat(80));
    console.log("CSV EXPORT");
    console.log("=".repeat(80));
    console.log(this.exportToCSV());
  }

  /**
   * Export results to JSON
   */
  public exportToJSON(): string {
    return JSON.stringify(this.results, null, 2);
  }

  /**
   * Download results as files in the browser
   */
  public downloadResults(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // Download CSV
    this.downloadFile(
      this.exportToCSV(),
      `benchmark_results_${timestamp}.csv`,
      "text/csv",
    );

    // Download JSON
    this.downloadFile(
      this.exportToJSON(),
      `benchmark_results_${timestamp}.json`,
      "application/json",
    );

    console.log("\n✓ Download links created for CSV and JSON files");
  }

  /**
   * Helper function to trigger file download in browser
   */
  private downloadFile(
    content: string,
    filename: string,
    mimeType: string,
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Run the benchmark
const runner = new BenchmarkRunner();
runner.runSuite();
runner.printCSV();
runner.downloadResults();
