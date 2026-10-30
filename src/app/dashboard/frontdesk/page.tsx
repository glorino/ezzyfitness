import { ClipboardCheck, IndianRupee, ScanLine, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckinButton } from "./CheckinButton";
import { RefreshButton } from "@/components/dash/actions";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyRow, PageHeader, Panel, StatCard, StatGrid, Table, Td, Tr } from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDate, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FrontdeskOverview() {
  const user = await getCurrentUser();
  if (!user || user.role !== "frontdesk") redirect("/login");

  const [stats, recentCheckins, expiring] = await Promise.all([
    query<{ checkins_today: number; active_members: number; new_this_week: number; revenue_today: number }>(
      `SELECT
         (SELECT COUNT(*) FROM check_ins WHERE created_at::date = CURRENT_DATE)::int AS checkins_today,
         (SELECT COUNT(*) FROM members WHERE status = 'active'
            AND (expires_at IS NULL OR expires_at >= CURRENT_DATE))::int AS active_members,
         (SELECT COUNT(*) FROM members WHERE joined_at >= CURRENT_DATE - 6)::int AS new_this_week,
         (SELECT COALESCE(SUM(amount_ngn), 0) FROM payments
           WHERE status = 'paid' AND paid_at::date = CURRENT_DATE)::int AS revenue_today`
    ),
    query(
      `SELECT c.id, c.created_at::text AS created_at, c.method, c.note,
              u.id AS member_id, u.full_name, u.avatar_media_id, m.membership_no, m.status
         FROM check_ins c
         JOIN users u ON u.id = c.member_id
         LEFT JOIN members m ON m.user_id = u.id
        ORDER BY c.created_at DESC
        LIMIT 10`
    ),
    query(
      `SELECT u.full_name, u.avatar_media_id, m.membership_no, m.expires_at::text AS expires_at
         FROM members m JOIN users u ON u.id = m.user_id
        WHERE m.status = 'active' AND m.expires_at IS NOT NULL
          AND m.expires_at BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
        ORDER BY m.expires_at LIMIT 5`
    ),
  ]);

  const s = stats[0];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Front desk"
        title={`Good day, ${user.full_name.split(" ")[0]}`}
        subtitle={`${formatDate(new Date(), { weekday: "long", day: "numeric", month: "long" })} · Ezra Mall`}
        action={
          <>
            <RefreshButton />
            <CheckinButton />
            <Link href="/dashboard/frontdesk/members" className="btn-volt btn-sm">
              <UserPlus className="h-3.5 w-3.5" /> New member
            </Link>
          </>
        }
      />

      <StatGrid>
        <StatCard
          label="Checked in today"
          value={s?.checkins_today ?? 0}
          hint="Keep the turnstile spinning"
          icon={<ScanLine className="h-5 w-5" />}
          tone="volt"
        />
        <StatCard
          label="Active members"
          value={s?.active_members ?? 0}
          hint="Eligible to train right now"
          icon={<Users className="h-5 w-5" />}
          tone="cyan"
        />
        <StatCard
          label="Collected today"
          value={`₦${(s?.revenue_today ?? 0).toLocaleString("en-NG")}`}
          hint="Cash, POS & transfers"
          icon={<IndianRupee className="h-5 w-5" />}
          tone="volt"
        />
        <StatCard
          label="New this week"
          value={s?.new_this_week ?? 0}
          hint="Fresh faces on the floor"
          icon={<UserPlus className="h-5 w-5" />}
          tone="neutral"
        />
      </StatGrid>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Live check-ins"
          subtitle="Most recent first"
          className="xl:col-span-2"
          pad={false}
          action={<Link href="/dashboard/frontdesk/checkins" className="text-xs font-semibold text-volt-300 hover:underline">Full log</Link>}
        >
          <Table head={["Member", "Method", "Time", ""]}>
            {recentCheckins.length === 0 ? (
              <EmptyRow title="No check-ins yet today" hint="Use “Check in member” to log the first arrival." icon={ClipboardCheck} colSpan={4} />
            ) : (
              recentCheckins.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.full_name} mediaId={c.avatar_media_id} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-smoke-100">{c.full_name}</p>
                        <p className="truncate text-xs text-smoke-500">{c.membership_no}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="capitalize text-xs">{c.method}</Td>
                  <Td className="text-xs">{relativeTime(c.created_at)}</Td>
                  <Td>
                    {c.status !== "active" && (
                      <span className="rounded-full border border-ember/30 bg-ember/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ember">
                        {c.status}
                      </span>
                    )}
                  </Td>
                </Tr>
              ))
            )}
          </Table>
        </Panel>

        <div className="space-y-6">
          <Panel title="Renewals this week" subtitle="Gentle reminders at the desk">
            {expiring.length === 0 ? (
              <p className="py-4 text-center text-sm text-smoke-500">Nothing expiring in 7 days.</p>
            ) : (
              <ul className="space-y-2">
                {expiring.map((m) => (
                  <li key={m.membership_no} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-smoke-100">{m.full_name}</p>
                      <p className="text-xs text-smoke-500">{formatDate(m.expires_at)}</p>
                    </div>
                    <Link
                      href="/dashboard/frontdesk/payments"
                      className="shrink-0 rounded-lg border border-volt-300/30 bg-volt-300/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-volt-300 transition hover:bg-volt-300/20"
                    >
                      renew
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="rounded-2xl border border-volt-300/25 bg-gradient-to-br from-volt-300/10 to-transparent p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider2 text-volt-300">Desk tips</p>
            <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-smoke-400">
              <li>• Search members by phone number when they forget their name tag.</li>
              <li>• Renewals extend from the later of today or current expiry.</li>
              <li>• New walk-ins: register them first, then check them in.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
