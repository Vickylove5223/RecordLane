import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("metadata", {
  migrations: "./migrations",
});

export interface CreateRecordingRequest {
  title: string;
  driveFileId: string;
  driveLink: string;
  duration: number;
  privacy: "private" | "anyone-viewer" | "anyone-commenter";
  thumbnailUrl?: string;
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

// Creates a new recording metadata entry.
export const create = api<CreateRecordingRequest, Recording>(
  { expose: true, method: "POST", path: "/recordings" },
  async (req) => {
    const id = generateId();
    const now = new Date();
    
    await db.exec`
      INSERT INTO recordings (id, title, drive_file_id, drive_link, duration, privacy, thumbnail_url, created_at, updated_at)
      VALUES (${id}, ${req.title}, ${req.driveFileId}, ${req.driveLink}, ${req.duration}, ${req.privacy}, ${req.thumbnailUrl || null}, ${now}, ${now})
    `;

    return {
      id,
      title: req.title,
      driveFileId: req.driveFileId,
      driveLink: req.driveLink,
      duration: req.duration,
      privacy: req.privacy,
      thumbnailUrl: req.thumbnailUrl,
      createdAt: now,
      updatedAt: now,
    };
  }
);

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
