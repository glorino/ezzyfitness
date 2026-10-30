import { CalendarCheck, MapPin, Timer, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { MarkAttendance } from "./MarkAttendance";
import type { MemberOption } from "@/components/dash/MemberPicker";
import { RefreshButton } from "@/components/dash/actions";
import { PageHeader, Panel, ProgressBar, EmptyRow } from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { cn, dayName, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function TrainerClasses() {
  const user = await getCurrentUser();
  if (!user || user.role !== "trainer") redirect("/login");

  const [classes, members] = await Promise.all([
    query<{
      id: number;
      name: string;
      category: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      capacity: number;
      location: string;
      intensity: string;
      is_active: boolean;
      enrolled_today: number;
      avg_attendance: number;
      total_sessions: number;
    }>(
      `SELECT c.id, c.name, c.category, c.day_of_week,
              c.start_time::text AS start_time, c.end_time::text AS end_time,
              c.capacity, c.location, c.intensity, c.is_active,
              (SELECT COUNT(*) FROM class_attendance ca
                WHERE ca.class_id = c.id AND ca.session_date = CURRENT_DATE
                  AND ca.status IN ('present','late'))::int AS enrolled_today,
              COALESCE((SELECT ROUND(AVG(x.n)) FROM (
                 SELECT COUNT(*) AS n FROM class_attendance ca2
                  WHERE ca2.class_id = c.id AND ca2.status IN ('present','late')
                  GROUP BY ca2.session_date) x), 0)::int AS avg_attendance,
              (SELECT COUNT(DISTINCT session_date) FROM class_attendance ca3
                WHERE ca3.class_id = c.id)::int AS total_sessions
         FROM classes c
        WHERE c.trainer_id = $1
        ORDER BY (c.day_of_week + 6 - EXTRACT(DOW FROM CURRENT_DATE)) % 7, c.start_time`,
      [user.id]
    ),
    query<MemberOption>(
      `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_media_id,
              m.membership_no, m.status, m.expires_at::text AS expires_at, true AS checked_in_today
         FROM users u
         JOIN members m ON m.user_id = u.id
        WHERE m.status = 'active'
          AND EXISTS (
            SELECT 1 FROM class_attendance ca JOIN classes c ON c.id = ca.class_id
             WHERE ca.member_id = u.id AND c.trainer_id = $1)
        ORDER BY u.full_name
        LIMIT 100`,
      [user.id]
    ),
  ]);

  const todayIdx = new Date().getDay();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Coaching"
        title="My classes"
        subtitle={`${classes.filter((c) => c.is_active).length} classes on the schedule`}
        action={<RefreshButton />}
      />

      {classes.length === 0 ? (
        <EmptyRow
          title="No classes assigned yet"
          hint="An admin can assign classes to you from the schedule page."
          icon={CalendarCheck}
          colSpan={1}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => (
            <div
              key={c.id}
              className={cn(
                "surface-raised flex flex-col p-5",
                c.is_active ? "hover:border-white/20" : "opacity-55"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-smoke-100">{c.name}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        c.intensity === "High"
                          ? "border-ember/30 bg-ember/10 text-ember"
                          : c.intensity === "Medium"
                            ? "border-amber-300/30 bg-amber-300/10 text-amber-300"
                            : "border-cyanx/30 bg-cyanx/10 text-cyanx"
                      )}
                    >
                      {c.intensity}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-smoke-500">{c.category}</p>
                </div>
                {c.day_of_week === todayIdx && (
                  <span className="shrink-0 rounded-full border border-volt-300/30 bg-volt-300/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-volt-300">
                    today
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-smoke-400">
                <p className="flex items-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5 shrink-0 text-smoke-600" />
                  {dayName(c.day_of_week)}
                </p>
                <p className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 shrink-0 text-smoke-600" />
                  {formatTime(c.start_time)}–{formatTime(c.end_time)}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-smoke-600" />
                  {c.location}
                </p>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-smoke-500">
                    <Users className="h-3.5 w-3.5" /> Today
                  </span>
                  <span className="font-semibold text-smoke-300">{c.enrolled_today} / {c.capacity}</span>
                </div>
                <ProgressBar value={c.enrolled_today} max={c.capacity} tone={c.enrolled_today >= c.capacity ? "ember" : "volt"} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/8 pt-4 text-center">
                <div>
                  <p className="font-display text-lg text-smoke-100">{c.avg_attendance}</p>
                  <p className="text-[10px] uppercase tracking-wider text-smoke-500">avg turnout</p>
                </div>
                <div>
                  <p className="font-display text-lg text-smoke-100">{c.total_sessions}</p>
                  <p className="text-[10px] uppercase tracking-wider text-smoke-500">sessions held</p>
                </div>
              </div>

              {c.is_active && (
                <div className="mt-4">
                  <MarkAttendance klass={{ id: c.id, name: c.name, day_of_week: c.day_of_week }} members={members} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Panel title="Attendance made easy">
        <p className="text-sm leading-relaxed text-smoke-400">
          Marking attendance updates each member&apos;s visit history instantly — present, late or absent.
          Re-marking the same day simply overwrites the previous entry, so mistakes are easy to fix.
        </p>
      </Panel>
    </div>
  );
}
