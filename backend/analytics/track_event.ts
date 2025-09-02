import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("analytics", {
  migrations: "./migrations",
});

export interface TrackEventRequest {
  eventType: string;
  recordingId?: string;
  sessionId?: string;
  userAgent?: string;
  properties?: Record<string, any>;
}

export interface EventResponse {
  success: boolean;
}

// Tracks an analytics event for privacy-respecting usage insights.
export const trackEvent = api<TrackEventRequest, EventResponse>(
  { expose: true, method: "POST", path: "/analytics/events" },
  async (req) => {
    const eventId = generateId();
    const now = new Date();
    
    await db.exec`
      INSERT INTO events (id, event_type, recording_id, session_id, user_agent, properties, created_at)
      VALUES (${eventId}, ${req.eventType}, ${req.recordingId || null}, ${req.sessionId || null}, ${req.userAgent || null}, ${JSON.stringify(req.properties || {})}, ${now})
    `;

    return { success: true };
  }
);

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
