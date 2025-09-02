import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { Query } from "encore.dev/api";

const db = SQLDatabase.named("analytics");

export interface GetStatsRequest {
  days?: Query<number>;
}

export interface UsageStats {
  totalRecordings: number;
  totalDuration: number;
  eventsLastNDays: number;
  popularEventTypes: Array<{ eventType: string; count: number }>;
  dailyStats: Array<{ date: string; recordings: number; events: number }>;
}

// Retrieves anonymous usage statistics for the application.
export const getStats = api<GetStatsRequest, UsageStats>(
  { expose: true, method: "GET", path: "/analytics/stats" },
  async (req) => {
    const days = req.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get total recordings from metadata service
    const { metadata } = await import("~encore/clients");
    try {
      const recordingsResult = await metadata.list({ limit: 1 });
      const totalRecordings = recordingsResult.total;

      // Calculate total duration from all recordings
      const allRecordings = await metadata.list({ limit: 1000 }); // Get more for duration calc
      const totalDuration = allRecordings.recordings.reduce((sum, r) => sum + r.duration, 0);

      // Get events count for last N days
      const eventsCount = await db.queryRow<{ count: string }>`
        SELECT COUNT(*) as count 
        FROM events 
        WHERE created_at >= ${cutoffDate}
      `;
      const eventsLastNDays = parseInt(eventsCount?.count || "0");

      // Get popular event types
      const popularEvents: Array<{ eventType: string; count: number }> = [];
      for await (const row of db.query<{ event_type: string; count: string }>`
        SELECT event_type, COUNT(*) as count
        FROM events
        WHERE created_at >= ${cutoffDate}
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 10
      `) {
        popularEvents.push({
          eventType: row.event_type,
          count: parseInt(row.count),
        });
      }

      // Get daily stats
      const dailyStats: Array<{ date: string; recordings: number; events: number }> = [];
      for await (const row of db.query<{ date: string; events: string }>`
        SELECT DATE(created_at) as date, COUNT(*) as events
        FROM events
        WHERE created_at >= ${cutoffDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `) {
        dailyStats.push({
          date: row.date,
          recordings: 0, // Would need to join with recordings if we tracked creation events
          events: parseInt(row.events),
        });
      }

      return {
        totalRecordings,
        totalDuration,
        eventsLastNDays,
        popularEventTypes: popularEvents,
        dailyStats,
      };
    } catch (metadataError) {
      console.error('Failed to fetch metadata:', metadataError);
      
      // Return analytics-only stats if metadata service is unavailable
      const eventsCount = await db.queryRow<{ count: string }>`
        SELECT COUNT(*) as count 
        FROM events 
        WHERE created_at >= ${cutoffDate}
      `;
      const eventsLastNDays = parseInt(eventsCount?.count || "0");

      const popularEvents: Array<{ eventType: string; count: number }> = [];
      for await (const row of db.query<{ event_type: string; count: string }>`
        SELECT event_type, COUNT(*) as count
        FROM events
        WHERE created_at >= ${cutoffDate}
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 10
      `) {
        popularEvents.push({
          eventType: row.event_type,
          count: parseInt(row.count),
        });
      }

      const dailyStats: Array<{ date: string; recordings: number; events: number }> = [];
      for await (const row of db.query<{ date: string; events: string }>`
        SELECT DATE(created_at) as date, COUNT(*) as events
        FROM events
        WHERE created_at >= ${cutoffDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `) {
        dailyStats.push({
          date: row.date,
          recordings: 0,
          events: parseInt(row.events),
        });
      }

      return {
        totalRecordings: 0,
        totalDuration: 0,
        eventsLastNDays,
        popularEventTypes: popularEvents,
        dailyStats,
      };
    }
  }
);
