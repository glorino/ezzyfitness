import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginScreen } from "@/components/auth/LoginScreen";

export const metadata = {
  title: "Staff & Member Login",
  description: "Sign in to the Ezzy Fitness dashboard — admin, trainer, front desk and member portals.",
};

const HOME: Record<string, string> = {
  admin: "/dashboard/admin",
  trainer: "/dashboard/trainer",
  frontdesk: "/dashboard/frontdesk",
  member: "/dashboard/member",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(HOME[user.role] ?? "/dashboard");

  return <LoginScreen showDemo={process.env.SHOW_DEMO_LOGINS !== "0"} />;
}
