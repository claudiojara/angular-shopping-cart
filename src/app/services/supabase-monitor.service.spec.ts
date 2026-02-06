import { TestBed } from '@angular/core/testing';
import { SupabaseMonitorService } from './supabase-monitor.service';

describe('SupabaseMonitorService', () => {
  let service: SupabaseMonitorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SupabaseMonitorService],
    });
    service = TestBed.inject(SupabaseMonitorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start disabled', () => {
    expect(service.enabled()).toBe(false);
  });

  it('should enable monitoring', () => {
    service.enable();
    expect(service.enabled()).toBe(true);
  });

  it('should disable monitoring', () => {
    service.enable();
    service.disable();
    expect(service.enabled()).toBe(false);
  });

  it('should not record metrics when disabled', () => {
    service.recordQuery('products', 'SELECT *', 100, true, 10);
    expect(service.metrics().length).toBe(0);
  });

  it('should record metrics when enabled', () => {
    service.enable();
    service.recordQuery('products', 'SELECT *', 100, true, 10);
    expect(service.metrics().length).toBe(1);
  });

  it('should calculate performance stats correctly', () => {
    service.enable();
    service.recordQuery('products', 'Query 1', 100, true, 10);
    service.recordQuery('products', 'Query 2', 200, true, 5);
    service.recordQuery('products', 'Query 3', 50, false, 0, 'Error');

    const stats = service.getStats();
    expect(stats.totalQueries).toBe(3);
    expect(stats.successfulQueries).toBe(2);
    expect(stats.failedQueries).toBe(1);
    expect(stats.averageDuration).toBeCloseTo(116.67, 1);
    expect(stats.slowestQuery?.duration).toBe(200);
    expect(stats.fastestQuery?.duration).toBe(50);
  });

  it('should filter metrics by table', () => {
    service.enable();
    service.recordQuery('products', 'Query 1', 100, true);
    service.recordQuery('cart_items', 'Query 2', 200, true);
    service.recordQuery('products', 'Query 3', 150, true);

    const productMetrics = service.getMetricsByTable('products');
    expect(productMetrics.length).toBe(2);
    expect(productMetrics.every((m) => m.table === 'products')).toBe(true);
  });

  it('should clear metrics', () => {
    service.enable();
    service.recordQuery('products', 'Query 1', 100, true);
    service.clear();
    expect(service.metrics().length).toBe(0);
  });

  it('should limit metrics count', () => {
    service.enable();
    // Record 150 metrics (limit is 100)
    for (let i = 0; i < 150; i++) {
      service.recordQuery('products', `Query ${i}`, 100, true);
    }
    expect(service.metrics().length).toBe(100);
  });
});
