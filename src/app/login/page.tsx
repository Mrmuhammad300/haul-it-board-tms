"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

/** Only allow same-origin relative paths - the raw query param must not be
 * used as-is, or an attacker-crafted callbackUrl could redirect off-site. */
function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setSubmitting(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    // A hard navigation (not router.push) so the new session cookie is
    // guaranteed to be picked up - the client router's prefetch cache can
    // otherwise replay a pre-login redirect-to-login response cached for
    // this path before authentication happened.
    window.location.href = callbackUrl;
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h1 className="mb-1 text-lg font-semibold">D&amp;M Logistics</h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to the quote calculator.
        </p>

        <label className="mb-3 flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Email</span>
          <input
            type="email"
            required
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="mb-4 flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Password</span>
          <input
            type="password"
            required
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
