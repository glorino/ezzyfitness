import {
  CalendarCheck,
  CreditCard,
  Dumbbell,
  MapPin,
  Phone,
  ScanLine,
  TrendingUp,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AvatarCard } from "@/components/dash/AvatarCard";
import { FlutterwavePayButton } from "@/components/dash/FlutterwaveWidget";
import { PasswordForm } from "@/components/dash/StaffForms";
import { Avatar } from "@/components/ui/Avatar";
import {
  EmptyRow,
  MetaRow,
  PageHeader,
  Panel,
  ProgressBar,
  StatCard,
  StatGrid,
  StatusPill,
  Table,
  Td,
  Tr,
} from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { daysLeft, formatDate, naira, dayName, formatTime } from "@/lib/format";
import { CountdownTimer } from "@/components/dash/CountdownTimer";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function MemberPortal() {
  const user = await getCurrentUser();
  if (!user || user.role !== "member") redirect("/login");

  const [membership, plan, upcoming, history, checkins] = await Promise.all([
    one<{
      membership_no: string;
      status: string;
      joined_at: string;
      expires_at: string | null;
      goals: string | null;
      gender: string | null;
      emergency_name: string | null;
      emergency_phone: string | null;
      plan_name: string | null;
    }>(
      `SELECT m.membership_no, m.status, m.joined_at::text AS joined_at,
              m.expires_at::text AS expires_at, m.goals, m.gender,
              m.emergency_name, m.emergency_phone, p.name AS plan_name
         FROM members m LEFT JOIN plans p ON p.id = m.plan_id
        WHERE m.user_id = $1`,
      [user.id]
    ),
    one<{ price_ngn: number; duration_days: number; features: string[] }>(
      `SELECT p.price_ngn, p.duration_days, p.features
         FROM members m JOIN plans p ON p.id = m.plan_id
        WHERE m.user_id = $1`,
      [user.id]
    ),
    query<{
      id: number;
      name: string;
      category: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      location: string;
      intensity: string;
      trainer_name: string | null;
    }>(
      `SELECT c.id, c.name, c.category, c.day_of_week,
              c.start_time::text AS start_time, c.end_time::text AS end_time,
              c.location, c.intensity, u.full_name AS trainer_name
         FROM classes c LEFT JOIN users u ON u.id = c.trainer_id
        WHERE c.is_active
        ORDER BY (c.day_of_week + 6 - EXTRACT(DOW FROM CURRENT_DATE)) % 7, c.start_time
        LIMIT 5`,
      []
    ),
    query(
      `SELECT p.amount_ngn, p.method, p.paid_at::text AS paid_at, pl.name AS plan_name,
              p.period_from::text AS period_from, p.period_to::text AS period_to
         FROM payments p LEFT JOIN plans pl ON pl.id = p.plan_id
        WHERE p.member_id = $1 AND p.status = 'paid'
        ORDER BY p.paid_at DESC
        LIMIT 6`,
      [user.id]
    ),
    query<{ n: number; this_month: number }>(
      `SELECT COUNT(*)::int AS n,
              COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE))::int AS this_month
         FROM check_ins WHERE member_id = $1`,
      [user.id]
    ),
  ]);

  const left = daysLeft(membership?.expires_at ?? null);
  const visits = checkins[0];
  const todayIdx = new Date().getDay();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Member portal"
        title={`Hey, ${user.full_name.split(" ")[0]} 👊`}
        subtitle={
          membership
            ? `Member ${membership.membership_no} · joined ${formatDate(membership.joined_at)}`
            : "Welcome to Ezzy Fitness."
        }
        action={
          <a href="#pay" className="btn-volt btn-sm">
            <CreditCard className="h-3.5 w-3.5" />
            {membership?.status === "active" ? "Renew membership" : "Choose a plan"}
          </a>
        }
      />

      {/* --------------------------------------------- membership status */}
      <div className="surface-raised relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-volt-300/10 via-transparent to-cyanx/6" />
        <div className="relative grid gap-6 p-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl text-smoke-100">{membership?.plan_name ?? "No active plan"}</h2>
              {membership && <StatusPill value={membership.status} />}
            </div>

            {membership?.expires_at ? (
              <>
                <p className="mt-2 text-sm text-smoke-400">
                  Valid until <span className="font-semibold text-smoke-200">{formatDate(membership.expires_at)}</span>
                  <CountdownTimer expiresAt={membership.expires_at} />
                </p>
                <div className="mt-4 max-w-md">
                  <ProgressBar
                    value={Math.max(0, Math.min(30, 30 - (left ?? 0)))}
                    max={30}
                    tone={(left ?? 0) <= 5 ? "ember" : "volt"}
                  />
                  <p className="mt-1.5 text-xs text-smoke-600">30-day cycle</p>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-smoke-400">
                Pick a plan to unlock full floor access and group classes.
              </p>
            )}

            <div className="mt-5">
              <MetaRow
                items={[
                  { icon: <UserRound className="h-3.5 w-3.5" />, label: "Membership no", value: membership?.membership_no ?? "—" },
                  { icon: <CalendarCheck className="h-3.5 w-3.5" />, label: "Joined", value: formatDate(membership?.joined_at) },
                  { icon: <ScanLine className="h-3.5 w-3.5" />, label: "Total visits", value: `${visits?.n ?? 0} (${visits?.this_month ?? 0} this month)` },
                  { icon: <MapPin className="h-3.5 w-3.5" />, label: "Home gym", value: `${SITE.address.line1}, ${SITE.address.line3}` },
                ]}
              />
            </div>
          </div>

          {/* plan perks */}
          <div className="rounded-2xl border border-white/10 bg-ink-950/50 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider2 text-volt-300">Your plan includes</p>
            {plan ? (
              <>
                <ul className="mt-3 space-y-2">
                  {(plan.features ?? []).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-smoke-300">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-volt-300" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-white/8 pt-3 text-xs text-smoke-500">
                  {naira(plan.price_ngn)} / {plan.duration_days} days
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-smoke-500">
                No plan attached yet — visit the front desk or renew online.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- stats */}
      <StatGrid>
        <StatCard label="Days remaining" value={left ?? "—"} hint={membership?.expires_at ? `to ${formatDate(membership.expires_at)}` : "no expiry set"} icon={<TrendingUp className="h-5 w-5" />} tone={(left ?? 99) <= 5 ? "ember" : "volt"} />
        <StatCard label="Lifetime visits" value={visits?.n ?? 0} hint="Gym check-ins" icon={<ScanLine className="h-5 w-5" />} tone="cyan" />
        <StatCard label="This month" value={visits?.this_month ?? 0} hint="Visits in current month" icon={<CalendarCheck className="h-5 w-5" />} tone="volt" />
        <StatCard label="Classes this week" value={upcoming.length} hint="Open to all members" icon={<Dumbbell className="h-5 w-5" />} tone="neutral" />
      </StatGrid>

      {membership?.status === "active" && (
        <div id="pay" className="scroll-mt-24">
          <FlutterwavePayButton
            memberId={user.id}
            memberName={user.full_name}
            amount={plan?.price_ngn ?? 15000}
            planName={plan?.duration_days ? `${plan.duration_days}-day Plan` : "Quarterly Plan"}
            email={user.email}
            phone={user.phone ?? undefined}
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* ------------------------------------------------- schedule */}
        <Panel
          title="Class schedule"
          subtitle="Drop in — first come, first served"
          className="xl:col-span-2"
          pad={false}
        >
          {upcoming.length === 0 ? (
            <EmptyRow title="No classes scheduled" hint="Check back soon." icon={CalendarCheck} colSpan={1} />
          ) : (
            <Table head={["Class", "Day", "Time", "Coach", "Spot"]}>
              {upcoming.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-smoke-100">{c.name}</p>
                      <span className="rounded-full border border-white/12 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-smoke-400">
                        {c.intensity}
                      </span>
                    </div>
                    <p className="text-xs text-smoke-500">{c.category}</p>
                  </Td>
                  <Td className="text-sm">{dayName(c.day_of_week)}</Td>
                  <Td className="text-sm">{formatTime(c.start_time)}–{formatTime(c.end_time)}</Td>
                  <Td className="text-sm text-smoke-300">{c.trainer_name ?? "TBA"}</Td>
                  <Td className="text-xs text-smoke-500">{c.location}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </Panel>

        {/* ------------------------------------------------ profile */}
        <div className="space-y-6">
          <AvatarCard fullName={user.full_name} mediaId={user.avatar_media_id} label="My photo" />
          <Panel title="Emergency contact">
            {membership?.emergency_name ? (
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-smoke-500">Name</dt>
                  <dd className="text-smoke-200">{membership.emergency_name}</dd>
                </div>
                {membership.emergency_phone && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-smoke-500">Phone</dt>
                    <dd className="flex items-center gap-1.5 text-smoke-200">
                      <Phone className="h-3.5 w-3.5 text-volt-300" />
                      {membership.emergency_phone}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-smoke-500">
                Not set — ask the front desk to add one for your safety.
              </p>
            )}
            {membership?.goals && (
              <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-smoke-500">Your goal</p>
                <p className="mt-1 text-sm text-smoke-300">{membership.goals}</p>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* ----------------------------------------------- payment history */}
      <Panel title="Payment history" subtitle="Your last 6 payments" pad={false}>
        <Table head={["Plan", "Amount", "Method", "Period", "Paid"]}>
          {history.length === 0 ? (
            <EmptyRow title="No payments yet" hint="Renew at the front desk or via /membership." icon={CreditCard} colSpan={5} />
          ) : (
            history.map((p, i) => (
              <Tr key={i}>
                <Td className="font-semibold text-smoke-100">{p.plan_name ?? "One-off"}</Td>
                <Td>{naira(p.amount_ngn)}</Td>
                <Td className="capitalize">{p.method}</Td>
                <Td className="text-xs text-smoke-400">
                  {p.period_from && p.period_to
                    ? `${formatDate(p.period_from)} → ${formatDate(p.period_to)}`
                    : "—"}
                </Td>
                <Td className="text-xs">{formatDate(p.paid_at)}</Td>
              </Tr>
            ))
          )}
        </Table>
      </Panel>

      <Panel title="Account security">
        <PasswordForm userId={user.id} />
      </Panel>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
        <p className="text-sm text-smoke-400">
          Questions? Call the desk at{" "}
          <a href={SITE.phoneHref} className="font-semibold text-volt-300 hover:underline">
            {SITE.phone}
          </a>{" "}
          or visit us at {SITE.address.line1}.
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <Avatar name={user.full_name} mediaId={user.avatar_media_id} size="xs" />
          <span className="text-xs text-smoke-500">Signed in as {user.email}</span>
        </div>
      </div>
    </div>
  );
}
