import { AuditResult } from './audits.types';

interface CacheEntry {
  data: AuditResult;
  expiresAt: number;
}

class AuditCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL: number;

  constructor(ttlMs: number = 60 * 60 * 1000) {
    this.defaultTTL = ttlMs;
  }

  get(url: string): AuditResult | null {
    const entry = this.cache.get(this.normalize(url));
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(this.normalize(url));
      return null;
    }
    return entry.data;
  }

  set(url: string, data: AuditResult, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL;
    this.cache.set(this.normalize(url), {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private normalize(url: string): string {
    return url.toLowerCase().replace(/\/+$/, '');
  }
}

const cacheTTL = parseInt(process.env.AUDIT_CACHE_TTL_MS || '3600000', 10);
export const auditCache = new AuditCache(cacheTTL);
