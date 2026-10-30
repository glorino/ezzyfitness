import { IndianRupee, Receipt, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";
import { PaymentRowActions, RecordPaymentButton } from "./PaymentActions";
import { FilterSelect, RefreshButton, SearchField } from "@/components/dash/actions";
import { EmptyRow, PageHeader, Panel, StatCard, StatGrid, StatusPill, Table, Td, Tr, Money } from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDate, formatTime, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminPayments({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const method = typeof sp.method === "string" && sp.method !== "all" ? sp.method : null;
  const page = Math.max(1, Number(sp.page) || 1);

  const [rows, totals, plans] = await Promise.all([
    query<{
      id: number;
      amount_ngn: number;
      method: string;
      status: string;
      reference: string | null;
      paid_at: string;
      member_name: string;
      member_id: number;
      plan_name: string | null;
      period_to: string | null;
      recorder: string | null;
    }>(
      `SELECT p.id, p.amount_ngn, p.method, p.status, p.reference, p.paid_at::text AS paid_at,
              u.full_name AS member_name, u.id AS member_id, pl.name AS plan_name,
              p.period_to::text AS period_to, r.full_name AS recorder
         FROM payments p
         JOIN users u ON u.id = p.member_id
         LEFT JOIN plans pl ON pl.id = p.plan_id
         LEFT JOIN users r ON r.id = p.recorded_by
        WHERE ($1 = '' OR u.full_name ILIKE '%' || $1 || '%'
                       OR u.email ILIKE '%' || $1 || '%'
                       OR p.reference ILIKE '%' || $1 || '%'
                       OR EXISTS (SELECT 1 FROM members m
                                   WHERE m.user_id = u.id AND m.membership_no ILIKE '%' || $1 || '%'))
          AND ($2::text IS NULL OR p.method = $2)
        ORDER BY p.paid_at DESC
        LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
      [q, method]
    ),
    query<{
      today: number;
      month: number;
      pending: number;
      refunded: number;
      by_method: string;
    }>(
      `SELECT
         COALESCE(SUM(amount_ngn) FILTER (WHERE status = 'paid' AND paid_at::date = CURRENT_DATE), 0)::int AS today,
         COALESCE(SUM(amount_ngn) FILTER (WHERE status = 'paid' AND paid_at >= date_trunc('month', CURRENT_DATE)), 0)::int AS month,
         COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
         COALESCE(SUM(amount_ngn) FILTER (WHERE status = 'refunded'), 0)::int AS refunded,
         COALESCE(jsonb_object_agg(method, total) FILTER (WHERE total IS NOT NULL), '{}'::jsonb)::text AS by_method
       FROM (
         SELECT amount_ngn, method, status, paid_at,
                SUM(amount_ngn) FILTER (WHERE status = 'paid') OVER (PARTITION BY method) AS total
           FROM payments WHERE paid_at >= date_trunc('month', CURRENT_DATE)
       ) x`
    ),
    query<{ id: number; name: string; price_ngn: number; duration_days: number }>(
      `SELECT id, name, price_ngn, duration_days FROM plans WHERE is_active ORDER BY sort_order`
    ),
  ]);

  const t = totals[0];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Management"
        title="Payments & revenue"
        subtitle="Every naira recorded at the desk."
        action={
          <>
            <RefreshButton />
            <RecordPaymentButton plans={plans} />
          </>
        }
      />

      <StatGrid>
        <StatCard label="Collected today" value={`₦${(t?.today ?? 0).toLocaleString("en-NG")}`} icon={<IndianRupee className="h-5 w-5" />} tone="volt" />
        <StatCard label="This month" value={`₦${(t?.month ?? 0).toLocaleString("en-NG")}`} icon={<TrendingUp className="h-5 w-5" />} tone="cyan" />
        <StatCard label="Pending" value={t?.pending ?? 0} hint="Awaiting confirmation" icon={<Receipt className="h-5 w-5" />} tone="neutral" />
        <StatCard label="Refunded" value={`₦${(t?.refunded ?? 0).toLocaleString("en-NG")}`} hint="This month" icon={<IndianRupee className="h-5 w-5" />} tone="ember" />
      </StatGrid>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField placeholder="Search member or reference…" />
        <FilterSelect
          param="method"
          ariaLabel="Filter by payment method"
          options={[
            { value: "all", label: "All methods" },
            { value: "cash", label: "Cash" },
            { value: "transfer", label: "Bank transfer" },
            { value: "pos", label: "POS" },
            { value: "card", label: "Card" },
            { value: "other", label: "Other" },
          ]}
        />
      </div>

      <Panel pad={false}>
        <Table head={["Member", "Amount", "Plan", "Method", "Reference", "Recorded", ""]}>
          {rows.length === 0 ? (
            <EmptyRow title="No payments found" hint="Record the first payment to see it here." icon={Receipt} colSpan={7} />
          ) : (
            rows.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <p className="font-semibold text-smoke-100">{p.member_name}</p>
                  {p.recorder && <p className="text-xs text-smoke-600">by {p.recorder}</p>}
                </Td>
                <Td><Money value={p.amount_ngn} /></Td>
                <Td>
                  <p className="text-sm text-smoke-300">{p.plan_name ?? "One-off"}</p>
                  {p.period_to && <p className="text-xs text-smoke-600">valid to {formatDate(p.period_to)}</p>}
                </Td>
                <Td className="capitalize">{p.method}</Td>
                <Td className="font-mono text-xs">{p.reference ?? "—"}</Td>
                <Td>
                  <p className="text-sm text-smoke-300">{formatDate(p.paid_at)} {formatTime(p.paid_at.slice(11, 16))}</p>
                  <p className="text-xs text-smoke-600">{relativeTime(p.paid_at)}</p>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2.5">
                    <StatusPill value={p.status} />
                    <PaymentRowActions payment={{ id: p.id, status: p.status, member_name: p.member_name }} />
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </Table>
      </Panel>
    </div>
  );
}
