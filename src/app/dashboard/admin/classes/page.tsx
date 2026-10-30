import { CalendarCheck, MapPin, Timer, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { AddClassButton, ClassActions, type ClassRow } from "./ClassActions";
import { MarkAttendanceButton } from "./MarkAttendanceButton";
import type { MemberOption } from "@/components/dash/MemberPicker";
import { RefreshButton } from "@/components/dash/actions";
import { PageHeader, Panel, ProgressBar } from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { cn, dayShort, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AdminClasses() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const [classes, trainers, members] = await Promise.all([
    query<ClassRow>(
      `SELECT c.id, c.name, c.category, c.description, c.trainer_id, u.full_name AS trainer_name,
              c.day_of_week, c.start_time::text AS start_time, c.end_time::text AS end_time,
              c.capacity, c.location, c.intensity, c.is_active,
              (SELECT COUNT(*) FROM class_attendance ca
                WHERE ca.class_id = c.id AND ca.session_date = CURRENT_DATE
                  AND ca.status IN ('present','late'))::int AS enrolled
         FROM classes c
         LEFT JOIN users u ON u.id = c.trainer_id
        ORDER BY c.day_of_week, c.start_time`
    ),
    query<{ id: number; full_name: string }>(
      `SELECT u.id, u.full_name FROM trainers t JOIN users u ON u.id = t.user_id
        WHERE u.status = 'active' ORDER BY u.full_name`
    ),
    query<MemberOption>(
      `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_media_id,
              m.membership_no, m.status, m.expires_at::text AS expires_at, true AS checked_in_today
         FROM users u JOIN members m ON m.user_id = u.id
        WHERE m.status = 'active'
        ORDER BY u.full_name LIMIT 100`
    ),
  ]);

  // group by day for a weekly view
  const byDay = DAYS.map((label, i) => ({
    label,
    idx: i,
    classes: classes.filter((c) => c.day_of_week === i),
  }));

  const todayIdx = new Date().getDay();
  const totalSeats = classes.filter((c) => c.is_active).reduce((a, c) => a + c.capacity, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Management"
        title="Class schedule"
        subtitle={`${classes.filter((c) => c.is_active).length} active classes · ${totalSeats} weekly seats`}
        action={
          <>
            <RefreshButton />
            <MarkAttendanceButton
              classes={classes.filter((c) => c.is_active).map((c) => ({ id: c.id, name: c.name }))}
              members={members}
            />
            <AddClassButton trainers={trainers} />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {byDay.map((day) => (
          <div key={day.idx} className={cn("space-y-3", day.idx !== todayIdx && "opacity-90")}>
            <div className="flex items-center justify-between">
              <h3
                className={cn(
                  "text-sm font-bold uppercase tracking-wider2",
                  day.idx === todayIdx ? "text-volt-300" : "text-smoke-400"
                )}
              >
                {day.label}
                {day.idx === todayIdx && (
                  <span className="ml-2 rounded-full border border-volt-300/30 bg-volt-300/10 px-2 py-0.5 text-[9px]">
                    today
                  </span>
                )}
              </h3>
              <span className="text-xs text-smoke-600">{day.classes.length}</span>
            </div>

            {day.classes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-smoke-600">
                Rest day
              </div>
            ) : (
              <ul className="space-y-2.5">
                {day.classes.map((c) => (
                  <li
                    key={c.id}
                    className={cn(
                      "surface-raised p-4 transition-colors",
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
                        <p className="mt-0.5 text-xs text-smoke-500">
                          {c.trainer_name ?? "Unassigned"} · {c.category}
                        </p>
                      </div>
                      <ClassActions klass={c} trainers={trainers} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-smoke-400">
                      <p className="flex items-center gap-1.5">
                        <Timer className="h-3.5 w-3.5 shrink-0 text-smoke-600" />
                        {formatTime(c.start_time)}–{formatTime(c.end_time)}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-smoke-600" />
                        <span className="truncate">{c.location}</span>
                      </p>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-smoke-500">
                          <Users className="h-3.5 w-3.5" /> Capacity
                        </span>
                        <span className="font-semibold text-smoke-300">
                          {c.enrolled} / {c.capacity} today
                        </span>
                      </div>
                      <ProgressBar
                        value={c.enrolled}
                        max={c.capacity}
                        tone={c.enrolled >= c.capacity ? "ember" : "volt"}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <Panel title="Scheduling tips">
        <div className="flex items-start gap-3 text-sm leading-relaxed text-smoke-400">
          <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-volt-300" />
          <p>
            Classes appear instantly on the public homepage schedule. Pausing a class hides it from members
            without deleting attendance history. Assign a trainer so they can mark attendance from their own
            dashboard.
          </p>
        </div>
      </Panel>
    </div>
  );
}
