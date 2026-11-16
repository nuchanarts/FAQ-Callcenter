import { createMemoryRepositories } from "@/repositories/memory";
import { topicRepositoryContract } from "./repositories.contract";

topicRepositoryContract("memory", async () => createMemoryRepositories({ admins: [] }).topics);
