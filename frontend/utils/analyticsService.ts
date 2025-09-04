import { ANALYTICS_CONFIG } from '../config';
import { ErrorHandler } from './errorHandler';
import backend from '~backend/client';

export interface AnalyticsEvent {
  eventType: string;
  recordingId?: string;
  sessionId?: string;
  properties?: Record<string, any>;
}

export class AnalyticsService {
  private static sessionId: string = AnalyticsService.generateSessionId();
  private static eventQueue: AnalyticsEvent[] = [];
  private static flushTimer?: NodeJS.Timeout;
  private static sessionTimer?: NodeJS.Timeout;
  private static isOnline: boolean = true;
  private static consecutiveFailures: number = 0;
  private static maxConsecutiveFailures: number = 5;
  private static isFlushingPaused: boolean = false;

  // Initialize analytics service
  static initialize(): void {
    if (!ANALYTICS_CONFIG.trackingEnabled) {
      return;
    }

    // Set up session management
    this.startSession();

    // Set up periodic flush
    this.scheduleFlush();

    // Monitor online/offline status
    this.setupNetworkMonitoring();

    // Track page views
    this.trackEvent('page_view', undefined, {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
    });

    // Track app initialization
    this.trackEvent('app_init', undefined, {
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });
  }

  // Set up network monitoring
  private static setupNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Analytics: Network back online');
      this.isOnline = true;
      this.consecutiveFailures = 0;
      this.isFlushingPaused = false;
      
      // Flush queued events when back online
      setTimeout(() => {
        this.flush();
      }, 1000);
    });

    window.addEventListener('offline', () => {
      console.log('Analytics: Network offline, pausing analytics');
      this.isOnline = false;
    });

    // Initial online status
    this.isOnline = navigator.onLine;
  }

  // Track a custom event
  static trackEvent(
    eventType: string,
    recordingId?: string,
    properties?: Record<string, any>
  ): void {
    if (!ANALYTICS_CONFIG.trackingEnabled) {
      return;
    }

    try {
      const event: AnalyticsEvent = {
        eventType,
        recordingId,
        sessionId: this.sessionId,
        properties: {
          ...properties,
          timestamp: Date.now(),
          url: window.location.href,
        },
      };

      this.eventQueue.push(event);

      // Auto-flush if queue is full and we're not paused
      if (this.eventQueue.length >= ANALYTICS_CONFIG.batchSize && !this.isFlushingPaused) {
        this.flush();
      }
    } catch (error) {
      console.warn('Failed to track analytics event:', error);
      ErrorHandler.logError('analytics-track-error', error, { eventType });
    }
  }

  // Track recording events
  static trackRecordingEvent(
    eventType: 'recording_started' | 'recording_stopped' | 'recording_uploaded' | 'recording_shared',
    recordingId: string,
    properties?: Record<string, any>
  ): void {
    this.trackEvent(eventType, recordingId, properties);
  }

  // Track user interaction events
  static trackInteraction(
    action: 'click' | 'view' | 'download' | 'share',
    element: string,
    properties?: Record<string, any>
  ): void {
    this.trackEvent('user_interaction', undefined, {
      action,
      element,
      ...properties,
    });
  }

  // Track error events
  static trackError(
    errorCode: string,
    errorMessage: string,
    properties?: Record<string, any>
  ): void {
    this.trackEvent('error_occurred', undefined, {
      errorCode,
      errorMessage,
      ...properties,
    });
  }

  // Track performance metrics
  static trackPerformance(metrics: Record<string, number>): void {
    this.trackEvent('performance_metrics', undefined, metrics);
  }

  // Flush queued events to backend with enhanced error handling
  private static async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    // Skip flush if offline or paused due to failures
    if (!this.isOnline || this.isFlushingPaused) {
      console.log("Analytics flush skipped:", {
        isOnline: this.isOnline,
        isFlushingPaused: this.isFlushingPaused,
        queueSize: this.eventQueue.length
      });
      return;
    }

    // Check if we've had too many consecutive failures
    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      console.warn(`Analytics flush paused due to ${this.consecutiveFailures} consecutive failures`);
      this.isFlushingPaused = true;
      
      // Resume attempts after 5 minutes
      setTimeout(() => {
        console.log('Analytics: Resuming flush attempts after pause');
        this.consecutiveFailures = 0;
        this.isFlushingPaused = false;
      }, 5 * 60 * 1000);
      
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send events in parallel with timeout
      const sendPromises = eventsToSend.map(event => 
        this.sendEventWithTimeout(event)
      );

      await Promise.all(sendPromises);
      
      // Reset failure count on success
      this.consecutiveFailures = 0;
      
    } catch (error) {
      this.consecutiveFailures++;
      
      console.warn('Failed to flush analytics events:', {
        error: error.message,
        consecutiveFailures: this.consecutiveFailures,
        eventCount: eventsToSend.length,
        isOnline: this.isOnline
      });

      ErrorHandler.logError('analytics-flush-error', error, {
        eventCount: eventsToSend.length,
        consecutiveFailures: this.consecutiveFailures,
      });

      // Re-queue failed events (with a limit to prevent infinite growth)
      if (this.eventQueue.length < ANALYTICS_CONFIG.batchSize * 3) {
        // Only re-queue if we haven't exceeded retry limit
        if (this.consecutiveFailures < this.maxConsecutiveFailures) {
          this.eventQueue.unshift(...eventsToSend);
        } else {
          console.warn('Analytics: Dropping events due to persistent failures');
        }
      } else {
        console.warn('Analytics: Queue full, dropping oldest events');
        this.eventQueue = this.eventQueue.slice(0, ANALYTICS_CONFIG.batchSize * 2);
      }
    }
  }

  // Send individual event with timeout and error handling
  private static async sendEventWithTimeout(event: AnalyticsEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Analytics request timeout'));
      }, 10000); // 10 second timeout

      backend.analytics.trackEvent({
        eventType: event.eventType,
        recordingId: event.recordingId,
        sessionId: event.sessionId,
        userAgent: navigator.userAgent,
        properties: event.properties,
      })
      .then(() => {
        clearTimeout(timeout);
        resolve();
      })
      .catch((error) => {
        clearTimeout(timeout);
        
        // Don't log individual failures if we're having network issues
        if (this.consecutiveFailures < 2) {
          console.warn('Analytics event send failed:', {
            eventType: event.eventType,
            error: error.message
          });
        }
        
        reject(error);
      });
    });
  }

  // Schedule periodic flush with adaptive intervals
  private static scheduleFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Use longer intervals if we're having issues
    const interval = this.consecutiveFailures > 0 
      ? Math.min(ANALYTICS_CONFIG.flushInterval * (this.consecutiveFailures + 1), 30 * 60 * 1000) // Max 30 minutes
      : ANALYTICS_CONFIG.flushInterval;

    this.flushTimer = setInterval(() => {
      this.flush();
    }, interval);
  }

  // Start a new session
  private static startSession(): void {
    this.sessionId = this.generateSessionId();

    // Reset session timer
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    // Auto-expire session after timeout
    this.sessionTimer = setTimeout(() => {
      this.startSession();
    }, ANALYTICS_CONFIG.sessionTimeout);

    // Track session start
    this.trackEvent('session_start', undefined, {
      sessionId: this.sessionId,
    });
  }

  // Generate a unique session ID
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get current session ID
  static getSessionId(): string {
    return this.sessionId;
  }

  // Manual flush for immediate sending
  static async flushImmediately(): Promise<void> {
    if (this.isFlushingPaused) {
      console.log('Analytics: Immediate flush requested but currently paused');
      return;
    }
    
    await this.flush();
  }

  // Cleanup analytics service
  static cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = undefined;
    }

    // Final flush only if we're online and not paused
    if (this.isOnline && !this.isFlushingPaused && this.eventQueue.length > 0) {
      this.flushImmediately();
    }
  }

  // Get analytics statistics
  static getStats(): {
    sessionId: string;
    queuedEvents: number;
    trackingEnabled: boolean;
    isOnline: boolean;
    consecutiveFailures: number;
    isFlushingPaused: boolean;
  } {
    return {
      sessionId: this.sessionId,
      queuedEvents: this.eventQueue.length,
      trackingEnabled: ANALYTICS_CONFIG.trackingEnabled,
      isOnline: this.isOnline,
      consecutiveFailures: this.consecutiveFailures,
      isFlushingPaused: this.isFlushingPaused,
    };
  }

  // Reset analytics state (for testing or recovery)
  static reset(): void {
    this.eventQueue = [];
    this.consecutiveFailures = 0;
    this.isFlushingPaused = false;
    this.scheduleFlush();
  }

  // Pause analytics (useful for testing or when known to be offline)
  static pause(): void {
    this.isFlushingPaused = true;
    console.log('Analytics manually paused');
  }

  // Resume analytics
  static resume(): void {
    this.isFlushingPaused = false;
    this.consecutiveFailures = 0;
    console.log('Analytics manually resumed');
    this.scheduleFlush();
  }
}

// Auto-initialize if tracking is enabled
if (typeof window !== 'undefined' && ANALYTICS_CONFIG.trackingEnabled) {
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      AnalyticsService.initialize();
    });
  } else {
    AnalyticsService.initialize();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    AnalyticsService.cleanup();
  });

  // Track page visibility changes with reduced noise
  let lastVisibilityChange = 0;
  document.addEventListener('visibilitychange', () => {
    const now = Date.now();
    
    // Throttle visibility change events to avoid spam
    if (now - lastVisibilityChange < 5000) {
      return;
    }
    lastVisibilityChange = now;
    
    if (document.hidden) {
      AnalyticsService.trackEvent('page_hidden');
      AnalyticsService.flushImmediately();
    } else {
      AnalyticsService.trackEvent('page_visible');
    }
  });
}

// Export for use in components
export const analytics = AnalyticsService;
