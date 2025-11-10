import { redirect } from "next/navigation";

import { AdminPanel } from "@/components/admin/AdminPanel";
import { requireAuth, toSafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Pulse Admin",
};

export default async function AdminPage() {
  const admin = await requireAuth({ mustBeAdmin: true });
  if (!admin) {
    redirect("/auth/login");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  const payload = users.map((user) => ({
    ...toSafeUser(user),
    followerCount: user._count.followers,
    followingCount: user._count.following,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4">
      <AdminPanel initialUsers={payload} currentAdminId={admin.id} />
    </div>
  );
}
