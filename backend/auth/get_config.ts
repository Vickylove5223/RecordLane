import { api } from "encore.dev/api";
import { googleClientID } from "./secrets";

export interface AuthConfigResponse {
  clientID: string;
}

// Retrieves the public configuration for the auth service.
export const getConfig = api<void, AuthConfigResponse>(
  { expose: true, method: "GET", path: "/auth/config" },
  async () => {
    return {
      clientID: googleClientID(),
    };
  }
);
