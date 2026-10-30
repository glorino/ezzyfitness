import { IndianRupee, Receipt } from "lucide-react";
import { redirect } from "next/navigation";
import { RecordPaymentButton } from "../../admin/payments/PaymentActions";
import { FilterSelect, RefreshButton, SearchField } from "@/components/dash/actions";
import { EmptyRow, Money, PageHeader, Panel, StatCard, StatGrid, StatusPill, Table, Td, Tr } from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDate, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FrontdeskPayments({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "frontdesk") redirect("/login");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const method = typeof sp.method === "string" && sp.method !== "all" ? sp.method : null;

  const [rows, totals, plans] = await Promise.all([
    query<{
      id: number;
      amount_ngn: number;
      method: string;
      status: string;
      reference: string | null;
      paid_at: string;
      member_name: string;
      plan_name: string | null;
    }>(
      `SELECT p.id, p.amount_ngn, p.method, p.status, p.reference, p.paid_at::text AS paid_at,
              u.full_name AS member_name, pl.name AS plan_name
         FROM payments p
         JOIN users u ON u.id = p.member_id
         LEFT JOIN plans pl ON pl.id = p.plan_id
        WHERE ($1 = '' OR u.full_name ILIKE '%' || $1 || '%'
                       OR u.phone ILIKE '%' || $1 || '%'
                       OR p.reference ILIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR p.method = $2)
        ORDER BY p.paid_at DESC
        LIMIT 40`,
      [q, method]
    ),
    query<{ today: number; week: number; month: number }>(
      `SELECT
         COALESCE(SUM(amount_ngn) FILTER (WHERE status = 'paid' AND paid_at::date = CURRENT_DATE), 0)::int AS today,
         COALESCE(SUM(amount_ngn) FILTER (WHERE status = 'paid' AND paid_at >= CURRENT_DATE - 6), 0)::int AS week,
         COALESCE(SUM(amount_ngn) FILTER (WHERE status = 'paid' AND paid_at >= date_trunc('month', CURRENT_DATE)), 0)::int AS month`
    ),
    query<{ id: number; name: string; price_ngn: number; duration_days: number }>(
      `SELECT id, name, price_ngn, duration_days FROM plans WHERE is_active ORDER BY sort_order`
    ),
  ]);

  const t = totals[0];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Front desk"
        title="Collect payments"
        subtitle="Cash, transfer and POS — renewals apply instantly."
        action={
          <>
            <RefreshButton />
            <RecordPaymentButton plans={plans} label="New payment" />
          </>
        }
      />

      <StatGrid>
        <StatCard label="Today" value={`₦${(t?.today ?? 0).toLocaleString("en-NG")}`} icon={<IndianRupee className="h-5 w-5" />} tone="volt" />
        <StatCard label="Last 7 days" value={`₦${(t?.week ?? 0).toLocaleString("en-NG")}`} icon={<Receipt className="h-5 w-5" />} tone="cyan" />
        <StatCard label="This month" value={`₦${(t?.month ?? 0).toLocaleString("en-NG")}`} icon={<IndianRupee className="h-5 w-5" />} tone="neutral" />
      </StatGrid>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField placeholder="Member, phone or reference…" />
        <FilterSelect
          param="method"
          ariaLabel="Filter by method"
          options={[
            { value: "all", label: "All methods" },
            { value: "cash", label: "Cash" },
            { value: "transfer", label: "Transfer" },
            { value: "pos", label: "POS" },
            { value: "card", label: "Card" },
          ]}
        />
      </div>

      <Panel pad={false}>
        <Table head={["Member", "Amount", "Plan", "Method", "Reference", "When", "Status"]}>
          {rows.length === 0 ? (
            <EmptyRow title="No payments recorded" hint="Collect the first one." icon={Receipt} colSpan={7} />
          ) : (
            rows.map((p) => (
              <Tr key={p.id}>
                <Td className="font-semibold text-smoke-100">{p.member_name}</Td>
                <Td><Money value={p.amount_ngn} /></Td>
                <Td className="text-sm text-smoke-300">{p.plan_name ?? "One-off"}</Td>
                <Td className="capitalize">{p.method}</Td>
                <Td className="font-mono text-xs">{p.reference ?? "—"}</Td>
                <Td className="text-xs">{formatDate(p.paid_at)} · {relativeTime(p.paid_at)}</Td>
                <Td><StatusPill value={p.status} /></Td>
              </Tr>
            ))
          )}
        </Table>
      </Panel>
    </div>
  );
}
