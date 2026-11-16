import { randomBytes, scrypt as scryptCb, scryptSync, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const KEY_LENGTH = 64;
const PREFIX = "scrypt";
const HEX = /^[0-9a-f]+$/;

function encode(salt: Buffer, key: Buffer): string {
  return [PREFIX, salt.toString("hex"), key.toString("hex")].join("$");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  return encode(salt, await scrypt(password, salt, KEY_LENGTH));
}

/** Synchronous variant for seeding demo accounts at startup. */
export function hashPasswordSync(password: string): string {
  const salt = randomBytes(16);
  return encode(salt, scryptSync(password, salt, KEY_LENGTH));
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [prefix, saltHex, keyHex] = stored.split("$");
  if (prefix !== PREFIX || !saltHex || !keyHex || !HEX.test(saltHex) || !HEX.test(keyHex)) {
    return false;
  }
  const expected = Buffer.from(keyHex, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  return timingSafeEqual(actual, expected);
}
