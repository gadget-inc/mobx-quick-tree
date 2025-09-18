const classTemplateCache = new Map<string, any>();

export function getCachedClassTemplate(schemaHash: string, generator: () => any): any {
  let template = classTemplateCache.get(schemaHash);
  if (!template) {
    template = generator();
    classTemplateCache.set(schemaHash, template);
  }
  return template;
}

export function clearClassCache(): void {
  classTemplateCache.clear();
}

export function getClassCacheSize(): number {
  return classTemplateCache.size;
}
