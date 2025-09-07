import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { Query } from "encore.dev/api";

const db = SQLDatabase.named("metadata");

export interface ListRecordingsRequest {
  limit?: Query<number>;
  offset?: Query<number>;
  search?: Query<string>;
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

export interface ListRecordingsResponse {
  recordings: Recording[];
  total: number;
  hasMore: boolean;
}

// Retrieves all recordings, ordered by creation date (latest first).
export const list = api<ListRecordingsRequest, ListRecordingsResponse>(
  { expose: true, method: "GET", path: "/recordings" },
  async (req) => {
    const limit = req.limit || 20;
    const offset = req.offset || 0;
    const search = req.search?.trim();

    let query = `
      SELECT id, title, youtube_video_id, youtube_link, duration, privacy, thumbnail_url, created_at, updated_at
      FROM recordings
    `;
    const params: any[] = [];

    if (search) {
      query += ` WHERE title ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM recordings`;
    if (search) {
      countQuery += ` WHERE title ILIKE $1`;
    }
    
    const countResult = await db.queryRow<{ count: string }>(
      countQuery as any,
      ...params
    );
    const total = parseInt(countResult?.count || "0");

    // Get paginated results
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const recordings: Recording[] = [];
    for await (const row of db.rawQuery<any>(query, ...params)) {
      recordings.push({
        id: row.id,
        title: row.title,
        youtubeVideoId: row.youtube_video_id,
        youtubeLink: row.youtube_link,
        duration: row.duration,
        privacy: row.privacy,
        thumbnailUrl: row.thumbnail_url,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    }

    return {
      recordings,
      total,
      hasMore: offset + recordings.length < total,
    };
  }
);
