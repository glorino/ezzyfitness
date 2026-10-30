import { Mail, Phone, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { RefreshButton, SearchField } from "@/components/dash/actions";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyRow, PageHeader, Panel, StatusPill, Table, Td, Tr } from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { daysLeft, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TrainerMembers({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "trainer") redirect("/login");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();

  const members = await query<{
    id: number;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_media_id: number | null;
    membership_no: string;
    status: string;
    expires_at: string | null;
    goals: string | null;
    sessions: number;
    last_seen: string | null;
  }>(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_media_id,
            m.membership_no, m.status, m.expires_at::text AS expires_at, m.goals,
            COUNT(*) AS sessions, MAX(ca.session_date)::text AS last_seen
       FROM class_attendance ca
       JOIN classes c ON c.id = ca.class_id
       JOIN users u ON u.id = ca.member_id
       LEFT JOIN members m ON m.user_id = u.id
      WHERE c.trainer_id = $1
        AND ($2 = '' OR u.full_name ILIKE '%' || $2 || '%'
                     OR u.phone ILIKE '%' || $2 || '%'
                     OR m.membership_no ILIKE '%' || $2 || '%')
      GROUP BY u.id, u.full_name, u.email, u.phone, u.avatar_media_id,
               m.membership_no, m.status, m.expires_at, m.goals
      ORDER BY MAX(ca.session_date) DESC
      LIMIT 100`,
    [user.id, q]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Coaching"
        title="Members I train"
        subtitle={`${members.length} member${members.length === 1 ? "" : "s"} have attended your classes`}
        action={<RefreshButton />}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField placeholder="Search by name, phone or member no…" />
      </div>

      <Panel pad={false}>
        <Table head={["Member", "Goals", "Status", "Sessions", "Last seen"]}>
          {members.length === 0 ? (
            <EmptyRow
              title={q ? `No members match “${q}”` : "No members in your classes yet"}
              hint={q ? "Try a different search." : "Members appear here after you mark attendance."}
              icon={Users}
              colSpan={5}
            />
          ) : (
            members.map((m) => {
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
                  <Td className="max-w-[220px] truncate text-xs text-smoke-400">{m.goals ?? "—"}</Td>
                  <Td>
                    <StatusPill value={m.status} />
                    {left !== null && m.status === "active" && (
                      <p className="mt-1 text-xs text-smoke-600">
                        {left <= 0 ? "expires today" : `${left}d left`}
                      </p>
                    )}
                  </Td>
                  <Td className="font-semibold text-smoke-200">{m.sessions}</Td>
                  <Td className="text-xs">{formatDate(m.last_seen)}</Td>
                </Tr>
              );
            })
          )}
        </Table>
      </Panel>

      <p className="text-center text-xs text-smoke-600">
        This list updates automatically as you mark attendance in your classes.
      </p>
    </div>
  );
}
