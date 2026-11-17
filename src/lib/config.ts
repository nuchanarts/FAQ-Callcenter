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
  };
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
