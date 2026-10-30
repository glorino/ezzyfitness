import { Inbox, MessageSquare, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import {
  EmptyRow,
  MetaRow,
  PageHeader,
  Panel,
} from "@/components/dash/ui";
import { getCurrentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function MemberContact() {
  const user = await getCurrentUser();
  if (!user || user.role !== "member") redirect("/login");

  const [membership, trainers, recentMessages] = await Promise.all([
    one<{
      membership_no: string;
      status: string;
      emergency_name: string | null;
      emergency_phone: string | null;
      goals: string | null;
    }>(
      `SELECT m.membership_no, m.status, m.emergency_name, m.emergency_phone, m.goals
         FROM members m
        WHERE m.user_id = $1`,
      [user.id]
    ),
    query<{ id: number; full_name: string; specialties: string[]; bio: string | null }>(
      `SELECT u.id, u.full_name, t.specialties, t.bio
         FROM trainers t
         JOIN users u ON u.id = t.user_id
        WHERE u.status = 'active'
        ORDER BY u.full_name
        LIMIT 6`,
      []
    ),
    query<{ id: number; subject: string; status: string; created_at: string; response: string | null }>(
      `SELECT id, subject, status, created_at::text AS created_at, response
         FROM contact_messages
        WHERE email = $1
        ORDER BY created_at DESC
        LIMIT 5`,
      [user.email]
    ),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Member portal"
        title="Contact Coach"
        subtitle="Get in touch with your coaches or check your recent messages."
        action={
          <Link href="/dashboard/member" className="btn-volt btn-sm">
            <UserRound className="h-3.5 w-3.5" />
            Back to dashboard
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* --------------------------------------------- coaches */}
        <Panel title="Your coaches" subtitle="Reach out for guidance or questions">
          {trainers.length === 0 ? (
            <EmptyRow
              title="No coaches assigned yet"
              hint="Coaches will appear here once assigned to the gym."
              icon={UserRound}
              colSpan={1}
            />
          ) : (
            <div className="space-y-4">
              {trainers.map((t) => (
                <div key={t.id} className="flex items-start gap-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <Avatar name={t.full_name} mediaId={null} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-smoke-100">{t.full_name}</p>
                    {t.specialties?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {t.specialties.slice(0, 3).map((s) => (
                          <span key={s} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-smoke-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {t.bio && (
                      <p className="mt-2 text-xs text-smoke-500 line-clamp-2">{t.bio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* --------------------------------------------- contact info */}
        <div className="space-y-6">
          <Panel title="Contact information">
            <MetaRow
              items={[
                { icon: <Phone className="h-3.5 w-3.5" />, label: "Front desk", value: SITE.phone },
                { icon: <MessageSquare className="h-3.5 w-3.5" />, label: "Email", value: "info@ezzyfitness.com" },
                { icon: <Inbox className="h-3.5 w-3.5" />, label: "Hours", value: SITE.hours?.[0]?.value ?? "Mon-Sat" },
              ]}
            />
            <div className="mt-4 rounded-xl border border-volt-300/25 bg-volt-300/8 p-4">
              <p className="text-xs font-semibold text-volt-300">Need help?</p>
              <p className="mt-1 text-sm text-smoke-300">
                Call the front desk or send a message through the contact form. Our team responds within one business day.
              </p>
              <Link href="/contact" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-volt-300 hover:underline">
                <MessageSquare className="h-3.5 w-3.5" />
                Send a message
              </Link>
            </div>
          </Panel>

          <Panel title="Your recent messages" subtitle="Status of your enquiries">
            {recentMessages.length === 0 ? (
              <EmptyRow
                title="No messages sent yet"
                hint="Use the contact form to reach out to our team."
                icon={MessageSquare}
                colSpan={1}
              />
            ) : (
              <div className="space-y-3">
                {recentMessages.map((m) => (
                  <div key={m.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-smoke-100">{m.subject}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        m.status === 'replied' ? 'bg-volt-300/12 text-volt-300 border border-volt-300/30' :
                        m.status === 'new' ? 'bg-amber-400/12 text-amber-300 border border-amber-300/30' :
                        'bg-white/8 text-smoke-300 border border-white/12'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-smoke-500">{formatDate(m.created_at)}</p>
                    {m.response && (
                      <div className="mt-2 rounded-lg border border-white/8 bg-white/[0.03] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-smoke-500">Response</p>
                        <p className="mt-1 text-sm text-smoke-300">{m.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* --------------------------------------------- emergency contact */}
      <Panel title="Emergency contact">
        {membership?.emergency_name ? (
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-smoke-200 font-semibold">{membership.emergency_name}</p>
                {membership.emergency_phone && (
                  <p className="flex items-center gap-1.5 text-sm text-smoke-400 mt-1">
                    <Phone className="h-3.5 w-3.5 text-volt-300" />
                    {membership.emergency_phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-smoke-500">
            No emergency contact set. Please ask the front desk to add one for your safety.
          </p>
        )}
      </Panel>
    </div>
  );
}
