import { api, APIError } from "encore.dev/api";
import { googleClientID, googleClientSecret } from "./secrets";

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

// Refreshes an access token using a refresh token.
export const refreshToken = api<RefreshTokenRequest, RefreshTokenResponse>(
  { expose: true, method: "POST", path: "/auth/google/refresh-token" },
  async (req) => {
    const tokenData = new URLSearchParams({
      client_id: googleClientID(),
      client_secret: googleClientSecret(),
      refresh_token: req.refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw APIError.unauthenticated(`Token refresh failed: ${errorText}`);
    }

    const tokenResponse = await response.json();
    return tokenResponse;
  }
);
