import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Reference databases at the top level
const metadataDb = SQLDatabase.named("metadata");
const analyticsDb = SQLDatabase.named("analytics");

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  version: string;
  services: {
    metadata: "healthy" | "unhealthy";
    analytics: "healthy" | "unhealthy";
    database: "healthy" | "unhealthy";
  };
  uptime: number;
}

const startTime = Date.now();

// Returns the health status of the RecordLane backend services.
export const check = api<void, HealthResponse>(
  { expose: true, method: "GET", path: "/health" },
  async () => {
    const now = new Date();
    const uptime = Date.now() - startTime;
    
    // Check database connectivity
    let databaseStatus: "healthy" | "unhealthy" = "healthy";
    try {
      // Try to connect to both databases
      await metadataDb.queryRow`SELECT 1 as test`;
      await analyticsDb.queryRow`SELECT 1 as test`;
    } catch (error) {
      console.error("Database health check failed:", error);
      databaseStatus = "unhealthy";
    }

    // Check metadata service
    let metadataStatus: "healthy" | "unhealthy" = "healthy";
    try {
      const { metadata } = await import("~encore/clients");
      await metadata.list({ limit: 1 });
    } catch (error) {
      console.error("Metadata service health check failed:", error);
      metadataStatus = "unhealthy";
    }

    // Check analytics service
    let analyticsStatus: "healthy" | "unhealthy" = "healthy";
    try {
      const { analytics } = await import("~encore/clients");
      await analytics.getStats({ days: 1 });
    } catch (error) {
      console.error("Analytics service health check failed:", error);
      analyticsStatus = "unhealthy";
    }

    // Determine overall status
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (databaseStatus === "unhealthy" || metadataStatus === "unhealthy") {
      overallStatus = "unhealthy";
    } else if (analyticsStatus === "unhealthy") {
      overallStatus = "degraded";
    }

    return {
      status: overallStatus,
      timestamp: now,
      version: "1.0.0",
      services: {
        metadata: metadataStatus,
        analytics: analyticsStatus,
        database: databaseStatus,
      },
      uptime,
    };
  }
);
