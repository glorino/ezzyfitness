import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const HOME: Record<string, string> = {
  admin: "/dashboard/admin",
  trainer: "/dashboard/trainer",
  frontdesk: "/dashboard/frontdesk",
  member: "/dashboard/member",
};

/** /dashboard → send each role to its own workspace. */
export default async function DashboardIndex() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(HOME[user.role] ?? "/dashboard/member");
}
