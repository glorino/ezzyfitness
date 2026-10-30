import { redirect } from "next/navigation";
import { InboxList, type Message } from "@/components/dash/InboxList";
import { FilterSelect, RefreshButton, SearchField } from "@/components/dash/actions";
import { PageHeader, Panel } from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminInbox({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const status = typeof sp.status === "string" && sp.status !== "all" ? sp.status : null;

  const messages = await query<Message>(
    `SELECT id, name, email, phone, subject, message, status, created_at::text AS created_at
       FROM contact_messages
      WHERE ($1 = '' OR name ILIKE '%' || $1 || '%'
                     OR email ILIKE '%' || $1 || '%'
                     OR subject ILIKE '%' || $1 || '%'
                     OR message ILIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR status = $2)
      ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'read' THEN 1 ELSE 2 END,
               created_at DESC
      LIMIT 100`,
    [q, status]
  );

  const unread = messages.filter((m) => m.status === "new").length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Management"
        title="Contact inbox"
        subtitle={`${messages.length} message${messages.length === 1 ? "" : "s"} · ${unread} new`}
        action={<RefreshButton />}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField placeholder="Search sender, subject or text…" />
        <FilterSelect
          param="status"
          ariaLabel="Filter by status"
          options={[
            { value: "all", label: "All messages" },
            { value: "new", label: "New" },
            { value: "read", label: "Read" },
            { value: "replied", label: "Replied" },
          ]}
        />
      </div>

      <Panel pad={false}>
        <InboxList messages={messages} canDelete />
      </Panel>

      <p className="text-center text-xs text-smoke-600">
        Messages come straight from the <span className="text-smoke-400">/contact</span> form on the public site.
      </p>
    </div>
  );
}
