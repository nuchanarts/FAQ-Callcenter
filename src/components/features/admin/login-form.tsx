"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { signInAction, type SignInState } from "@/app/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { th } from "@/i18n/th";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, null);
  const error = state && !state.ok ? state.error : null;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      {error && (
        <p role="alert" className="rounded-soft bg-danger-soft px-4 py-3 font-semibold text-danger">
          {error.message}
        </p>
      )}
      <Field label={th.auth.email} name="email" required error={error?.fieldErrors?.email?.[0]}>
        {(p) => <Input {...p} type="email" autoComplete="username" inputMode="email" />}
      </Field>
      <Field
        label={th.auth.password}
        name="password"
        required
        error={error?.fieldErrors?.password?.[0]}
      >
        {(p) => <Input {...p} type="password" autoComplete="current-password" />}
      </Field>
      <Button type="submit" size="lg" pending={pending}>
        <LogIn aria-hidden className="size-5" />
        {th.auth.submit}
      </Button>
    </form>
  );
}
