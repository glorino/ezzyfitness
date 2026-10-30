import { CalendarCheck, MapPin, Timer, Users, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import {
  EmptyRow,
  PageHeader,
  Panel,
} from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { dayName, formatTime, formatDate } from "@/lib/format";
import { cn } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MemberClasses() {
  const user = await getCurrentUser();
  if (!user || user.role !== "member") redirect("/login");

  const [classes, myClasses, attendance] = await Promise.all([
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
      trainer_name: string | null;
      enrolled: number;
    }>(
      `SELECT c.id, c.name, c.category, c.day_of_week,
              c.start_time::text AS start_time, c.end_time::text AS end_time,
              c.capacity, c.location, c.intensity, u.full_name AS trainer_name,
              (SELECT COUNT(*) FROM class_attendance ca
                WHERE ca.class_id = c.id AND ca.session_date = CURRENT_DATE
                  AND ca.status IN ('present','late'))::int AS enrolled
         FROM classes c
         LEFT JOIN users u ON u.id = c.trainer_id
        WHERE c.is_active
        ORDER BY (c.day_of_week + 6 - EXTRACT(DOW FROM CURRENT_DATE)) % 7, c.start_time`,
      []
    ).catch(() => []),
    query<{ class_id: number; class_name: string; day_of_week: number; start_time: string; end_time: string; location: string; trainer_name: string | null }>(
      `SELECT DISTINCT c.id AS class_id, c.name AS class_name, c.day_of_week,
              c.start_time::text AS start_time, c.end_time::text AS end_time,
              c.location, u.full_name AS trainer_name
         FROM class_attendance ca
         JOIN classes c ON c.id = ca.class_id
         LEFT JOIN users u ON u.id = c.trainer_id
        WHERE ca.member_id = $1
        ORDER BY c.day_of_week, c.start_time`,
      [user.id]
    ).catch(() => []),
    query<{ session_date: string; class_name: string; status: string }>(
      `SELECT ca.session_date::text AS session_date, c.name AS class_name, ca.status
         FROM class_attendance ca
         JOIN classes c ON c.id = ca.class_id
        WHERE ca.member_id = $1
        ORDER BY ca.session_date DESC
        LIMIT 10`,
      [user.id]
    ).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Member portal"
        title="Class Schedule"
        subtitle="Browse available classes and track your attendance."
        action={
          <Link href="/dashboard/member" className="btn-volt btn-sm">
            <UserRound className="h-3.5 w-3.5" />
            Back to dashboard
          </Link>
        }
      />

      {/* my enrolled classes */}
      <Panel title="My classes" subtitle="Classes you've attended" pad={false}>
        {myClasses.length === 0 ? (
          <EmptyRow
            title="No classes attended yet"
            hint="Join a class below to get started!"
            icon={CalendarCheck}
            colSpan={1}
          />
        ) : (
          <div className="divide-y divide-white/8">
            {myClasses.map((c) => (
              <div key={c.class_id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-semibold text-smoke-100">{c.class_name}</p>
                  <p className="text-xs text-smoke-500">
                    {dayName(c.day_of_week)} · {formatTime(c.start_time)}–{formatTime(c.end_time)} · {c.location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-smoke-300">{c.trainer_name ?? "TBA"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* all classes */}
      <Panel title="All classes" subtitle="Drop in — first come, first served" pad={false}>
        {classes.length === 0 ? (
          <EmptyRow
            title="No classes scheduled"
            hint="Check back soon for the new schedule."
            icon={CalendarCheck}
            colSpan={1}
          />
        ) : (
          <div className="divide-y divide-white/8">
            {classes.map((c) => {
              const todayIdx = new Date().getDay();
              return (
                <div key={c.id} className={cn(
                  "flex items-center justify-between px-4 py-3",
                  c.day_of_week === todayIdx && "bg-volt-300/5"
                )}>
                  <div className="flex items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-smoke-100">{c.name}</p>
                        {c.day_of_week === todayIdx && (
                          <span className="rounded-full border border-volt-300/30 bg-volt-300/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-volt-300">
                            today
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-smoke-500">
                        {c.category} · {dayName(c.day_of_week)} · {formatTime(c.start_time)}–{formatTime(c.end_time)}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-smoke-500 mt-1">
                        <MapPin className="h-3 w-3" /> {c.location}
                        <Users className="h-3 w-3 ml-2" /> {c.enrolled}/{c.capacity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-smoke-300">{c.trainer_name ?? "TBA"}</p>
                    <span className={cn(
                      "mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      c.intensity === "High" ? "border-ember/30 bg-ember/10 text-ember" :
                      c.intensity === "Medium" ? "border-amber-300/30 bg-amber-300/10 text-amber-300" :
                      "border-cyanx/30 bg-cyanx/10 text-cyanx"
                    )}>
                      {c.intensity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* recent attendance */}
      <Panel title="Recent attendance" subtitle="Your last 10 class visits" pad={false}>
        {attendance.length === 0 ? (
          <EmptyRow
            title="No attendance recorded"
            hint="Your attendance will appear here after your first class."
            icon={CalendarCheck}
            colSpan={1}
          />
        ) : (
          <div className="divide-y divide-white/8">
            {attendance.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-semibold text-smoke-100">{a.class_name}</p>
                  <p className="text-xs text-smoke-500">{formatDate(a.session_date)}</p>
                </div>
                <span className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                  a.status === "present" ? "bg-volt-300/12 text-volt-300 border border-volt-300/30" :
                  a.status === "late" ? "bg-amber-400/12 text-amber-300 border border-amber-300/30" :
                  "bg-ember/12 text-ember border border-ember/30"
                )}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
