import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("metadata");

export interface UpdateRecordingRequest {
  id: string;
  title?: string;
  privacy?: "private" | "unlisted" | "public";
  thumbnailUrl?: string;
}

export interface Recording {
  id: string;
  title: string;
  youtubeVideoId: string;
  youtubeLink: string;
  duration: number;
  privacy: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Updates a recording's metadata.
export const update = api<UpdateRecordingRequest, Recording>(
  { expose: true, method: "PUT", path: "/recordings/:id" },
  async (req) => {
    const now = new Date();
    
    // Check if recording exists
    const existing = await db.queryRow<any>`
      SELECT id FROM recordings WHERE id = ${req.id}
    `;

    if (!existing) {
      throw APIError.notFound("recording not found");
    }

    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (req.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(req.title);
      paramIndex++;
    }

    if (req.privacy !== undefined) {
      updates.push(`privacy = $${paramIndex}`);
      params.push(req.privacy);
      paramIndex++;
    }

    if (req.thumbnailUrl !== undefined) {
      updates.push(`thumbnail_url = $${paramIndex}`);
      params.push(req.thumbnailUrl);
      paramIndex++;
    }

    updates.push(`updated_at = $${paramIndex}`);
    params.push(now);
    paramIndex++;

    if (updates.length === 1) { // Only updated_at
      throw APIError.invalidArgument("no fields to update");
    }

    params.push(req.id);
    
    await db.rawExec(
      `UPDATE recordings SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      ...params
    );

    // Fetch and return updated recording
    const row = await db.queryRow<any>`
      SELECT id, title, youtube_video_id, youtube_link, duration, privacy, thumbnail_url, created_at, updated_at
      FROM recordings
      WHERE id = ${req.id}
    `;

    return {
      id: row.id,
      title: row.title,
      youtubeVideoId: row.youtube_video_id,
      youtubeLink: row.youtube_link,
      duration: row.duration,
      privacy: row.privacy,
      thumbnailUrl: row.thumbnail_url,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
);
