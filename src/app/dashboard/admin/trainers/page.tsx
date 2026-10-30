import { UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { AddTrainerButton, TrainerActions, TrainerMeta, type TrainerRow } from "./TrainerActions";
import { RefreshButton } from "@/components/dash/actions";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Field";
import { PageHeader, Panel, StatusPill } from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { cn } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminTrainers() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const trainers = await query<TrainerRow & { classes_today: number }>(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_media_id, u.status,
            t.bio, t.specialties, t.certifications, t.experience_years, t.instagram, t.is_visible,
            (SELECT COUNT(*) FROM classes c
              WHERE c.trainer_id = u.id AND c.is_active
                AND c.day_of_week = EXTRACT(DOW FROM CURRENT_DATE))::int AS classes_today,
            (SELECT COUNT(DISTINCT ca.member_id) FROM class_attendance ca
              JOIN classes c ON c.id = ca.class_id
              WHERE c.trainer_id = u.id)::int AS members_trained
       FROM trainers t
       JOIN users u ON u.id = t.user_id
      ORDER BY u.status = 'active' DESC, t.sort_order, u.full_name`
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Management"
        title="Trainers"
        subtitle={`${trainers.length} coach${trainers.length === 1 ? "" : "es"} on the team`}
        action={
          <>
            <RefreshButton />
            <AddTrainerButton />
          </>
        }
      />

      {trainers.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No trainers yet"
          description="Add your first coach — they immediately get their own dashboard and a public profile page."
          action={<AddTrainerButton />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trainers.map((t) => (
            <div
              key={t.id}
              className={cn(
                "surface-raised flex flex-col gap-4 p-5 transition-colors",
                t.status === "active" ? "hover:border-white/20" : "opacity-60"
              )}
            >
              <div className="flex items-start gap-4">
                <Avatar name={t.full_name} mediaId={t.avatar_media_id} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-smoke-100">{t.full_name}</p>
                    {!t.is_visible && (
                      <span className="shrink-0 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-smoke-500">
                        hidden
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusPill value={t.status} />
                    <span className="text-xs text-smoke-500">
                      {t.experience_years} yr{t.experience_years === 1 ? "" : "s"} exp
                    </span>
                  </div>
                </div>
                <TrainerActions trainer={t} />
              </div>

              {t.bio && <p className="line-clamp-3 text-sm leading-relaxed text-smoke-400">{t.bio}</p>}

              {t.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {t.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-cyanx/25 bg-cyanx/10 px-2.5 py-1 text-[10px] font-semibold text-cyanx"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <TrainerMeta trainer={t} />

              <div className="mt-auto grid grid-cols-2 gap-2 border-t border-white/8 pt-4">
                <div className="rounded-xl bg-white/[0.03] px-3 py-2.5 text-center">
                  <p className="font-display text-xl text-smoke-100">{t.classes_today}</p>
                  <p className="text-[10px] uppercase tracking-wider text-smoke-500">classes today</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] px-3 py-2.5 text-center">
                  <p className="font-display text-xl text-smoke-100">{t.members_trained}</p>
                  <p className="text-[10px] uppercase tracking-wider text-smoke-500">members trained</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Panel title="How trainer accounts work">
        <p className="text-sm leading-relaxed text-smoke-400">
          Trainers sign in at <span className="font-mono text-volt-300">/login</span> and land on their own dashboard —
          they can edit their bio, specialties and photo, mark attendance for their classes, and check members in.
          Admins keep control of contact details, password resets and account removal from this page.
        </p>
      </Panel>
    </div>
  );
}
