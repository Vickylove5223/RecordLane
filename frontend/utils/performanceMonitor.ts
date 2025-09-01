import React from 'react';

export interface PerformanceMetrics {
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  renderTime: number;
  loadTime: number;
  networkLatency?: number;
  fps?: number;
  errorCount: number;
  cacheHitRate: number;
}

export interface PerformanceEvent {
  type: string;
  timestamp: number;
  duration: number;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private events: PerformanceEvent[] = [];
  private maxEvents = 1000;
  private observers: Array<(metrics: PerformanceMetrics) => void> = [];
  private frameCount = 0;
  private lastFrameTime = 0;
  private fps = 0;
  private errorCount = 0;
  private cacheRequests = 0;
  private cacheHits = 0;

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  private constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    // Monitor frame rate
    this.startFPSMonitoring();

    // Monitor navigation timing
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.recordNavigationTiming();
        }, 0);
      });
    }

    // Monitor errors
    this.setupErrorMonitoring();

    // Monitor resource timing
    this.setupResourceTimingMonitoring();

    // Start periodic metrics collection
    setInterval(() => {
      this.collectMetrics();
    }, 10000); // Every 10 seconds
  }

  private startFPSMonitoring(): void {
    const measureFrame = (timestamp: number) => {
      if (this.lastFrameTime > 0) {
        const delta = timestamp - this.lastFrameTime;
        this.fps = 1000 / delta;
        this.frameCount++;
      }
      this.lastFrameTime = timestamp;
      requestAnimationFrame(measureFrame);
    };

    if (typeof window !== 'undefined') {
      requestAnimationFrame(measureFrame);
    }
  }

  private setupErrorMonitoring(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', () => {
        this.errorCount++;
      });

      window.addEventListener('unhandledrejection', () => {
        this.errorCount++;
      });
    }
  }

  private setupResourceTimingMonitoring(): void {
    if (typeof window !== 'undefined' && window.performance && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordEvent({
              type: 'resource',
              timestamp: Date.now(),
              duration: entry.duration,
              metadata: {
                name: entry.name,
                transferSize: (entry as any).transferSize,
                encodedBodySize: (entry as any).encodedBodySize,
              },
            });
          }
        });

        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  private recordNavigationTiming(): void {
    if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const renderTime = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;

      this.recordEvent({
        type: 'navigation',
        timestamp: Date.now(),
        duration: loadTime,
        metadata: {
          loadTime,
          renderTime,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          firstPaint: timing.responseStart - timing.navigationStart,
        },
      });
    }
  }

  recordEvent(event: PerformanceEvent): void {
    this.events.unshift(event);
    
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }
  }

  recordCacheRequest(isHit: boolean): void {
    this.cacheRequests++;
    if (isHit) {
      this.cacheHits++;
    }
  }

  private collectMetrics(): void {
    const metrics: PerformanceMetrics = {
      renderTime: this.getAverageRenderTime(),
      loadTime: this.getLastLoadTime(),
      fps: this.fps,
      errorCount: this.errorCount,
      cacheHitRate: this.cacheRequests > 0 ? (this.cacheHits / this.cacheRequests) * 100 : 0,
    };

    // Add memory usage if available
    if (typeof window !== 'undefined' && (window.performance as any).memory) {
      metrics.memoryUsage = {
        usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (window.performance as any).memory.jsHeapSizeLimit,
      };
    }

    // Add network latency
    metrics.networkLatency = this.getAverageNetworkLatency();

    // Notify observers
    this.observers.forEach(observer => {
      try {
        observer(metrics);
      } catch (error) {
        console.error('Error in performance observer:', error);
      }
    });
  }

  private getAverageRenderTime(): number {
    const renderEvents = this.events.filter(e => e.type === 'render');
    if (renderEvents.length === 0) return 0;
    
    const total = renderEvents.reduce((sum, event) => sum + event.duration, 0);
    return total / renderEvents.length;
  }

  private getLastLoadTime(): number {
    const loadEvents = this.events.filter(e => e.type === 'navigation');
    if (loadEvents.length === 0) return 0;
    
    return loadEvents[0].duration;
  }

  private getAverageNetworkLatency(): number {
    const networkEvents = this.events.filter(e => e.type === 'resource');
    if (networkEvents.length === 0) return 0;
    
    const total = networkEvents.reduce((sum, event) => sum + event.duration, 0);
    return total / networkEvents.length;
  }

  // Public API
  markStart(label: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${label}-start`);
    }
  }

  markEnd(label: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${label}-end`);
      
      try {
        window.performance.measure(label, `${label}-start`, `${label}-end`);
        const measure = window.performance.getEntriesByName(label)[0];
        
        this.recordEvent({
          type: 'custom',
          timestamp: Date.now(),
          duration: measure.duration,
          metadata: { label },
        });
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
  }

  getMetrics(): PerformanceMetrics {
    return {
      renderTime: this.getAverageRenderTime(),
      loadTime: this.getLastLoadTime(),
      networkLatency: this.getAverageNetworkLatency(),
      fps: this.fps,
      errorCount: this.errorCount,
      cacheHitRate: this.cacheRequests > 0 ? (this.cacheHits / this.cacheRequests) * 100 : 0,
      memoryUsage: typeof window !== 'undefined' && (window.performance as any).memory ? {
        usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (window.performance as any).memory.jsHeapSizeLimit,
      } : undefined,
    };
  }

  getEvents(type?: string): PerformanceEvent[] {
    if (type) {
      return this.events.filter(e => e.type === type);
    }
    return [...this.events];
  }

  addObserver(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(observer);
    
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  clear(): void {
    this.events = [];
    this.errorCount = 0;
    this.cacheRequests = 0;
    this.cacheHits = 0;
    this.frameCount = 0;
  }

  // Performance optimization suggestions
  getOptimizationSuggestions(): string[] {
    const metrics = this.getMetrics();
    const suggestions: string[] = [];

    if (metrics.memoryUsage) {
      const memoryUsagePercent = (metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit) * 100;
      
      if (memoryUsagePercent > 80) {
        suggestions.push('High memory usage detected. Consider clearing unused data or reducing cache size.');
      }
      
      if (memoryUsagePercent > 90) {
        suggestions.push('Critical memory usage. Application may become unresponsive.');
      }
    }

    if (metrics.fps && metrics.fps < 30) {
      suggestions.push('Low frame rate detected. Consider reducing visual effects or animation complexity.');
    }

    if (metrics.renderTime > 100) {
      suggestions.push('Slow render times detected. Consider optimizing component rendering or using React.memo.');
    }

    if (metrics.networkLatency && metrics.networkLatency > 2000) {
      suggestions.push('High network latency detected. Consider implementing offline capabilities or request optimization.');
    }

    if (metrics.cacheHitRate < 50) {
      suggestions.push('Low cache hit rate. Consider improving caching strategy or cache key optimization.');
    }

    if (metrics.errorCount > 10) {
      suggestions.push('High error count detected. Check error logs and improve error handling.');
    }

    return suggestions;
  }

  // Resource cleanup
  cleanup(): void {
    this.clear();
    this.observers = [];
    
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.clearMarks();
        window.performance.clearMeasures();
      } catch (error) {
        console.warn('Failed to clear performance marks:', error);
      }
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);

  React.useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();
    
    const unsubscribe = monitor.addObserver((newMetrics) => {
      setMetrics(newMetrics);
    });

    // Get initial metrics
    setMetrics(monitor.getMetrics());

    return unsubscribe;
  }, []);

  return {
    metrics,
    markStart: (label: string) => performanceMonitor.markStart(label),
    markEnd: (label: string) => performanceMonitor.markEnd(label),
    getOptimizationSuggestions: () => performanceMonitor.getOptimizationSuggestions(),
  };
}

// React HOC for component performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name;

    React.useEffect(() => {
      performanceMonitor.markStart(`component-${name}-mount`);
      return () => {
        performanceMonitor.markEnd(`component-${name}-mount`);
      };
    }, [name]);

    React.useLayoutEffect(() => {
      performanceMonitor.markStart(`component-${name}-render`);
      performanceMonitor.markEnd(`component-${name}-render`);
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`;
  return WrappedComponent;
}
