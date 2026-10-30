import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  ClipboardCheck,
  IndianRupee,
  MessageSquare,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, Panel, StatCard, StatGrid, StatusPill, Table, Td, Tr, EmptyRow, ProgressBar } from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { daysLeft, formatDate, naira, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const [stats, revenue, expiring, recentPayments, activity, inbox] = await Promise.all([
    query<{
      total_members: number;
      active_members: number;
      expired_members: number;
      total_trainers: number;
      checkins_today: number;
      revenue_month: number;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM members)::int AS total_members,
         (SELECT COUNT(*) FROM members WHERE status = 'active' AND (expires_at IS NULL OR expires_at >= CURRENT_DATE))::int AS active_members,
         (SELECT COUNT(*) FROM members WHERE status = 'expired' OR (expires_at IS NOT NULL AND expires_at < CURRENT_DATE))::int AS expired_members,
         (SELECT COUNT(*) FROM trainers t JOIN users u ON u.id = t.user_id WHERE u.status = 'active')::int AS total_trainers,
         (SELECT COUNT(*) FROM check_ins WHERE created_at::date = CURRENT_DATE)::int AS checkins_today,
         (SELECT COALESCE(SUM(amount_ngn), 0) FROM payments
           WHERE status = 'paid' AND paid_at >= date_trunc('month', CURRENT_DATE))::int AS revenue_month`
    ),
    // six-month revenue trend
    query<{ month: string; total: number }>(
      `SELECT to_char(date_trunc('month', d), 'Mon') AS month,
              COALESCE(SUM(p.amount_ngn) FILTER (WHERE p.status = 'paid'), 0)::int AS total
         FROM generate_series(date_trunc('month', CURRENT_DATE) - interval '5 months',
                              date_trunc('month', CURRENT_DATE), interval '1 month') d
         LEFT JOIN payments p ON p.paid_at >= d AND p.paid_at < d + interval '1 month'
        GROUP BY d ORDER BY d`
    ),
    // memberships about to run out
    query(
      `SELECT u.full_name, u.avatar_media_id, m.membership_no, m.expires_at::text AS expires_at, m.status
         FROM members m JOIN users u ON u.id = m.user_id
        WHERE m.status = 'active' AND m.expires_at IS NOT NULL
          AND m.expires_at BETWEEN CURRENT_DATE AND CURRENT_DATE + 14
        ORDER BY m.expires_at LIMIT 6`
    ),
    query(
      `SELECT p.id, p.amount_ngn, p.method, p.paid_at::text AS paid_at, u.full_name
         FROM payments p JOIN users u ON u.id = p.member_id
        ORDER BY p.paid_at DESC LIMIT 7`
    ),
    query<{ action: string; entity: string | null; created_at: string; full_name: string | null }>(
      `SELECT a.action, a.entity, a.created_at::text AS created_at, u.full_name
         FROM activity_log a LEFT JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC LIMIT 8`
    ),
    query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM contact_messages WHERE status = 'new'`
    ),
  ]);

  const s = stats[0];
  const maxRevenue = Math.max(...revenue.map((r) => r.total), 1);
  const target = 1_500_000; // monthly goal for the progress bar
  const monthRevenue = s?.revenue_month ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Management"
        title={`Welcome back, ${user.full_name.split(" ")[0]}`}
        subtitle="Everything happening at Ezra Mall, in real time."
        action={
          <>
            <Link href="/dashboard/admin/members" className="btn-ghost btn-sm">
              <Users className="h-3.5 w-3.5" /> Manage members
            </Link>
            <Link href="/dashboard/admin/payments" className="btn-volt btn-sm">
              <IndianRupee className="h-3.5 w-3.5" /> Record payment
            </Link>
          </>
        }
      />

      {/* ---------------------------------------------------------- stats */}
      <StatGrid>
        <StatCard
          label="Active members"
          value={s?.active_members ?? 0}
          hint={`${s?.expired_members ?? 0} expired · ${s?.total_members ?? 0} total`}
          icon={<Users className="h-5 w-5" />}
          tone="volt"
        />
        <StatCard
          label="Check-ins today"
          value={s?.checkins_today ?? 0}
          hint="Doors opened at 5:30am"
          icon={<ClipboardCheck className="h-5 w-5" />}
          tone="cyan"
        />
        <StatCard
          label="Revenue this month"
          value={naira(monthRevenue)}
          hint={`${Math.round((monthRevenue / target) * 100)}% of ₦1.5M target`}
          icon={<IndianRupee className="h-5 w-5" />}
          tone="volt"
        />
        <StatCard
          label="Coaches on floor"
          value={s?.total_trainers ?? 0}
          hint={`${inbox[0]?.n ?? 0} unread message${inbox[0]?.n === 1 ? "" : "s"}`}
          icon={<Activity className="h-5 w-5" />}
          tone="neutral"
        />
      </StatGrid>

      {/* ------------------------------------------------- revenue + renewals */}
      <div className="grid gap-6 xl:grid-cols-5">
        <Panel
          title="Revenue — last 6 months"
          subtitle="Paid records only"
          className="xl:col-span-3"
          bodyClassName="p-5"
        >
          <div className="flex h-48 items-end gap-2.5 sm:gap-4">
            {revenue.map((r) => (
              <div key={r.month} className="group flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-semibold text-smoke-500 opacity-0 transition group-hover:opacity-100">
                  {naira(r.total)}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-volt-300/30 to-volt-300 transition-all duration-500 group-hover:from-volt-300/50 group-hover:to-volt-200"
                    style={{ height: `${Math.max(4, (r.total / maxRevenue) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-smoke-500">
                  {r.month}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-smoke-400">
                Monthly target
              </span>
              <span className="font-bold text-volt-300">{naira(monthRevenue)} / {naira(target)}</span>
            </div>
            <ProgressBar value={monthRevenue} max={target} />
          </div>
        </Panel>

        <Panel
          title="Renewals due"
          subtitle="Expiring in the next 14 days"
          className="xl:col-span-2"
          action={<Link href="/dashboard/admin/members" className="text-xs font-semibold text-volt-300 hover:underline">All members</Link>}
        >
          {expiring.length === 0 ? (
            <p className="py-6 text-center text-sm text-smoke-500">Nothing expiring soon. Nice.</p>
          ) : (
            <ul className="space-y-2.5">
              {expiring.map((m) => {
                const left = daysLeft(m.expires_at);
                return (
                  <li key={m.membership_no} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-smoke-100">{m.full_name}</p>
                      <p className="text-xs text-smoke-500">{m.membership_no}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        (left ?? 0) <= 3
                          ? "border-ember/30 bg-ember/10 text-ember"
                          : "border-amber-300/30 bg-amber-300/10 text-amber-300"
                      }`}
                    >
                      {left !== null && left <= 0 ? "today" : `${left}d left`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* ---------------------------------------------- payments + activity */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Recent payments"
          action={
            <Link href="/dashboard/admin/payments" className="inline-flex items-center gap-1 text-xs font-semibold text-volt-300 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          <Table head={["Member", "Amount", "Method", "When"]}>
            {recentPayments.length === 0 ? (
              <EmptyRow title="No payments yet" hint="Record the first one." icon={IndianRupee} colSpan={4} />
            ) : (
              recentPayments.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-medium text-smoke-100">{p.full_name}</Td>
                  <Td><span className="font-semibold text-smoke-100">{naira(p.amount_ngn)}</span></Td>
                  <Td className="capitalize">{p.method}</Td>
                  <Td className="text-xs">{relativeTime(p.paid_at)}</Td>
                </Tr>
              ))
            )}
          </Table>
        </Panel>

        <Panel
          title="Activity log"
          subtitle="Who did what, and when"
          action={
            <Link href="/dashboard/admin/staff" className="inline-flex items-center gap-1 text-xs font-semibold text-volt-300 hover:underline">
              Staff <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-smoke-500">No recorded activity yet.</p>
          ) : (
            <ul className="space-y-1">
              {activity.map((a, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg px-2 py-2 transition hover:bg-white/[0.03]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-volt-300/70" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-smoke-300">
                      <span className="font-semibold text-smoke-100">{a.full_name ?? "System"}</span>{" "}
                      {a.action.toLowerCase()}
                    </p>
                    <p className="text-xs text-smoke-600">{relativeTime(a.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ------------------------------------------------------- quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Register a walk-in member", href: "/dashboard/admin/members", icon: UserPlus },
          { label: "Build the class schedule", href: "/dashboard/admin/classes", icon: CalendarClock },
          { label: "Answer the inbox", href: "/dashboard/admin/inbox", icon: MessageSquare },
        ].map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="surface-raised group flex items-center gap-3.5 p-4 transition-colors hover:border-volt-300/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-volt-300/25 bg-volt-300/10 text-volt-300 transition group-hover:scale-105">
              <q.icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-smoke-200 group-hover:text-smoke-100">{q.label}</span>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-smoke-600 transition group-hover:text-volt-300" />
          </Link>
        ))}
      </div>

      <p className="text-center text-xs text-smoke-600">
        Data refreshed {formatDate(new Date())} · Ezzy Fitness admin console
      </p>
    </div>
  );
}
