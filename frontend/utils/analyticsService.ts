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

  // Initialize analytics service
  static initialize(): void {
    if (!ANALYTICS_CONFIG.trackingEnabled) {
      return;
    }

    // Set up session management
    this.startSession();

    // Set up periodic flush
    this.scheduleFlush();

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

      // Auto-flush if queue is full
      if (this.eventQueue.length >= ANALYTICS_CONFIG.batchSize) {
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

  // Flush queued events to backend
  private static async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log("Analytics flush skipped: browser is offline.");
      // Don't clear the queue, it will be flushed when back online.
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send events in parallel
      await Promise.all(
        eventsToSend.map(event => 
          backend.analytics.trackEvent({
            eventType: event.eventType,
            recordingId: event.recordingId,
            sessionId: event.sessionId,
            userAgent: navigator.userAgent,
            properties: event.properties,
          })
        )
      );
    } catch (error) {
      console.warn('Failed to flush analytics events:', error);
      ErrorHandler.logError('analytics-flush-error', error, {
        eventCount: eventsToSend.length,
      });

      // Re-queue failed events (with a limit to prevent infinite growth)
      if (this.eventQueue.length < ANALYTICS_CONFIG.batchSize * 2) {
        this.eventQueue.unshift(...eventsToSend);
      }
    }
  }

  // Schedule periodic flush
  private static scheduleFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, ANALYTICS_CONFIG.flushInterval);
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

    // Final flush
    this.flushImmediately();
  }

  // Get analytics statistics
  static getStats(): {
    sessionId: string;
    queuedEvents: number;
    trackingEnabled: boolean;
  } {
    return {
      sessionId: this.sessionId,
      queuedEvents: this.eventQueue.length,
      trackingEnabled: ANALYTICS_CONFIG.trackingEnabled,
    };
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

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
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
