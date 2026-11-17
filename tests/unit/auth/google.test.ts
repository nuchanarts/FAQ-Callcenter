import { beforeAll, describe, expect, it } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";
import { createGoogleVerifier, type GoogleVerifier } from "@/auth/google";

const CLIENT_ID = "123.apps.googleusercontent.com";
let privateKey: CryptoKey;
let otherKey: CryptoKey;
let verify: GoogleVerifier;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  otherKey = (await generateKeyPair("RS256")).privateKey;
  const jwk: JWK = { ...(await exportJWK(pair.publicKey)), kid: "k1", alg: "RS256" };
  verify = createGoogleVerifier(CLIENT_ID, createLocalJWKSet({ keys: [jwk] }));
});

const token = (claims: Record<string, unknown>, key = privateKey) =>
  new SignJWT({ email: "Staff@Gmail.com", email_verified: true, ...claims })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer((claims.iss as string) ?? "https://accounts.google.com")
    .setAudience((claims.aud as string) ?? CLIENT_ID)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);

describe("Google ID token verification", () => {
  it("accepts a Google-signed token for our client id and returns the lower-cased email", async () => {
    expect(await verify(await token({}))).toBe("staff@gmail.com");
  });

  it("rejects unverified emails, other audiences, other issuers and forged signatures", async () => {
    expect(await verify(await token({ email_verified: false }))).toBeNull();
    expect(await verify(await token({ aud: "someone-else" }))).toBeNull();
    expect(await verify(await token({ iss: "https://evil.example" }))).toBeNull();
    expect(await verify(await token({}, otherKey))).toBeNull();
    expect(await verify("not-a-jwt")).toBeNull();
  });

  it("is disabled without a client id", async () => {
    expect(await createGoogleVerifier("")(await token({}))).toBeNull();
  });
});
