import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getSessionUser, toSafeUser } from "@/lib/auth";

export const metadata = {
  title: "Pulse Dashboard",
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="mx-auto max-w-6xl px-4">
      <DashboardClient user={toSafeUser(user)} />
    </div>
  );
}
