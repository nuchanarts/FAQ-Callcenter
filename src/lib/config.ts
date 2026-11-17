export const BACKENDS = ["file", "memory", "failing", "supabase", "sheets"] as const;
export type Backend = (typeof BACKENDS)[number];

const DEV_SECRET = "dev-only-session-secret-do-not-use-in-prod";
const MIN_SECRET_LENGTH = 32;
/** Secrets published in this repository — never acceptable in production. */
const KNOWN_SECRETS = new Set([DEV_SECRET, "change-me-to-a-long-random-string-32chars"]);

export interface AppConfig {
  backend: Backend;
  isProduction: boolean;
  sessionSecret: string;
  dataFile: string;
  allowDemoAdmins: boolean;
  /** Google OAuth client id for "Sign in with Google" (staff login). Not a secret. */
  googleClientId: string;
  /** Email + password login: local development, E2E, or temporarily via STAFF_PASSWORD_LOGIN. */
  passwordLogin: boolean;
  /** One owner account from env (STAFF_OWNER_*), e.g. to use the admin area before Google Sign-In. */
  staffOwner?: { email: string; displayName: string; passwordHash: string };
  supabase?: { url: string; serviceRoleKey: string };
  sheets?: { url: string; secret: string };
}

type Env = Record<string, string | undefined>;

function isBackend(value: string): value is Backend {
  return (BACKENDS as readonly string[]).includes(value);
}

/** Read and validate configuration from environment variables. */
export function readConfig(env: Env = process.env): AppConfig {
  const isProduction = env.NODE_ENV === "production";
  if (isProduction && !env.DATA_BACKEND) {
    throw new Error(`DATA_BACKEND must be set in production (${BACKENDS.join(", ")})`);
  }
  const backend = env.DATA_BACKEND ?? "file";
  if (!isBackend(backend)) {
    throw new Error(`DATA_BACKEND must be one of ${BACKENDS.join(", ")}`);
  }
  const sessionSecret = env.SESSION_SECRET ?? (isProduction ? "" : DEV_SECRET);
  if (sessionSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(`SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  if (isProduction && KNOWN_SECRETS.has(sessionSecret)) {
    throw new Error("SESSION_SECRET must not be a published example value");
  }
  const config: AppConfig = {
    backend,
    isProduction,
    sessionSecret,
    dataFile: env.DATA_FILE ?? ".data/db.json",
    allowDemoAdmins: !isProduction || env.ALLOW_DEMO_ADMINS === "true",
    googleClientId: env.GOOGLE_CLIENT_ID?.trim() ?? "",
    passwordLogin:
      !isProduction || env.ALLOW_DEMO_ADMINS === "true" || env.STAFF_PASSWORD_LOGIN === "true",
  };
  const ownerEmail = env.STAFF_OWNER_EMAIL?.trim().toLowerCase();
  const ownerHash = env.STAFF_OWNER_PASSWORD_HASH?.trim();
  if (ownerEmail && ownerHash) {
    if (!ownerHash.startsWith("scrypt$")) {
      throw new Error("STAFF_OWNER_PASSWORD_HASH must come from npm run hash-password");
    }
    config.staffOwner = {
      email: ownerEmail,
      displayName: env.STAFF_OWNER_NAME?.trim() || "ผู้ดูแลระบบ",
      passwordHash: ownerHash,
    };
  }
  if (backend === "supabase") {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    }
    config.supabase = { url, serviceRoleKey };
  }
  if (backend === "sheets") {
    const url = env.SHEET_WEBHOOK_URL;
    const secret = env.SHEET_WEBHOOK_SECRET;
    if (!url || !secret) {
      throw new Error(
        "SHEET_WEBHOOK_URL and SHEET_WEBHOOK_SECRET are required for DATA_BACKEND=sheets",
      );
    }
    config.sheets = { url, secret };
  }
  return config;
}

let cached: AppConfig | undefined;

export function getConfig(): AppConfig {
  cached ??= readConfig();
  return cached;
}
