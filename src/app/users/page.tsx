import { prisma } from "@/lib/db/client";
import { AddUserForm } from "@/components/AddUserForm";
import { formatDate } from "@/lib/format";

// User list changes as people are added - never prerender statically.
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Users</h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        Anyone logged in can add another login here - handy for giving access to people
        you&rsquo;re demoing the platform to. There&rsquo;s no self-signup by design; this
        is an interim way to manage access before a fuller auth setup is wired up.
      </p>

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold">Add a user</h2>
        <AddUserForm />
      </div>

      <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Added</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 font-medium">{user.email}</td>
                <td className="px-4 py-3">{user.name || "-"}</td>
                <td className="px-4 py-3">{formatDate(user.createdAt.toISOString())}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
