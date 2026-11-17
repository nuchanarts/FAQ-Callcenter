import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

/**
 * Verify a Google Sign-In ID token (from Google Identity Services on the login page).
 * Checks Google's signature, issuer, audience (our OAuth client id), expiry and that
 * Google has verified the email. Returns the lower-cased email, or null if invalid.
 */
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

let googleKeys: JWTVerifyGetKey | undefined;
const defaultKeys = () =>
  (googleKeys ??= createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs")));

export type GoogleVerifier = (credential: string) => Promise<string | null>;

export function createGoogleVerifier(clientId: string, keys?: JWTVerifyGetKey): GoogleVerifier {
  return async (credential) => {
    if (!clientId || !credential) return null;
    try {
      const { payload } = await jwtVerify(credential, keys ?? defaultKeys(), {
        issuer: GOOGLE_ISSUERS,
        audience: clientId,
      });
      if (payload.email_verified !== true || typeof payload.email !== "string") return null;
      return payload.email.trim().toLowerCase();
    } catch {
      return null;
    }
  };
}
