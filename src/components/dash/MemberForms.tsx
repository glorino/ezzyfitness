"use client";

import { CheckCircle2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MemberPicker, type MemberOption } from "@/components/dash/MemberPicker";
import { Button, Field, Input, Select, Spinner, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/client";
import { naira } from "@/lib/format";

export interface PlanOption {
  id: number;
  name: string;
  price_ngn: number;
  duration_days: number;
}

/* ================================================================== */
/* Register a new member                                              */
/* ================================================================== */

export function MemberForm({
  open,
  onClose,
  plans,
}: {
  open: boolean;
  onClose: () => void;
  plans: PlanOption[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    planId: "",
    gender: "",
    dateOfBirth: "",
    goals: "",
    emergencyName: "",
    emergencyPhone: "",
    notes: "",
    password: "",
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await callApi<{ temporaryPassword: string | null }>("/api/members", "POST", {
        ...form,
        planId: form.planId ? Number(form.planId) : null,
      });
      setTempPw(res.temporaryPassword);
      if (!res.temporaryPassword) {
        push("success", `${form.fullName.split(" ")[0]} is registered.`);
        reset();
        onClose();
      }
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setTempPw(null);
    setForm({
      fullName: "",
      email: "",
      phone: "",
      planId: "",
      gender: "",
      dateOfBirth: "",
      goals: "",
      emergencyName: "",
      emergencyPhone: "",
      notes: "",
      password: "",
    });
  }

  const plan = plans.find((p) => String(p.id) === form.planId);

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={tempPw ? "Member registered 🎉" : "Register new member"}
      subtitle={
        tempPw
          ? "Share these login details with the member."
          : "Creates their login and membership in one step."
      }
    >
      {tempPw ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-volt-300/30 bg-volt-300/8 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-volt-300">
              Temporary password
            </p>
            <p className="mt-2 font-mono text-2xl text-smoke-100">{tempPw}</p>
            <p className="mt-2 text-xs text-smoke-400">
              Email: <span className="text-smoke-200">{form.email || "—"}</span>
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                navigator.clipboard?.writeText(
                  `Ezzy Fitness login — email: ${form.email}, password: ${tempPw}`
                );
                push("success", "Copied to clipboard.");
              }}
            >
              Copy details
            </Button>
            <Button
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" className="sm:col-span-2">
              <Input required value={form.fullName} onChange={set("fullName")} placeholder="Osemudiamen Idahosa" />
            </Field>
            <Field label="Email">
              <Input type="email" required value={form.email} onChange={set("email")} placeholder="member@mail.com" />
            </Field>
            <Field label="Phone">
              <Input required value={form.phone} onChange={set("phone")} placeholder="0801 234 5678" />
            </Field>
            <Field label="Membership plan" hint={plan ? `${plan.duration_days} days · ${naira(plan.price_ngn)}` : undefined}>
              <Select value={form.planId} onChange={set("planId")}>
                <option value="">Walk-in (no plan yet)</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {naira(p.price_ngn)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={set("gender")}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Date of birth">
              <Input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
            </Field>
            <Field label="Login password" hint="Leave blank to auto-generate one.">
              <Input value={form.password} onChange={set("password")} placeholder="Auto-generate" />
            </Field>
            <Field label="Fitness goals" className="sm:col-span-2">
              <Textarea value={form.goals} onChange={set("goals")} placeholder="Lose 8kg, run 10k, feel stronger…" />
            </Field>
            <Field label="Emergency contact">
              <Input value={form.emergencyName} onChange={set("emergencyName")} placeholder="Contact name" />
            </Field>
            <Field label="Emergency phone">
              <Input value={form.emergencyPhone} onChange={set("emergencyPhone")} placeholder="0803 000 0000" />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Input value={form.notes} onChange={set("notes")} placeholder="Injuries, preferences, referral…" />
            </Field>
          </div>
          <div className="flex justify-end gap-3 border-t border-white/8 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={busy} icon={UserPlus}>
              Register member
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ================================================================== */
/* Record a payment / renewal                                         */
/* ================================================================== */

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Bank transfer" },
  { value: "pos", label: "POS" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

export function PaymentForm({
  open,
  onClose,
  plans,
  presetMember = null,
}: {
  open: boolean;
  onClose: () => void;
  plans: PlanOption[];
  presetMember?: MemberOption | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [member, setMember] = useState<MemberOption | null>(presetMember);
  const [form, setForm] = useState({
    planId: "",
    amount: "",
    method: "cash",
    reference: "",
    notes: "",
    extend: "1",
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const plan = plans.find((p) => String(p.id) === form.planId);

  function pickPlan(id: string) {
    const p = plans.find((x) => String(x.id) === id);
    setForm((f) => ({ ...f, planId: id, amount: p ? String(p.price_ngn) : f.amount }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return push("error", "Select the member paying.");
    setBusy(true);
    try {
      await callApi("/api/payments", "POST", {
        memberId: member.id,
        planId: form.planId ? Number(form.planId) : null,
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference,
        notes: form.notes,
        extend: form.extend === "1",
      });
      push(
        "success",
        form.extend === "1" && plan
          ? `Payment received — ${member.full_name.split(" ")[0]} renewed for ${plan.duration_days} days.`
          : "Payment recorded."
      );
      setForm({ planId: "", amount: "", method: "cash", reference: "", notes: "", extend: "1" });
      setMember(null);
      onClose();
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
      subtitle="Cash, transfer or POS — extends membership instantly."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Member">
          <MemberPicker value={member} onChange={setMember} autoFocus />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Plan" hint={plan ? `${plan.duration_days} days of access` : undefined}>
            <Select value={form.planId} onChange={(e) => pickPlan(e.target.value)}>
              <option value="">One-off payment (no renewal)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {naira(p.price_ngn)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount (₦)">
            <Input type="number" min={0} required value={form.amount} onChange={set("amount")} placeholder="25000" />
          </Field>
          <Field label="Method">
            <Select value={form.method} onChange={set("method")}>
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reference" hint="Transfer receipt no. (optional)">
            <Input value={form.reference} onChange={set("reference")} placeholder="TRF-0091" />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Input value={form.notes} onChange={set("notes")} placeholder="Anything the admin should know…" />
          </Field>
        </div>
        {plan && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <input
              type="checkbox"
              checked={form.extend === "1"}
              onChange={(e) => setForm((f) => ({ ...f, extend: e.target.checked ? "1" : "0" }))}
              className="mt-0.5 h-4 w-4 accent-volt-300"
            />
            <span className="text-sm text-smoke-300">
              Extend membership by <span className="font-semibold text-smoke-100">{plan.duration_days} days</span>
              {member?.expires_at && " (stacked after the current expiry)"}
            </span>
          </label>
        )}
        <div className="flex justify-end gap-3 border-t border-white/8 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            Save payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ================================================================== */
/* Front-desk check-in                                                */
/* ================================================================== */

export function CheckinForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [member, setMember] = useState<MemberOption | null>(null);
  const [note, setNote] = useState("");
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return push("error", "Search and select the member first.");
    setBusy(true);
    try {
      await callApi("/api/checkins", "POST", { memberId: member.id, note });
      setLastChecked(member.full_name);
      push("success", `${member.full_name} checked in. Welcome back!`);
      setMember(null);
      setNote("");
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Check-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Check a member in"
      subtitle="Search by name, phone, email or member number."
      size="sm"
    >
      <form onSubmit={submit} className="space-y-4">
        {lastChecked && (
          <div className="flex items-center gap-2.5 rounded-xl border border-volt-300/30 bg-volt-300/8 px-4 py-3 text-sm text-volt-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Last check-in: <span className="font-semibold">{lastChecked}</span>
          </div>
        )}
        <MemberPicker value={member} onChange={setMember} autoFocus />
        {member && member.status !== "active" && (
          <p className="rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
            Heads up — this membership is <span className="font-bold uppercase">{member.status}</span>. Renew from the
            Payments tab.
          </p>
        )}
        <Field label="Note (optional)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Morning session, guest day pass…" />
        </Field>
        <div className="flex justify-end gap-3 border-t border-white/8 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" loading={busy} disabled={!member}>
            Check in
          </Button>
        </div>
      </form>
    </Modal>
  );
}
