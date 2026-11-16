/**
 * Print an scrypt hash for an admin password (for inserting into `admin_users` in production).
 * Usage: npm run hash-password -- "<password>"
 */
import { hashPassword } from "../src/auth/password.ts";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: npm run hash-password -- "<password of at least 12 characters>"');
  process.exit(1);
}
console.log(await hashPassword(password));
