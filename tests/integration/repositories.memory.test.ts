import { createMemoryRepositories } from "@/repositories/memory";
import { topicRepositoryContract } from "./repositories.contract";
import { statsRepositoryContract } from "./stats.contract";

topicRepositoryContract("memory", async () => createMemoryRepositories({ admins: [] }).topics);

statsRepositoryContract("memory", async () => createMemoryRepositories({ admins: [] }).stats);
