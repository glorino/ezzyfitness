"use client";

import { KeyRound, MoreHorizontal, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/client";

export interface StaffRow {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  avatar_media_id: number | null;
  last_login_at: string | null;
  created_at: string;
}

export function StaffRowActions({ staff, canRemove }: { staff: StaffRow; canRemove: boolean }) {
  const router = useRouter();
  const { push } = useToast();
  const [menu, setMenu] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState("");

  async function resetPassword() {
    if (pw.length < 6) return push("error", "Password must be at least 6 characters.");
    setSaving(true);
    try {
      await callApi(`/api/staff/${staff.id}`, "PATCH", { newPassword: pw });
      push("success", `Password reset for ${staff.full_name}.`);
      setPwOpen(false);
      setPw("");
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    const next = staff.status === "active" ? "inactive" : "active";
    try {
      await callApi(`/api/staff/${staff.id}`, "PATCH", { status: next });
      push("success", `${staff.full_name} is now ${next}.`);
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${staff.full_name}'s staff account?`)) return;
    setSaving(true);
    try {
      await callApi(`/api/staff/${staff.id}`, "DELETE");
      push("success", "Account removed.");
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setSaving(false);
      setMenu(false);
    }
  }

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => setMenu((m) => !m)}
          onBlur={() => setTimeout(() => setMenu(false), 180)}
          aria-label={`Actions for ${staff.full_name}`}
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-smoke-400 transition hover:border-volt-300/50 hover:text-volt-300"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menu && (
          <div className="absolute right-0 top-9 z-30 w-52 overflow-hidden rounded-xl border border-white/12 bg-ink-900 p-1.5 shadow-card">
            <button
              onMouseDown={() => setPwOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-smoke-300 transition hover:bg-white/5 hover:text-volt-300"
            >
              <KeyRound className="h-3.5 w-3.5" /> Reset password
            </button>
            <button
              onMouseDown={toggleStatus}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-smoke-300 transition hover:bg-white/5 hover:text-smoke-100"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {staff.status === "active" ? "Suspend access" : "Restore access"}
            </button>
            {canRemove && (
              <button
                onMouseDown={remove}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ember transition hover:bg-ember/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete account
              </button>
            )}
          </div>
        )}
      </div>

      <Modal open={pwOpen} onClose={() => setPwOpen(false)} title={`Reset ${staff.full_name}'s password`} size="sm">
        <Field label="New password" hint="Minimum 6 characters.">
          <Input type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoFocus />
        </Field>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setPwOpen(false)}>Cancel</Button>
          <Button onClick={resetPassword} loading={saving}>Reset password</Button>
        </div>
      </Modal>
    </>
  );
}

export function StaffAvatar({ staff }: { staff: StaffRow }) {
  return <Avatar name={staff.full_name} mediaId={staff.avatar_media_id} size="sm" />;
}
