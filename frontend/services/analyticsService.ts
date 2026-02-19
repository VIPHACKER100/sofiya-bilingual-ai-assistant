export interface AnalyticsEvent {
  eventName: string;
  timestamp: number;
  sessionId: string;
  properties?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error';
}

class AnalyticsService {
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: number = 30000;
  private maxQueueSize: number = 100;
  private enabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupAutoFlush();
    
    if (typeof window !== 'undefined') {
      this.trackEvent('SESSION_START', { 
        theme: localStorage.getItem('sofiya_theme') || 'sofiya',
        language: localStorage.getItem('sofiya_language') || 'en'
      });
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  trackEvent(
    eventName: string,
    properties?: Record<string, any>,
    severity: 'info' | 'warning' | 'error' = 'info'
  ) {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      eventName,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      properties,
      severity
    };

    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flush();
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Analytics] ${eventName}`, properties);
    }
  }

  trackCommand(commandText: string, actionType: string, duration: number) {
    this.trackEvent('COMMAND_EXECUTED', {
      commandText: commandText.substring(0, 100),
      actionType,
      duration,
      timestamp: Date.now()
    });
  }

  trackWidgetOpen(widgetName: string) {
    this.trackEvent('WIDGET_OPENED', { widget: widgetName });
  }

  trackWidgetClose(widgetName: string) {
    this.trackEvent('WIDGET_CLOSED', { widget: widgetName });
  }

  trackThemeChange(theme: string) {
    this.trackEvent('THEME_CHANGED', { theme });
  }

  trackLanguageChange(language: string) {
    this.trackEvent('LANGUAGE_CHANGED', { language });
  }

  trackError(error: Error | string, context?: Record<string, any>) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.trackEvent('ERROR', {
      error: errorMessage,
      ...context
    }, 'error');
  }

  trackPageView(path: string) {
    this.trackEvent('PAGE_VIEW', { path });
  }

  trackVoiceActivation(success: boolean, duration?: number) {
    this.trackEvent('VOICE_ACTIVATED', { success, duration });
  }

  trackAPICall(endpoint: string, status: number, duration: number) {
    this.trackEvent('API_CALL', { endpoint, status, duration });
  }

  private setupAutoFlush() {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (this.eventQueue.length > 0) {
          this.flush();
        }
      }, this.flushInterval);
    }
  }

  async flush() {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend }),
        keepalive: true
      });
    } catch {
      this.eventQueue = [...eventsToSend, ...this.eventQueue];
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getQueueSize(): number {
    return this.eventQueue.length;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const analyticsService = new AnalyticsService();
