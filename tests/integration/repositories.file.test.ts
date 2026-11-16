import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createFileRepositories } from "@/repositories/file";
import { makeStored, topicRepositoryContract } from "./repositories.contract";

const dirs: string[] = [];
function tempFile() {
  const dir = mkdtempSync(join(tmpdir(), "bgs-faq-"));
  dirs.push(dir);
  return join(dir, "nested", "db.json");
}
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

topicRepositoryContract(
  "file",
  async () => createFileRepositories({ file: tempFile(), admins: [] }).topics,
);

describe("file adapter persistence", () => {
  it("persists across instances", async () => {
    const file = tempFile();
    await createFileRepositories({ file, admins: [] }).topics.upsert(makeStored(), null);
    const again = createFileRepositories({ file, admins: [] });
    expect(await again.topics.get("c-1")).not.toBeNull();
    expect(JSON.parse(readFileSync(file, "utf8")).topics).toHaveLength(1);
  });
});
