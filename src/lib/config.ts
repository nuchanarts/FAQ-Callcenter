export const BACKENDS = ["file", "memory", "failing", "supabase"] as const;
export type Backend = (typeof BACKENDS)[number];

const DEV_SECRET = "dev-only-session-secret-do-not-use-in-prod";
const MIN_SECRET_LENGTH = 32;

export interface AppConfig {
  backend: Backend;
  isProduction: boolean;
  sessionSecret: string;
  dataFile: string;
  allowDemoAdmins: boolean;
  supabase?: { url: string; serviceRoleKey: string };
}

type Env = Record<string, string | undefined>;

function isBackend(value: string): value is Backend {
  return (BACKENDS as readonly string[]).includes(value);
}

/** Read and validate configuration from environment variables. */
export function readConfig(env: Env = process.env): AppConfig {
  const backend = env.DATA_BACKEND ?? "file";
  if (!isBackend(backend)) {
    throw new Error(`DATA_BACKEND must be one of ${BACKENDS.join(", ")}`);
  }
  const isProduction = env.NODE_ENV === "production";
  const sessionSecret = env.SESSION_SECRET ?? (isProduction ? "" : DEV_SECRET);
  if (sessionSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(`SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
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
  return config;
}

let cached: AppConfig | undefined;

export function getConfig(): AppConfig {
  cached ??= readConfig();
  return cached;
}
