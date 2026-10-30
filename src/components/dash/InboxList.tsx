"use client";

import { Inbox, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageDetail } from "@/components/dash/StaffForms";
import { EmptyRow, Table, Td, Tr, StatusPill } from "@/components/dash/ui";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/client";
import { cn, relativeTime } from "@/lib/format";

export interface Message {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
}

/** Click-to-read inbox shared by admin and front desk. */
export function InboxList({ messages, canDelete }: { messages: Message[]; canDelete: boolean }) {
  const router = useRouter();
  const { push } = useToast();
  const [active, setActive] = useState<Message | null>(null);

  async function remove(m: Message) {
    if (!window.confirm(`Delete the message from ${m.name}?`)) return;
    try {
      await callApi(`/api/contact/${m.id}`, "DELETE");
      push("success", "Message deleted.");
      setActive(null);
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <>
      <Table head={["From", "Subject", "Received", "Status", ""]}>
        {messages.length === 0 ? (
          <EmptyRow
            title="Inbox zero"
            hint="New messages from the website contact form land here."
            icon={Inbox}
            colSpan={5}
          />
        ) : (
          messages.map((m) => (
            <Tr key={m.id} className={cn(m.status === "new" && "bg-volt-300/[0.04]")}>
              <Td>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-semibold text-smoke-100">
                    {m.status === "new" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-volt-300" />}
                    {m.name}
                  </p>
                  <p className="truncate text-xs text-smoke-500">{m.email}</p>
                </div>
              </Td>
              <Td>
                <button
                  onClick={() => setActive(m)}
                  className="max-w-[280px] truncate text-left text-sm text-smoke-300 underline-offset-2 transition hover:text-volt-300 hover:underline"
                >
                  {m.subject || "No subject"}
                </button>
              </Td>
              <Td className="text-xs">{relativeTime(m.created_at)}</Td>
              <Td><StatusPill value={m.status} /></Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setActive(m)}
                    className="text-xs font-semibold text-smoke-500 transition hover:text-volt-300"
                  >
                    Read
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => remove(m)}
                      aria-label="Delete message"
                      className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-smoke-500 transition hover:border-ember/50 hover:text-ember"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </Td>
            </Tr>
          ))
        )}
      </Table>

      <MessageDetail message={active} onClose={() => setActive(null)} />
    </>
  );
}
