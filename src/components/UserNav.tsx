"use client";

import { useSession, signOut } from "next-auth/react";

export function UserNav() {
  const { data: session } = useSession();
  if (!session?.user) return null;

  return (
    <div className="ml-auto flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="hidden sm:inline">{session.user.email}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-md border border-zinc-300 px-3 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Sign out
      </button>
    </div>
  );
}
