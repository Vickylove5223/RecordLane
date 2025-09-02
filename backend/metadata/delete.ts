import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("metadata");

export interface DeleteRecordingRequest {
  id: string;
}

// Deletes a recording metadata entry.
export const deleteRecording = api<DeleteRecordingRequest, void>(
  { expose: true, method: "DELETE", path: "/recordings/:id" },
  async (req) => {
    const result = await db.queryRow<{ count: number }>`
      DELETE FROM recordings WHERE id = ${req.id} RETURNING 1 as count
    `;

    if (!result) {
      throw APIError.notFound("recording not found");
    }
  }
);
