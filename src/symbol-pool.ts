const symbolPool = new Map<string, symbol>();

export function getPooledSymbol(key: string): symbol {
  let symbol = symbolPool.get(key);
  if (!symbol) {
    symbol = Symbol.for(key);
    symbolPool.set(key, symbol);
  }
  return symbol;
}

export function clearSymbolPool(): void {
  symbolPool.clear();
}

export function getSymbolPoolSize(): number {
  return symbolPool.size;
}
