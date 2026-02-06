import { Injectable, signal } from '@angular/core';

/**
 * Query performance metrics
 */
export interface QueryMetrics {
  query: string;
  table: string;
  duration: number; // milliseconds
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  resultCount?: number;
}

/**
 * Aggregated performance stats
 */
export interface PerformanceStats {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageDuration: number;
  slowestQuery: QueryMetrics | null;
  fastestQuery: QueryMetrics | null;
}

/**
 * Supabase Performance Monitor Service
 *
 * Tracks query performance and provides insights for optimization
 */
@Injectable({
  providedIn: 'root',
})
export class SupabaseMonitorService {
  private _metrics = signal<QueryMetrics[]>([]);
  private _enabled = signal(false);
  private maxMetricsCount = 100; // Keep last 100 queries

  // Public readonly signals
  readonly metrics = this._metrics.asReadonly();
  readonly enabled = this._enabled.asReadonly();

  /**
   * Enable performance monitoring
   */
  enable(): void {
    this._enabled.set(true);
    console.log('📊 Supabase performance monitoring enabled');
  }

  /**
   * Disable performance monitoring
   */
  disable(): void {
    this._enabled.set(false);
    console.log('📊 Supabase performance monitoring disabled');
  }

  /**
   * Record a query execution
   */
  recordQuery(
    table: string,
    query: string,
    duration: number,
    success: boolean,
    resultCount?: number,
    errorMessage?: string,
  ): void {
    if (!this._enabled()) return;

    const metric: QueryMetrics = {
      query,
      table,
      duration,
      timestamp: new Date(),
      success,
      resultCount,
      errorMessage,
    };

    // Add to metrics array
    const current = this._metrics();
    const updated = [...current, metric];

    // Keep only last N metrics
    if (updated.length > this.maxMetricsCount) {
      updated.shift();
    }

    this._metrics.set(updated);

    // Log slow queries (>1000ms)
    if (duration > 1000) {
      console.warn(`🐌 Slow query detected (${duration}ms) on table "${table}":`, query);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    const metrics = this._metrics();
    const totalQueries = metrics.length;

    if (totalQueries === 0) {
      return {
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        averageDuration: 0,
        slowestQuery: null,
        fastestQuery: null,
      };
    }

    const successfulQueries = metrics.filter((m) => m.success).length;
    const failedQueries = totalQueries - successfulQueries;
    const averageDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;

    const sortedByDuration = [...metrics].sort((a, b) => a.duration - b.duration);
    const fastestQuery = sortedByDuration[0];
    const slowestQuery = sortedByDuration[sortedByDuration.length - 1];

    return {
      totalQueries,
      successfulQueries,
      failedQueries,
      averageDuration,
      slowestQuery,
      fastestQuery,
    };
  }

  /**
   * Clear all recorded metrics
   */
  clear(): void {
    this._metrics.set([]);
    console.log('📊 Performance metrics cleared');
  }

  /**
   * Get metrics for a specific table
   */
  getMetricsByTable(table: string): QueryMetrics[] {
    return this._metrics().filter((m) => m.table === table);
  }

  /**
   * Print performance report to console
   */
  printReport(): void {
    const stats = this.getStats();

    console.log('📊 Supabase Performance Report');
    console.log('================================');
    console.log(`Total Queries: ${stats.totalQueries}`);
    console.log(`Successful: ${stats.successfulQueries}`);
    console.log(`Failed: ${stats.failedQueries}`);
    console.log(`Average Duration: ${stats.averageDuration.toFixed(2)}ms`);

    if (stats.slowestQuery) {
      console.log(`\n🐌 Slowest Query (${stats.slowestQuery.duration}ms):`);
      console.log(`   Table: ${stats.slowestQuery.table}`);
      console.log(`   Query: ${stats.slowestQuery.query}`);
    }

    if (stats.fastestQuery) {
      console.log(`\n⚡ Fastest Query (${stats.fastestQuery.duration}ms):`);
      console.log(`   Table: ${stats.fastestQuery.table}`);
      console.log(`   Query: ${stats.fastestQuery.query}`);
    }

    // Group by table
    const tables = new Set(this._metrics().map((m) => m.table));
    if (tables.size > 0) {
      console.log('\n📋 Queries by Table:');
      tables.forEach((table) => {
        const tableMetrics = this.getMetricsByTable(table);
        const avgDuration =
          tableMetrics.reduce((sum, m) => sum + m.duration, 0) / tableMetrics.length;
        console.log(`   ${table}: ${tableMetrics.length} queries, avg ${avgDuration.toFixed(2)}ms`);
      });
    }
  }
}
