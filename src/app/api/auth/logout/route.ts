import { NextResponse } from "next/server";
import { endSession, getCurrentUser, logActivity } from "@/lib/auth";
import { api } from "@/lib/api";

export async function POST() {
  return api(async () => {
    const user = await getCurrentUser();
    if (user) await logActivity(user.id, "Signed out", "auth");
    await endSession();
    return { ok: true };
  });
}

export async function GET() {
  return api(async () => ({ ok: false, note: "POST to this endpoint to sign out." }));
}
