export class OptimizedReferenceCache {
  private smallCache: Array<[string, any]> = [];
  private largeCache?: Map<string, any>;
  private readonly SMALL_CACHE_THRESHOLD = 8;

  set(key: string, value: any): void {
    if (this.largeCache) {
      this.largeCache.set(key, value);
    } else if (this.smallCache.length < this.SMALL_CACHE_THRESHOLD) {
      this.smallCache.push([key, value]);
    } else {
      this.largeCache = new Map(this.smallCache);
      this.largeCache.set(key, value);
      this.smallCache = [];
    }
  }

  get(key: string): any {
    if (this.largeCache) {
      return this.largeCache.get(key);
    }
    return this.smallCache.find(([k]) => k === key)?.[1];
  }

  has(key: string): boolean {
    if (this.largeCache) {
      return this.largeCache.has(key);
    }
    return this.smallCache.some(([k]) => k === key);
  }

  clear(): void {
    this.smallCache = [];
    this.largeCache = undefined;
  }

  get size(): number {
    if (this.largeCache) {
      return this.largeCache.size;
    }
    return this.smallCache.length;
  }
}
