"use server";

import { revalidatePath } from "next/cache";
import { getAdmin } from "@/auth/current-admin";
import { runAction, type ActionResult } from "@/lib/action-result";
import { userService } from "@/services";
import type { AdminUserView } from "@/services/user-service";

// Thin entry points: the service re-checks that the caller is an owner and validates input.

type Result = Promise<ActionResult<AdminUserView>>;

const done = async (fn: () => Promise<AdminUserView>): Result =>
  runAction(async () => {
    const user = await fn();
    revalidatePath("/admin/users");
    return user;
  });

export async function createUserAction(input: {
  email: string;
  displayName: string;
  role: string;
}): Result {
  return done(async () => userService().createUser(await getAdmin(), input));
}

export async function updateUserAction(input: {
  id: string;
  displayName?: string;
  role?: string;
  active?: boolean;
}): Result {
  return done(async () => userService().updateUser(await getAdmin(), input));
}
