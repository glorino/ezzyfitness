import { ClipboardCheck, ScanLine } from "lucide-react";
import { redirect } from "next/navigation";
import { CheckinButton } from "../CheckinButton";
import { RefreshButton } from "@/components/dash/actions";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyRow, PageHeader, Panel, StatCard, StatGrid, Table, Td, Tr } from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDate, formatTime, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FrontdeskCheckins() {
  const user = await getCurrentUser();
  if (!user || user.role !== "frontdesk") redirect("/login");

  const [today, week, rows] = await Promise.all([
    query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM check_ins WHERE created_at::date = CURRENT_DATE`),
    query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM check_ins
        WHERE created_at >= CURRENT_DATE - 6 AND created_at::date < CURRENT_DATE`
    ),
    query<{
      id: number;
      created_at: string;
      method: string;
      note: string | null;
      full_name: string;
      avatar_media_id: number | null;
      membership_no: string;
      status: string;
    }>(
      `SELECT c.id, c.created_at::text AS created_at, c.method, c.note,
              u.full_name, u.avatar_media_id, m.membership_no, m.status
         FROM check_ins c
         JOIN users u ON u.id = c.member_id
         LEFT JOIN members m ON m.user_id = u.id
        ORDER BY c.created_at DESC
        LIMIT 60`
    ),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Front desk"
        title="Check-in desk"
        subtitle="Every turnstile moment, logged."
        action={
          <>
            <RefreshButton />
            <CheckinButton />
          </>
        }
      />

      <StatGrid>
        <StatCard label="Today" value={today[0]?.n ?? 0} hint={formatDate(new Date(), { weekday: "long" })} icon={<ScanLine className="h-5 w-5" />} tone="volt" />
        <StatCard label="Yesterday & before" value={week[0]?.n ?? 0} hint="Previous 6 days" icon={<ClipboardCheck className="h-5 w-5" />} tone="cyan" />
        <StatCard label="Log size" value={rows.length} hint="Showing latest 60" icon={<ClipboardCheck className="h-5 w-5" />} tone="neutral" />
      </StatGrid>

      <Panel pad={false}>
        <Table head={["Member", "Method", "Note", "When"]}>
          {rows.length === 0 ? (
            <EmptyRow title="No check-ins recorded" hint="Open the check-in desk to log arrivals." icon={ScanLine} colSpan={4} />
          ) : (
            rows.map((c) => {
              const isToday = c.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10);
              return (
                <Tr key={c.id} className={isToday ? "bg-volt-300/[0.03]" : undefined}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.full_name} mediaId={c.avatar_media_id} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-smoke-100">{c.full_name}</p>
                        <p className="truncate text-xs text-smoke-500">
                          {c.membership_no}
                          {c.status !== "active" && ` · ${c.status}`}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="capitalize text-xs">{c.method}</Td>
                  <Td className="max-w-[220px] truncate text-xs text-smoke-500">{c.note ?? "—"}</Td>
                  <Td>
                    <p className="text-sm text-smoke-300">
                      {isToday ? formatTime(c.created_at.slice(11, 16)) : formatDate(c.created_at)}
                    </p>
                    <p className="text-xs text-smoke-600">{relativeTime(c.created_at)}</p>
                  </Td>
                </Tr>
              );
            })
          )}
        </Table>
      </Panel>
    </div>
  );
}
