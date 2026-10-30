import { Settings, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { StaffRowActions, StaffAvatar, type StaffRow } from "./StaffActions";
import { RefreshButton } from "@/components/dash/actions";
import { PageHeader, Panel, StatusPill, Table, Td, Tr, EmptyRow } from "@/components/dash/ui";
import { AddStaffButton } from "./AddStaffButton";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { relativeTime, roleTone } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminStaff() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const staff = await query<StaffRow>(
    `SELECT id, full_name, email, phone, role, status, avatar_media_id,
            last_login_at::text AS last_login_at, created_at::text AS created_at
       FROM users
      WHERE role <> 'member'
      ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'trainer' THEN 1 ELSE 2 END, full_name`
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Management"
        title="Staff accounts"
        subtitle={`${staff.length} account${staff.length === 1 ? "" : "s"} with dashboard access`}
        action={
          <>
            <RefreshButton />
            <AddStaffButton />
          </>
        }
      />

      <Panel pad={false}>
        <Table head={["Staff member", "Role", "Status", "Last sign-in", ""]}>
          {staff.length === 0 ? (
            <EmptyRow title="No staff accounts" hint="Create the first one." icon={Settings} colSpan={5} />
          ) : (
            staff.map((s) => (
              <Tr key={s.id} className={s.id === user.id ? "bg-volt-300/[0.04]" : undefined}>
                <Td>
                  <div className="flex items-center gap-3">
                    <StaffAvatar staff={s} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-smoke-100">
                        {s.full_name}
                        {s.id === user.id && (
                          <span className="ml-2 rounded border border-volt-300/30 bg-volt-300/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-volt-300">
                            you
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-smoke-500">{s.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${roleTone(s.role)}`}>
                    {s.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                    {s.role}
                  </span>
                </Td>
                <Td><StatusPill value={s.status} /></Td>
                <Td className="text-xs">{s.last_login_at ? relativeTime(s.last_login_at) : "never"}</Td>
                <Td className="text-right">
                  <StaffRowActions staff={s} canRemove={s.id !== user.id} />
                </Td>
              </Tr>
            ))
          )}
        </Table>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            role: "Admin",
            tone: "volt" as const,
            desc: "Full access: members, trainers, classes, payments, staff, inbox and settings.",
          },
          {
            role: "Trainer",
            tone: "cyan" as const,
            desc: "Own profile, own classes, member directory and attendance marking.",
          },
          {
            role: "Front desk",
            tone: "ember" as const,
            desc: "Check-ins, member registration, payments and the contact inbox.",
          },
        ].map((r) => (
          <div key={r.role} className="surface-raised p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider2 text-smoke-500">{r.role}</p>
            <p className="mt-2 text-sm leading-relaxed text-smoke-400">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
