import { secret } from "encore.dev/config";

// The Google Client ID for OAuth 2.0.
// Set this in the Encore UI in the Infrastructure tab.
export const googleClientID = secret("GoogleClientID");

// The Google Client Secret for OAuth 2.0.
// Set this in the Encore UI in the Infrastructure tab.
export const googleClientSecret = secret("GoogleClientSecret");
