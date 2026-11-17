"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { googleSignInAction } from "@/app/actions/auth-actions";
import { th } from "@/i18n/th";

/** Minimal typing for Google Identity Services (accounts.google.com/gsi/client). */
interface GoogleId {
  initialize(opts: {
    client_id: string;
    callback: (res: { credential?: string }) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
  }): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

/**
 * "Sign in with Google" button. Google returns a signed ID token; the server verifies it and
 * only signs in Gmail accounts an owner has added (and kept active) in the staff list.
 */
export function GoogleSignIn({ clientId, next }: { clientId: string; next: string }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onCredential = useCallback(
    async (res: { credential?: string }) => {
      if (!res.credential) return setError(th.auth.googleFailed);
      setPending(true);
      setError(null);
      try {
        const result = await googleSignInAction({ credential: res.credential, next });
        // On success the action redirects; a returned value means it was refused.
        if (result && !result.ok) setError(result.error.message);
      } catch (err) {
        // redirect() surfaces as a thrown navigation signal in some runtimes — let it through.
        if (err && typeof err === "object" && "digest" in err) throw err;
        setError(th.errors.unexpected);
      } finally {
        setPending(false);
      }
    },
    [next],
  );

  const render = useCallback(() => {
    const gid = window.google?.accounts.id;
    if (!gid || !buttonRef.current) return;
    gid.initialize({ client_id: clientId, callback: onCredential, ux_mode: "popup" });
    gid.renderButton(buttonRef.current, {
      type: "standard",
      theme: "filled_blue",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      locale: "th",
      width: 320,
    });
  }, [clientId, onCredential]);

  // The script may already be loaded (client-side navigation back to /login).
  useEffect(() => {
    if (window.google?.accounts.id) render();
  }, [render]);

  return (
    <div className="flex flex-col items-center gap-3">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={render}
      />
      {error && (
        <p
          role="alert"
          className="w-full rounded-soft bg-danger-soft px-4 py-3 font-semibold text-danger"
        >
          {error}
        </p>
      )}
      <div ref={buttonRef} aria-busy={pending} className="min-h-11" />
    </div>
  );
}
