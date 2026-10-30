import { Mail, Phone, UserPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { MemberRowActions, RegisterTrigger } from "./MemberRowActions";
import { FilterSelect, RefreshButton, SearchField } from "@/components/dash/actions";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyRow, PageHeader, Panel, StatusPill, Table, Td, Tr } from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { daysLeft, formatDate, cn } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminMembers({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const status = typeof sp.status === "string" && sp.status !== "all" ? sp.status : null;
  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, counts, plans] = await Promise.all([
    query<{
      id: number;
      full_name: string;
      email: string;
      phone: string | null;
      avatar_media_id: number | null;
      membership_no: string;
      status: string;
      expires_at: string | null;
      joined_at: string;
      plan_name: string | null;
      goals: string | null;
      gender: string | null;
      date_of_birth: string | null;
      emergency_name: string | null;
      emergency_phone: string | null;
      notes: string | null;
      plan_id: number | null;
      checkins_30d: number;
    }>(
      `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_media_id,
              m.membership_no, m.status, m.expires_at::text AS expires_at,
              m.joined_at::text AS joined_at, m.goals, m.gender,
              m.date_of_birth::text AS date_of_birth, m.emergency_name, m.emergency_phone,
              m.notes, m.plan_id, p.name AS plan_name,
              (SELECT COUNT(*) FROM check_ins c WHERE c.member_id = u.id
                 AND c.created_at >= CURRENT_DATE - interval '30 days')::int AS checkins_30d
         FROM members m
         JOIN users u ON u.id = m.user_id
         LEFT JOIN plans p ON p.id = m.plan_id
        WHERE ($1 = '' OR u.full_name ILIKE '%' || $1 || '%'
                       OR u.email ILIKE '%' || $1 || '%'
                       OR u.phone ILIKE '%' || $1 || '%'
                       OR m.membership_no ILIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR m.status = $2)
        ORDER BY m.status = 'active' DESC, u.full_name
        LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
      [q, status]
    ),
    query<{ status: string; n: number }>(
      `SELECT status, COUNT(*)::int AS n FROM members GROUP BY status`
    ),
    query<{ id: number; name: string; price_ngn: number; duration_days: number }>(
      `SELECT id, name, price_ngn, duration_days FROM plans WHERE is_active ORDER BY sort_order`
    ),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n]));
  const total = counts.reduce((a, c) => a + c.n, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Management"
        title="Members"
        subtitle={`${total} registered · ${byStatus.active ?? 0} active · ${byStatus.expired ?? 0} expired`}
        action={
          <>
            <RefreshButton />
            <RegisterTrigger plans={plans} />
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField placeholder="Search name, email, phone or member no…" />
        <FilterSelect
          param="status"
          ariaLabel="Filter by status"
          options={[
            { value: "all", label: `All statuses (${total})` },
            { value: "active", label: `Active (${byStatus.active ?? 0})` },
            { value: "expired", label: `Expired (${byStatus.expired ?? 0})` },
            { value: "frozen", label: `Frozen (${byStatus.frozen ?? 0})` },
            { value: "inactive", label: `Inactive (${byStatus.inactive ?? 0})` },
          ]}
        />
      </div>

      <Panel pad={false}>
        <Table head={["Member", "Plan", "Status", "Expires", "30-day visits", ""]}>
          {rows.length === 0 ? (
            <EmptyRow
              title={q ? `No members match “${q}”` : "No members yet"}
              hint={q ? "Try a different spelling or clear the filters." : "Register the first member to get started."}
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
                        <p className="flex items-center gap-1.5 truncate text-xs text-smoke-500">
                          <Mail className="h-3 w-3 shrink-0" /> {m.email}
                        </p>
                        {m.phone && (
                          <p className="flex items-center gap-1.5 truncate text-xs text-smoke-500">
                            <Phone className="h-3 w-3 shrink-0" /> {m.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <p className="font-medium text-smoke-200">{m.plan_name ?? "Walk-in"}</p>
                    <p className="text-xs text-smoke-600">{m.membership_no}</p>
                  </Td>
                  <Td><StatusPill value={m.status} /></Td>
                  <Td>
                    <p className="text-sm text-smoke-300">{formatDate(m.expires_at)}</p>
                    {left !== null && m.status === "active" && (
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          left <= 3 ? "text-ember" : left <= 14 ? "text-amber-300" : "text-smoke-600"
                        )}
                      >
                        {left <= 0 ? "expires today" : `${left} days left`}
                      </p>
                    )}
                  </Td>
                  <Td>
                    <span className="font-semibold text-smoke-200">{m.checkins_30d}</span>
                    <span className="text-xs text-smoke-600"> visits</span>
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

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 && (
            <a href={`?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="btn-ghost btn-sm">
              ← Previous
            </a>
          )}
          <span className="text-xs text-smoke-500">
            Page {page} · {total} members
          </span>
          {rows.length === PAGE_SIZE && (
            <a href={`?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="btn-ghost btn-sm">
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
