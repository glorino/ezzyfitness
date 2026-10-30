import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { Shell, type ShellUser } from "@/components/dash/Shell";

const HOME: Record<string, string> = {
  admin: "/dashboard/admin",
  trainer: "/dashboard/trainer",
  frontdesk: "/dashboard/frontdesk",
  member: "/dashboard/member",
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const shellUser: ShellUser = {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    avatarMediaId: user.avatar_media_id,
  };

  let announcement: string | null = null;
  try {
    const s = await one<{ value: { announcement?: string } }>(
      `SELECT value FROM settings WHERE key = 'general'`
    );
    announcement = s?.value?.announcement ?? null;
  } catch {
    announcement = null;
  }

  return (
    <Shell user={shellUser} announcement={announcement}>
      {children}
    </Shell>
  );
}
