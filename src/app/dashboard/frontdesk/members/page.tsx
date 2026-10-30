import { UserPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { MemberRowActions, RegisterTrigger, type MemberRow } from "../../admin/members/MemberRowActions";
import { FilterSelect, RefreshButton, SearchField } from "@/components/dash/actions";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyRow, PageHeader, Panel, StatusPill, Table, Td, Tr } from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { daysLeft, formatDate, cn } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function FrontdeskMembers({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "frontdesk") redirect("/login");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const status = typeof sp.status === "string" && sp.status !== "all" ? sp.status : null;
  const page = Math.max(1, Number(sp.page) || 1);

  const [rows, counts, plans] = await Promise.all([
    query<MemberRow & { checked_in_today: boolean }>(
      `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_media_id,
              m.membership_no, m.status, m.expires_at::text AS expires_at,
              m.joined_at::text AS joined_at, m.goals, m.gender,
              m.date_of_birth::text AS date_of_birth, m.emergency_name, m.emergency_phone,
              m.notes, m.plan_id, p.name AS plan_name,
              (SELECT COUNT(*) FROM check_ins c2 WHERE c2.member_id = u.id
                 AND c2.created_at >= CURRENT_DATE - interval '30 days')::int AS checkins_30d,
              EXISTS (SELECT 1 FROM check_ins c
                       WHERE c.member_id = u.id AND c.created_at::date = CURRENT_DATE) AS checked_in_today
         FROM members m
         JOIN users u ON u.id = m.user_id
         LEFT JOIN plans p ON p.id = m.plan_id
        WHERE ($1 = '' OR u.full_name ILIKE '%' || $1 || '%'
                       OR u.email ILIKE '%' || $1 || '%'
                       OR u.phone ILIKE '%' || $1 || '%'
                       OR m.membership_no ILIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR m.status = $2)
        ORDER BY u.full_name
        LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
      [q, status]
    ),
    query<{ status: string; n: number }>(`SELECT status, COUNT(*)::int AS n FROM members GROUP BY status`),
    query<{ id: number; name: string; price_ngn: number; duration_days: number }>(
      `SELECT id, name, price_ngn, duration_days FROM plans WHERE is_active ORDER BY sort_order`
    ),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n]));
  const total = counts.reduce((a, c) => a + c.n, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Front desk"
        title="Member registry"
        subtitle={`${total} members · ${byStatus.active ?? 0} active`}
        action={
          <>
            <RefreshButton />
            <RegisterTrigger plans={plans} />
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField placeholder="Name, phone, email or member no…" />
        <FilterSelect
          param="status"
          ariaLabel="Filter by status"
          options={[
            { value: "all", label: "All" },
            { value: "active", label: `Active (${byStatus.active ?? 0})` },
            { value: "expired", label: `Expired (${byStatus.expired ?? 0})` },
            { value: "frozen", label: `Frozen (${byStatus.frozen ?? 0})` },
          ]}
        />
      </div>

      <Panel pad={false}>
        <Table head={["Member", "Plan", "Status", "Expires", "Today", ""]}>
          {rows.length === 0 ? (
            <EmptyRow
              title={q ? `No matches for “${q}”` : "No members yet"}
              hint="Register a walk-in to get started."
              icon={UserPlus}
              colSpan={6}
            />
          ) : (
            rows.map((m) => {
              const left = daysLeft(m.expires_at);
              return (
                <Tr key={m.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={m.full_name} mediaId={m.avatar_media_id} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-smoke-100">{m.full_name}</p>
                        <p className="truncate text-xs text-smoke-500">
                          {m.membership_no} · {m.phone || m.email}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-sm text-smoke-300">{m.plan_name ?? "Walk-in"}</Td>
                  <Td><StatusPill value={m.status} /></Td>
                  <Td>
                    <p className="text-sm text-smoke-300">{formatDate(m.expires_at)}</p>
                    {left !== null && m.status === "active" && (
                      <p className={cn("text-xs font-semibold", left <= 3 ? "text-ember" : "text-smoke-600")}>
                        {left <= 0 ? "today" : `${left}d left`}
                      </p>
                    )}
                  </Td>
                  <Td>
                    {m.checked_in_today ? (
                      <span className="rounded-full border border-volt-300/30 bg-volt-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-volt-300">
                        in
                      </span>
                    ) : (
                      <span className="text-xs text-smoke-600">—</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <MemberRowActions member={m} plans={plans} />
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
