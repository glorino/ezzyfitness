import { CalendarCheck, ClipboardCheck, Dumbbell, Timer, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TrainerCheckinButton } from "./TrainerCheckinButton";
import { RefreshButton } from "@/components/dash/actions";
import { PageHeader, Panel, ProgressBar, StatCard, StatGrid, StatusPill, Table, Td, Tr, EmptyRow } from "@/components/dash/ui";
import { Avatar } from "@/components/ui/Avatar";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { cn, dayName, formatTime, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TrainerOverview() {
  const user = await getCurrentUser();
  if (!user || user.role !== "trainer") redirect("/login");

  const todayIdx = new Date().getDay();

  const [stats, todaysClasses, upcoming, recentMembers] = await Promise.all([
    query<{ my_classes: number; todays: number; members_seen: number; checkins: number }>(
      `SELECT
         (SELECT COUNT(*) FROM classes WHERE trainer_id = $1 AND is_active)::int AS my_classes,
         (SELECT COUNT(*) FROM classes WHERE trainer_id = $1 AND is_active AND day_of_week = $2)::int AS todays,
         (SELECT COUNT(DISTINCT ca.member_id) FROM class_attendance ca
           JOIN classes c ON c.id = ca.class_id WHERE c.trainer_id = $1)::int AS members_seen,
         (SELECT COUNT(*) FROM check_ins WHERE created_by = $1 AND created_at::date = CURRENT_DATE)::int AS checkins`,
      [user.id, todayIdx]
    ),
    query<{
      id: number;
      name: string;
      category: string;
      start_time: string;
      end_time: string;
      capacity: number;
      location: string;
      intensity: string;
      enrolled: number;
    }>(
      `SELECT c.id, c.name, c.category, c.start_time::text AS start_time, c.end_time::text AS end_time,
              c.capacity, c.location, c.intensity,
              (SELECT COUNT(*) FROM class_attendance ca
                WHERE ca.class_id = c.id AND ca.session_date = CURRENT_DATE
                  AND ca.status IN ('present','late'))::int AS enrolled
         FROM classes c
        WHERE c.trainer_id = $1 AND c.is_active AND c.day_of_week = $2
        ORDER BY c.start_time`,
      [user.id, todayIdx]
    ),
    query<{
      id: number;
      name: string;
      day_of_week: number;
      start_time: string;
      location: string;
      capacity: number;
      intensity: string;
    }>(
      `SELECT id, name, day_of_week, start_time::text AS start_time, location, capacity, intensity
         FROM classes
        WHERE trainer_id = $1 AND is_active AND day_of_week <> $2
        ORDER BY (day_of_week + 6 - $2) % 7, start_time
        LIMIT 5`,
      [user.id, todayIdx]
    ),
    query(
      `SELECT u.id, u.full_name, u.avatar_media_id, m.membership_no, m.status,
              MAX(ca.session_date)::text AS last_seen,
              COUNT(*) AS sessions
         FROM class_attendance ca
         JOIN classes c ON c.id = ca.class_id
         JOIN users u ON u.id = ca.member_id
         LEFT JOIN members m ON m.user_id = u.id
        WHERE c.trainer_id = $1
        GROUP BY u.id, u.full_name, u.avatar_media_id, m.membership_no, m.status
        ORDER BY MAX(ca.session_date) DESC
        LIMIT 6`,
      [user.id]
    ),
  ]);

  const s = stats[0];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Coaching"
        title={`Coach ${user.full_name.split(" ")[0]}`}
        subtitle={
          todayIdx !== null
            ? `${dayName(todayIdx)} · ${s?.todays ?? 0} class${s?.todays === 1 ? "" : "es"} on the floor today`
            : ""
        }
        action={
          <>
            <RefreshButton />
            <TrainerCheckinButton />
          </>
        }
      />

      <StatGrid>
        <StatCard label="My classes" value={s?.my_classes ?? 0} hint="Active on the schedule" icon={<CalendarCheck className="h-5 w-5" />} tone="volt" />
        <StatCard label="Today's sessions" value={s?.todays ?? 0} hint={dayName(todayIdx)} icon={<Timer className="h-5 w-5" />} tone="cyan" />
        <StatCard label="Members trained" value={s?.members_seen ?? 0} hint="Unique faces in attendance" icon={<Users className="h-5 w-5" />} tone="volt" />
        <StatCard label="Check-ins by me" value={s?.checkins ?? 0} hint="Today" icon={<ClipboardCheck className="h-5 w-5" />} tone="neutral" />
      </StatGrid>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Today's classes"
          subtitle={dayName(todayIdx)}
          className="xl:col-span-2"
          action={
            <Link href="/dashboard/trainer/classes" className="text-xs font-semibold text-volt-300 hover:underline">
              Manage
            </Link>
          }
        >
          {todaysClasses.length === 0 ? (
            <EmptyRow
              title="No classes scheduled today"
              hint="Rest day — or add one from the admin team."
              icon={Dumbbell}
              colSpan={1}
            />
          ) : (
            <ul className="space-y-3">
              {todaysClasses.map((c) => (
                <li key={c.id} className="surface-raised p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
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
                        {formatTime(c.start_time)}–{formatTime(c.end_time)} · {c.location} · {c.category}
                      </p>
                    </div>
                    <Link href="/dashboard/trainer/classes" className="btn-ghost btn-sm shrink-0">
                      <ClipboardCheck className="h-3.5 w-3.5" /> Mark attendance
                    </Link>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-smoke-500">Booked today</span>
                      <span className="font-semibold text-smoke-300">{c.enrolled} / {c.capacity}</span>
                    </div>
                    <ProgressBar value={c.enrolled} max={c.capacity} tone={c.enrolled >= c.capacity ? "ember" : "volt"} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Coming up next" subtitle="Your next sessions this week">
            {upcoming.length === 0 ? (
              <p className="py-4 text-center text-sm text-smoke-500">Nothing else scheduled this week.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-smoke-100">{c.name}</p>
                      <p className="text-xs text-smoke-500">
                        {dayName(c.day_of_week).slice(0, 3)} {formatTime(c.start_time)} · {c.location}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-smoke-500">{c.capacity} spots</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Recent members in your classes" pad={false}>
        <Table head={["Member", "Status", "Last seen", "Sessions"]}>
          {recentMembers.length === 0 ? (
            <EmptyRow title="No attendance recorded yet" hint="Mark attendance after your first session." icon={Users} colSpan={4} />
          ) : (
            recentMembers.map((m) => (
              <Tr key={m.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={m.full_name} mediaId={m.avatar_media_id} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-smoke-100">{m.full_name}</p>
                      <p className="truncate text-xs text-smoke-500">{m.membership_no}</p>
                    </div>
                  </div>
                </Td>
                <Td><StatusPill value={m.status} /></Td>
                <Td className="text-xs">{m.last_seen ? relativeTime(m.last_seen) : "—"}</Td>
                <Td className="font-semibold text-smoke-200">{m.sessions}</Td>
              </Tr>
            ))
          )}
        </Table>
      </Panel>
    </div>
  );
}
