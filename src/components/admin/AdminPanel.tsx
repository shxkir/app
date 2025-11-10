"use client";

import { useState } from "react";

import type { SafeUser } from "@/lib/auth";

type AdminUser = SafeUser & {
  followerCount: number;
  followingCount: number;
};

type Props = {
  initialUsers: AdminUser[];
  currentAdminId: string;
};

export function AdminPanel({ initialUsers, currentAdminId }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const refreshUsers = async () => {
    const response = await fetch("/api/admin/users");
    const data = await response.json();
    if (response.ok) {
      setUsers(data.users);
    }
  };

  const actOnUser = async (userId: string, action: "promote" | "demote" | "delete") => {
    setLoadingUserId(userId);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(typeof data.error === "string" ? data.error : "Action failed.");
        return;
      }
      setStatus(data.message ?? "Success");
      await refreshUsers();
    } catch (error) {
      console.error(error);
      setStatus("Action failed.");
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/80 shadow-2xl shadow-rose-900/20">
        <p className="text-xs uppercase tracking-[0.4em] text-rose-200/80">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">User control center</h1>
        <p className="mt-2 text-white/60">
          Promote trusted members, demote them, or delete accounts entirely. Cascading deletes clean up follows, sessions,
          and DMs.
        </p>
        {status && <p className="mt-4 rounded-2xl border border-white/10 p-3 text-xs text-white/70">{status}</p>}
      </div>
      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/50">
        <table className="min-w-full text-left text-sm text-white/80">
          <thead className="text-xs uppercase tracking-[0.3em] text-white/40">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Followers</th>
              <th className="p-4">Following</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-white/10 text-white/70">
                <td className="p-4">
                  <div className="font-semibold text-white">@{user.username}</div>
                  <div className="text-xs text-white/50">
                    {user.email} · joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      user.role === "ADMIN" ? "bg-rose-500/20 text-rose-200" : "bg-white/10 text-white/70"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="p-4">{user.followerCount}</td>
                <td className="p-4">{user.followingCount}</td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    {user.role === "USER" && (
                      <button
                        onClick={() => void actOnUser(user.id, "promote")}
                        disabled={loadingUserId === user.id}
                        className="rounded-full border border-emerald-400/50 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-400/10 disabled:opacity-40"
                      >
                        Promote
                      </button>
                    )}
                    {user.role === "ADMIN" && user.id !== currentAdminId && (
                      <button
                        onClick={() => void actOnUser(user.id, "demote")}
                        disabled={loadingUserId === user.id}
                        className="rounded-full border border-amber-400/40 px-3 py-1 text-xs text-amber-200 hover:bg-amber-400/10 disabled:opacity-40"
                      >
                        Demote
                      </button>
                    )}
                    {user.id !== currentAdminId && (
                      <button
                        onClick={() => void actOnUser(user.id, "delete")}
                        disabled={loadingUserId === user.id}
                        className="rounded-full border border-rose-400/40 px-3 py-1 text-xs text-rose-200 hover:bg-rose-400/10 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
