"use client";

import { CreditCard, MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MemberForm, PaymentForm, type PlanOption } from "@/components/dash/MemberForms";
import { Modal } from "@/components/ui/Modal";
import { Button, Field, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/client";
import { formatDate } from "@/lib/format";

export interface MemberRow {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  membership_no: string;
  status: string;
  expires_at: string | null;
  joined_at: string;
  plan_name: string | null;
  plan_id: number | null;
  goals: string | null;
  gender: string | null;
  date_of_birth: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  notes: string | null;
  checkins_30d: number;
  avatar_media_id?: number | null;
}

/** “Register member” button that owns the modal state (client side). */
export function RegisterTrigger({ plans }: { plans: PlanOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-volt btn-sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-3.5 w-3.5" />
        Register member
      </button>
      <MemberForm open={open} onClose={() => setOpen(false)} plans={plans} />
    </>
  );
}

/** Row overflow menu: renew, edit details, freeze, delete. */
export function MemberRowActions({ member, plans }: { member: MemberRow; plans: PlanOption[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [menu, setMenu] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    planId: member.plan_id ? String(member.plan_id) : "",
    status: member.status,
    expiresAt: member.expires_at?.slice(0, 10) ?? "",
    goals: member.goals ?? "",
    emergencyName: member.emergency_name ?? "",
    emergencyPhone: member.emergency_phone ?? "",
    notes: member.notes ?? "",
  });

  async function saveEdit() {
    setSaving(true);
    try {
      await callApi(`/api/members/${member.id}`, "PATCH", {
        planId: form.planId ? Number(form.planId) : null,
        membershipStatus: form.status,
        expiresAt: form.expiresAt || null,
        goals: form.goals,
        emergencyName: form.emergencyName,
        emergencyPhone: form.emergencyPhone,
        notes: form.notes,
      });
      push("success", `${member.full_name.split(" ")[0]}'s record updated.`);
      setEditOpen(false);
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${member.full_name}? This removes their login and record.`)) return;
    setSaving(true);
    try {
      await callApi(`/api/members/${member.id}`, "DELETE");
      push("success", "Member deleted.");
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
          onBlur={() => setTimeout(() => setMenu(false), 150)}
          aria-label={`Actions for ${member.full_name}`}
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-smoke-400 transition hover:border-volt-300/50 hover:text-volt-300"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menu && (
          <div className="absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-xl border border-white/12 bg-ink-900 p-1.5 shadow-card">
            <button
              onMouseDown={() => setPayOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-smoke-300 transition hover:bg-white/5 hover:text-volt-300"
            >
              <CreditCard className="h-3.5 w-3.5" /> Record payment
            </button>
            <button
              onMouseDown={() => setEditOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-smoke-300 transition hover:bg-white/5 hover:text-smoke-100"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit record
            </button>
            <button
              onMouseDown={remove}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ember transition hover:bg-ember/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete member
            </button>
          </div>
        )}
      </div>

      <PaymentForm
        open={payOpen}
        onClose={() => setPayOpen(false)}
        plans={plans}
        presetMember={{
          id: member.id,
          full_name: member.full_name,
          email: member.email,
          phone: member.phone,
          avatar_media_id: null,
          membership_no: member.membership_no,
          status: member.status,
          expires_at: member.expires_at,
          checked_in_today: false,
        }}
      />

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit ${member.full_name}`}
        subtitle={`Member ${member.membership_no} · joined ${formatDate(member.joined_at)}`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Plan">
            <Select value={form.planId} onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}>
              <option value="">Walk-in (no plan)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="frozen">Frozen</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
          <Field label="Expires on">
            <Input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
          </Field>
          <Field label="Emergency contact">
            <Input value={form.emergencyName} onChange={(e) => setForm((f) => ({ ...f, emergencyName: e.target.value }))} />
          </Field>
          <Field label="Emergency phone">
            <Input value={form.emergencyPhone} onChange={(e) => setForm((f) => ({ ...f, emergencyPhone: e.target.value }))} />
          </Field>
          <Field label="Goals" className="sm:col-span-2">
            <Input value={form.goals} onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-3 border-t border-white/8 pt-4">
          <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={saveEdit} loading={saving}>Save changes</Button>
        </div>
      </Modal>
    </>
  );
}
