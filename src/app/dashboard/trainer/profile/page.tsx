import { Award, CalendarCheck, KeyRound, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { AvatarCard } from "@/components/dash/AvatarCard";
import { PasswordForm, TrainerProfileForm } from "@/components/dash/StaffForms";
import { PageHeader, Panel, StatCard, StatGrid } from "@/components/dash/ui";
import { Avatar } from "@/components/ui/Avatar";
import { InstagramIcon } from "@/components/brand/SocialIcons";
import { getCurrentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TrainerProfile() {
  const user = await getCurrentUser();
  if (!user || user.role !== "trainer") redirect("/login");

  const [profile, stats] = await Promise.all([
    one<{
      bio: string | null;
      specialties: string[];
      certifications: string[];
      experience_years: number;
      instagram: string | null;
      is_visible: boolean;
    }>(`SELECT bio, specialties, certifications, experience_years, instagram, is_visible
          FROM trainers WHERE user_id = $1`, [user.id]),
    query<{ classes: number; sessions: number; members: number }>(
      `SELECT
         (SELECT COUNT(*) FROM classes WHERE trainer_id = $1 AND is_active)::int AS classes,
         (SELECT COUNT(DISTINCT session_date) FROM class_attendance ca
           JOIN classes c ON c.id = ca.class_id WHERE c.trainer_id = $1)::int AS sessions,
         (SELECT COUNT(DISTINCT member_id) FROM class_attendance ca
           JOIN classes c ON c.id = ca.class_id WHERE c.trainer_id = $1)::int AS members`,
      [user.id]
    ),
  ]);

  const s = stats[0];
  const p = {
    bio: profile?.bio ?? "",
    specialties: profile?.specialties ?? [],
    certifications: profile?.certifications ?? [],
    experienceYears: profile?.experience_years ?? 0,
    instagram: profile?.instagram ?? null,
    fullName: user.full_name,
    phone: user.phone,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Coaching"
        title="My profile"
        subtitle="This is what members see on the public coaches page."
      />

      {/* header card */}
      <div className="surface-raised relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-volt-300/12 via-transparent to-cyanx/8" />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <Avatar name={user.full_name} mediaId={user.avatar_media_id} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl text-smoke-100">{user.full_name}</h2>
              <span className="rounded-full border border-cyanx/30 bg-cyanx/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyanx">
                coach
              </span>
              {!profile?.is_visible && (
                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  hidden from site
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-smoke-400">
              {user.email}
              {user.phone && ` · ${user.phone}`}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {p.specialties.length > 0 &&
                p.specialties.map((sp) => (
                  <span
                    key={sp}
                    className="rounded-full border border-cyanx/25 bg-cyanx/10 px-2.5 py-1 text-[10px] font-semibold text-cyanx"
                  >
                    {sp}
                  </span>
                ))}
              {p.instagram && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-smoke-300">
                  <InstagramIcon className="h-3 w-3" /> @{p.instagram.replace(/^@/, "")}
                </span>
              )}
              {p.certifications.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-volt-300/25 bg-volt-300/10 px-2.5 py-1 text-[10px] font-semibold text-volt-300">
                  <Award className="h-3 w-3" /> {p.certifications.join(" · ")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <StatGrid>
        <StatCard label="Active classes" value={s?.classes ?? 0} icon={<CalendarCheck className="h-5 w-5" />} tone="volt" />
        <StatCard label="Sessions held" value={s?.sessions ?? 0} icon={<CalendarCheck className="h-5 w-5" />} tone="cyan" />
        <StatCard label="Members trained" value={s?.members ?? 0} icon={<UserRound className="h-5 w-5" />} tone="neutral" />
        <StatCard label="Experience" value={`${p.experienceYears} yrs`} icon={<Award className="h-5 w-5" />} tone="volt" />
      </StatGrid>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Public profile" subtitle="Bio, specialties and socials">
            <TrainerProfileForm userId={user.id} initial={p} />
          </Panel>

          <Panel title="Security" subtitle="Password change requires your current password">
            <PasswordForm userId={user.id} />
          </Panel>
        </div>

        <div className="space-y-6">
          <AvatarCard fullName={user.full_name} mediaId={user.avatar_media_id} label="Coach photo" />

          <Panel title="Account" subtitle="Your Ezzy Fitness identity">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-smoke-500">Email</dt>
                <dd className="truncate text-smoke-200">{user.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-smoke-500">Role</dt>
                <dd className="capitalize text-smoke-200">Trainer</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-smoke-500">Member since</dt>
                <dd className="text-smoke-200">{formatDate(user.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-smoke-500">Last sign-in</dt>
                <dd className="text-smoke-200">{formatDate(user.last_login_at)}</dd>
              </div>
            </dl>
          </Panel>

          <div className="rounded-2xl border border-cyanx/25 bg-cyanx/8 p-5">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider2 text-cyanx">
              <InstagramIcon className="h-3.5 w-3.5" /> Public page
            </p>
            <p className="mt-2 text-xs leading-relaxed text-smoke-400">
              Your coach profile appears on <span className="text-smoke-200">/trainers</span> — members can see your
              bio, specialties and certifications there.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
