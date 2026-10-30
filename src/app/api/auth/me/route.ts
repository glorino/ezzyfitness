import { getCurrentUser } from "@/lib/auth";
import { api } from "@/lib/api";

export async function GET() {
  return api(async () => {
    const user = await getCurrentUser();
    if (!user) return { user: null };
    return {
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarMediaId: user.avatar_media_id,
        lastLoginAt: user.last_login_at,
      },
    };
  });
}
