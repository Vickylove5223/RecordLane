import { api, APIError } from "encore.dev/api";
import { googleClientID, googleClientSecret } from "./secrets";

export interface ExchangeCodeRequest {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

// Exchanges an authorization code for an access token.
export const exchangeCode = api<ExchangeCodeRequest, TokenResponse>(
  { expose: true, method: "POST", path: "/auth/google/exchange-code" },
  async (req) => {
    const tokenData = new URLSearchParams({
      client_id: googleClientID(),
      client_secret: googleClientSecret(),
      code: req.code,
      code_verifier: req.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: req.redirectUri,
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
      console.error('Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw APIError.invalidArgument(`Token exchange failed: ${errorText}`);
    }

    const tokenResponse = await response.json();
    return tokenResponse;
  }
);
