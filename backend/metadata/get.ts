import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("metadata");

export interface GetRecordingRequest {
  id: string;
}

export interface Recording {
  id: string;
  title: string;
  driveFileId: string;
  driveLink: string;
  duration: number;
  privacy: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Retrieves a recording by its ID.
export const get = api<GetRecordingRequest, Recording>(
  { expose: true, method: "GET", path: "/recordings/:id" },
  async (req) => {
    const row = await db.queryRow<any>`
      SELECT id, title, drive_file_id, drive_link, duration, privacy, thumbnail_url, created_at, updated_at
      FROM recordings
      WHERE id = ${req.id}
    `;

    if (!row) {
      throw APIError.notFound("recording not found");
    }

    return {
      id: row.id,
      title: row.title,
      driveFileId: row.drive_file_id,
      driveLink: row.drive_link,
      duration: row.duration,
      privacy: row.privacy,
      thumbnailUrl: row.thumbnail_url,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
);
