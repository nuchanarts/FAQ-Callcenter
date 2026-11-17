"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Power, UserPlus } from "lucide-react";
import {
  createUserAction,
  resetPasswordAction,
  updateUserAction,
} from "@/app/actions/user-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { useActionFeedback } from "@/components/features/admin/use-action-feedback";
import { ADMIN_ROLES, type AdminRole } from "@/domain/permissions";
import { th } from "@/i18n/th";
import type { AdminUserView } from "@/services/user-service";

const u = th.users;

/** Owner-only screen: add admin accounts, change roles, reset passwords, disable accounts. */
export function UsersManager({ users, meId }: { users: AdminUserView[]; meId: string }) {
  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-4">
        <p aria-live="polite" className="text-[0.95rem] text-ink-faint">
          {u.count(users.length)}
        </p>
        <div className="overflow-x-auto rounded-soft border border-line bg-surface">
          <table className="w-full min-w-[48rem] text-left">
            <thead className="border-b border-line bg-surface-muted text-[0.95rem] text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {u.displayName} / {u.email}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {u.role}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {u.status}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {u.newPassword}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserRow key={user.id} user={user} isMe={user.id === meId} />
              ))}
            </tbody>
          </table>
        </div>
        <AddUserForm />
      </div>

      <aside className="flex flex-col gap-3 rounded-soft border border-line bg-surface p-5 xl:sticky xl:top-24">
        <h2 className="text-lg font-semibold">{u.rolesTitle}</h2>
        {ADMIN_ROLES.map((role) => (
          <div key={role}>
            <Badge tone={role === "owner" ? "herb" : role === "approver" ? "team" : "neutral"}>
              {th.roles[role]}
            </Badge>
            <p className="mt-1 text-[0.95rem] text-ink-muted">{th.roles.describe[role]}</p>
          </div>
        ))}
      </aside>
    </div>
  );
}

function RoleSelect({
  value,
  onChange,
  disabled,
  id,
  label,
}: {
  value: AdminRole;
  onChange: (role: AdminRole) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
}) {
  return (
    <Select
      id={id}
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as AdminRole)}
    >
      {ADMIN_ROLES.map((role) => (
        <option key={role} value={role}>
          {th.roles[role]}
        </option>
      ))}
    </Select>
  );
}

function UserRow({ user, isMe }: { user: AdminUserView; isMe: boolean }) {
  const { run, pending } = useActionFeedback();
  const [password, setPassword] = useState("");

  const changeRole = (role: AdminRole) =>
    run(() => updateUserAction({ id: user.id, role }), u.updated);
  const toggleActive = () =>
    run(() => updateUserAction({ id: user.id, active: !user.active }), u.updated);
  const reset = async () => {
    const res = await run(() => resetPasswordAction({ id: user.id, password }), u.passwordReset);
    if (res.ok) setPassword("");
  };

  return (
    <tr className="border-b border-line align-top last:border-b-0">
      <td className="px-4 py-3">
        <p className={user.active ? "font-semibold" : "font-semibold text-ink-faint line-through"}>
          {user.displayName} {isMe && <span className="text-ink-faint">{u.you}</span>}
        </p>
        <p className="text-[0.93rem] text-ink-faint">{user.email}</p>
      </td>
      <td className="px-4 py-3">
        <RoleSelect
          label={`${u.role} ${user.displayName}`}
          value={user.role}
          disabled={isMe || pending}
          onChange={changeRole}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-2">
          <Badge tone={user.active ? "herb" : "danger"}>
            {user.active ? u.active : u.inactive}
          </Badge>
          {!isMe && (
            <Button variant="ghost" size="sm" pending={pending} onClick={toggleActive}>
              <Power aria-hidden className="size-4" />
              {user.active ? u.deactivate : u.activate}
            </Button>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Input
            type="password"
            autoComplete="new-password"
            aria-label={`${u.newPassword} ${user.displayName}`}
            placeholder={u.newPassword}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            variant="secondary"
            size="sm"
            pending={pending}
            disabled={password.length === 0}
            onClick={reset}
          >
            <KeyRound aria-hidden className="size-4" />
            {u.save}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function AddUserForm() {
  const { run, pending } = useActionFeedback();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<AdminRole>("author");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await run(
      () => createUserAction({ email, displayName, role, password }),
      u.created,
    );
    if (res.ok) {
      setEmail("");
      setDisplayName("");
      setPassword("");
      setRole("author");
      setErrors({});
    } else {
      setErrors(res.error.fieldErrors ?? {});
    }
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-soft border border-line bg-surface p-5"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <UserPlus aria-hidden className="size-5 text-herb" />
        {u.add}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={u.email} error={errors.email?.[0]} required>
          {(p) => (
            <Input
              {...p}
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        <Field label={u.displayName} error={errors.displayName?.[0]} required>
          {(p) => (
            <Input {...p} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          )}
        </Field>
        <Field label={u.role} required>
          {(p) => <RoleSelect id={p.id} value={role} onChange={setRole} />}
        </Field>
        <Field label={u.password} hint={u.passwordHint} error={errors.password?.[0]} required>
          {(p) => (
            <Input
              {...p}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
      </div>
      <Button type="submit" size="md" pending={pending} className="self-start">
        <UserPlus aria-hidden className="size-5" />
        {u.add}
      </Button>
    </form>
  );
}
