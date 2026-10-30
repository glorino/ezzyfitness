"use client";

import { CalendarPlus, KeyRound, ShieldCheck, UserCog, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MemberPicker, type MemberOption } from "@/components/dash/MemberPicker";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/client";
import { cn, formatDate } from "@/lib/format";

/* ================================================================== */
/* Create a staff account (admin)                                     */
/* ================================================================== */

export function StaffForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", role: "frontdesk", password: "" });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await callApi<{ temporaryPassword: string | null }>("/api/staff", "POST", form);
      setTempPw(res.temporaryPassword);
      if (!res.temporaryPassword) {
        push("success", `${form.fullName} added as ${form.role}.`);
        setForm({ fullName: "", email: "", phone: "", role: "frontdesk", password: "" });
        onClose();
      }
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setTempPw(null);
        onClose();
      }}
      title={tempPw ? "Staff account created" : "Add staff account"}
      subtitle="Front desk officers, secretaries, trainers and admins."
      size="sm"
    >
      {tempPw ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-volt-300/30 bg-volt-300/8 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-volt-300">
              Temporary password
            </p>
            <p className="mt-2 font-mono text-2xl text-smoke-100">{tempPw}</p>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              setTempPw(null);
              setForm({ fullName: "", email: "", phone: "", role: "frontdesk", password: "" });
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name">
            <Input required value={form.fullName} onChange={set("fullName")} placeholder="Aigbojie Obazee" />
          </Field>
          <Field label="Email">
            <Input type="email" required value={form.email} onChange={set("email")} placeholder="name@ezzyfitness.ng" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <Input value={form.phone} onChange={set("phone")} placeholder="0800 000 0000" />
            </Field>
            <Field label="Role">
              <Select value={form.role} onChange={set("role")}>
                <option value="frontdesk">Front desk / secretary</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
          </div>
          <Field label="Password" hint="Leave blank to auto-generate a strong one.">
            <Input value={form.password} onChange={set("password")} placeholder="Auto-generate" />
          </Field>
          <div className="flex justify-end gap-3 border-t border-white/8 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={busy} icon={Users}>
              Create account
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ================================================================== */
/* Class schedule form (create / edit)                                */
/* ================================================================== */

export interface TrainerLite {
  id: number;
  full_name: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ClassForm({
  open,
  onClose,
  trainers,
  klass,
}: {
  open: boolean;
  onClose: () => void;
  trainers: TrainerLite[];
  klass?: {
    id: number;
    name: string;
    category: string;
    description: string | null;
    trainer_id: number | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    capacity: number;
    location: string;
    intensity: string;
  } | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(() => ({
    name: klass?.name ?? "",
    category: klass?.category ?? "Strength",
    description: klass?.description ?? "",
    trainerId: klass?.trainer_id ? String(klass.trainer_id) : "",
    dayOfWeek: String(klass?.day_of_week ?? 1),
    startTime: (klass?.start_time ?? "06:00").slice(0, 5),
    endTime: (klass?.end_time ?? "07:00").slice(0, 5),
    capacity: String(klass?.capacity ?? 20),
    location: klass?.location ?? "Main Floor",
    intensity: klass?.intensity ?? "Medium",
    isActive: klass ? true : true,
  }));
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const categories = useMemo(
    () => ["Strength", "Cardio", "HIIT", "Yoga", "Dance", "Combat", "Mobility", "General"],
    []
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        trainerId: form.trainerId ? Number(form.trainerId) : null,
        day: Number(form.dayOfWeek),
        capacity: Number(form.capacity),
      };
      if (klass) {
        await callApi(`/api/classes/${klass.id}`, "PATCH", payload);
        push("success", "Class updated.");
      } else {
        await callApi("/api/classes", "POST", payload);
        push("success", "Class added to the schedule.");
      }
      onClose();
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Could not save the class.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={klass ? "Edit class" : "Add class"}
      subtitle="Appears instantly on the public schedule."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Class name">
          <Input required value={form.name} onChange={set("name")} placeholder="Sunrise HIIT" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select value={form.category} onChange={set("category")}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Trainer">
            <Select value={form.trainerId} onChange={set("trainerId")}>
              <option value="">Unassigned</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Day">
            <Select value={form.dayOfWeek} onChange={set("dayOfWeek")}>
              {DAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Intensity">
            <Select value={form.intensity} onChange={set("intensity")}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </Select>
          </Field>
          <Field label="Start time">
            <Input type="time" required value={form.startTime} onChange={set("startTime")} />
          </Field>
          <Field label="End time">
            <Input type="time" required value={form.endTime} onChange={set("endTime")} />
          </Field>
          <Field label="Capacity">
            <Input type="number" min={1} max={200} value={form.capacity} onChange={set("capacity")} />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={set("location")} placeholder="Studio B" />
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={form.description} onChange={set("description")} placeholder="What should members expect?" />
        </Field>
        <div className="flex justify-end gap-3 border-t border-white/8 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy} icon={CalendarPlus}>
            {klass ? "Save changes" : "Add class"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ================================================================== */
/* Attendance sheet                                                   */
/* ================================================================== */

export function AttendanceSheet({
  open,
  onClose,
  klass,
  classes,
  members,
}: {
  open: boolean;
  onClose: () => void;
  klass: { id: number; name: string; day_of_week: number } | null;
  classes: { id: number; name: string }[];
  members: MemberOption[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [classId, setClassId] = useState(String(klass?.id ?? ""));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<number, "present" | "absent" | "late">>({});

  const target = klass?.id ?? (classId ? Number(classId) : null);

  function mark(id: number, status: "present" | "absent" | "late") {
    setMarks((m) => ({ ...m, [id]: status }));
  }

  async function save() {
    if (!target) return push("error", "Choose a class first.");
    const entries = Object.entries(marks).map(([memberId, status]) => ({
      memberId: Number(memberId),
      status,
    }));
    if (!entries.length) return push("error", "Mark at least one member.");
    setBusy(true);
    try {
      const res = await callApi<{ count: number }>("/api/attendance", "POST", {
        classId: target,
        date,
        entries,
      });
      push("success", `Saved attendance for ${res.count} member${res.count === 1 ? "" : "s"}.`);
      setMarks({});
      onClose();
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Could not save attendance.");
    } finally {
      setBusy(false);
    }
  }

  const setStatusAll = (status: "present" | "absent" | "late") =>
    setMarks(Object.fromEntries(members.map((m) => [m.id, status])));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mark attendance"
      subtitle={klass ? `${klass.name} · pick a date` : "Pick a class and session date"}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {!klass && (
            <Field label="Class">
              <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">Select…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Session date" className={klass ? "sm:col-span-2" : undefined}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-smoke-500">
            <span className="font-semibold text-smoke-300">{members.length}</span> active members ·{" "}
            <span className="font-semibold text-volt-300">{Object.keys(marks).length}</span> marked
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" type="button" onClick={() => setStatusAll("present")}>
              All present
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setMarks({})}>
              Clear
            </Button>
          </div>
        </div>

        <ul className="max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
          {members.map((m) => {
            const current = marks[m.id];
            return (
              <li
                key={m.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition-colors",
                  current ? "border-volt-300/25 bg-volt-300/5" : "border-white/8 bg-white/[0.02]"
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-smoke-100">{m.full_name}</p>
                  <p className="truncate text-xs text-smoke-500">{m.membership_no}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {(["present", "late", "absent"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => mark(m.id, s)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition",
                        current === s
                          ? s === "present"
                            ? "border-volt-300/40 bg-volt-300/20 text-volt-300"
                            : s === "late"
                              ? "border-amber-300/40 bg-amber-300/15 text-amber-300"
                              : "border-ember/40 bg-ember/15 text-ember"
                          : "border-white/10 text-smoke-500 hover:border-white/25 hover:text-smoke-300"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end gap-3 border-t border-white/8 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={busy} icon={ShieldCheck}>
            Save attendance
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/* Trainer profile editor                                             */
/* ================================================================== */

export function TrainerProfileForm({
  userId,
  initial,
}: {
  userId: number;
  initial: {
    bio: string | null;
    specialties: string[];
    certifications: string[];
    experienceYears: number;
    instagram: string | null;
    fullName: string;
    phone: string | null;
  };
}) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: initial.fullName,
    phone: initial.phone ?? "",
    bio: initial.bio ?? "",
    specialties: initial.specialties.join(", "),
    certifications: initial.certifications.join(", "),
    experienceYears: String(initial.experienceYears),
    instagram: initial.instagram ?? "",
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const split = (s: string) =>
        s.split(",").map((x) => x.trim()).filter(Boolean);
      await callApi(`/api/trainers/${userId}`, "PATCH", {
        fullName: form.fullName,
        phone: form.phone,
        bio: form.bio,
        specialties: split(form.specialties),
        certifications: split(form.certifications),
        experienceYears: Number(form.experienceYears) || 0,
        instagram: form.instagram,
      });
      push("success", "Profile saved — your public coach page is updated.");
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input required value={form.fullName} onChange={set("fullName")} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label="Specialties" hint="Comma separated — Strength, HIIT, Boxing…">
          <Input value={form.specialties} onChange={set("specialties")} />
        </Field>
        <Field label="Certifications" hint="Comma separated — NASM, ACE…">
          <Input value={form.certifications} onChange={set("certifications")} />
        </Field>
        <Field label="Years of experience">
          <Input type="number" min={0} max={60} value={form.experienceYears} onChange={set("experienceYears")} />
        </Field>
        <Field label="Instagram handle">
          <Input value={form.instagram} onChange={set("instagram")} placeholder="@ezzycoach" />
        </Field>
      </div>
      <Field label="Coach bio">
        <Textarea value={form.bio} onChange={set("bio")} placeholder="Tell members your story and coaching style…" />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={busy} icon={UserCog}>
          Save profile
        </Button>
      </div>
    </form>
  );
}

/* ================================================================== */
/* Change password (member self-service)                              */
/* ================================================================== */

export function PasswordForm({ userId }: { userId: number }) {
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      return push("error", "New passwords don't match.");
    }
    setBusy(true);
    try {
      await callApi("/api/profile", "PATCH", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      push("success", "Password updated.");
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Current password">
          <Input
            type="password"
            required
            value={form.currentPassword}
            onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
          />
        </Field>
        <Field label="New password" hint="Min. 6 characters">
          <Input
            type="password"
            required
            minLength={6}
            value={form.newPassword}
            onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
          />
        </Field>
        <Field label="Confirm new">
          <Input
            type="password"
            required
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={busy} icon={KeyRound}>
          Update password
        </Button>
      </div>
      <p className="text-xs text-smoke-500">
        Account ID {userId} · last change requires your current password for safety.
      </p>
    </form>
  );
}

/* ================================================================== */
/* Plan editor (admin)                                                */
/* ================================================================== */

export function PlanForm({
  open,
  onClose,
  plan,
}: {
  open: boolean;
  onClose: () => void;
  plan?: {
    id: number;
    name: string;
    tagline: string | null;
    price_ngn: number;
    duration_days: number;
    features: string[];
    is_popular: boolean;
  } | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: plan?.name ?? "",
    tagline: plan?.tagline ?? "",
    price: String(plan?.price_ngn ?? ""),
    durationDays: String(plan?.duration_days ?? 30),
    features: (plan?.features ?? []).join("\n"),
    isPopular: plan?.is_popular ? "1" : "0",
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        tagline: form.tagline,
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
        isPopular: form.isPopular === "1",
      };
      if (plan) {
        await callApi(`/api/plans/${plan.id}`, "PATCH", payload);
        push("success", "Plan updated.");
      } else {
        await callApi("/api/plans", "POST", payload);
        push("success", "Plan created.");
      }
      onClose();
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Could not save the plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={plan ? "Edit plan" : "New membership plan"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Plan name">
          <Input required value={form.name} onChange={set("name")} placeholder="Quarterly Beast" />
        </Field>
        <Field label="Tagline">
          <Input value={form.tagline} onChange={set("tagline")} placeholder="Three months. One mission." />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (₦)">
            <Input type="number" min={0} required value={form.price} onChange={set("price")} />
          </Field>
          <Field label="Duration (days)">
            <Input type="number" min={1} required value={form.durationDays} onChange={set("durationDays")} />
          </Field>
        </div>
        <Field label="Features" hint="One per line.">
          <Textarea value={form.features} onChange={set("features")} placeholder={"Full floor access\n2 group classes / week"} />
        </Field>
        <Field label="Highlight as popular">
          <Select value={form.isPopular} onChange={set("isPopular")}>
            <option value="0">No</option>
            <option value="1">Yes — badge on pricing page</option>
          </Select>
        </Field>
        <div className="flex justify-end gap-3 border-t border-white/8 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {plan ? "Save changes" : "Create plan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ================================================================== */
/* Inbox detail                                                       */
/* ================================================================== */

export function MessageDetail({
  message,
  onClose,
}: {
  message: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    subject: string | null;
    message: string;
    status: string;
    created_at: string;
  } | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { push } = useToast();

  async function setStatus(status: string) {
    if (!message) return;
    try {
      await callApi(`/api/contact/${message.id}`, "PATCH", { status });
      push("success", `Marked as ${status}.`);
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Update failed.");
    }
  }

  return (
    <Modal
      open={!!message}
      onClose={onClose}
      title={message?.subject || "Message"}
      subtitle={message ? `${message.name} · ${formatDate(message.created_at)}` : ""}
      side="right"
    >
      {message && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-smoke-100">{message.name}</p>
              <p className="truncate text-xs text-smoke-500">{message.email}</p>
              {message.phone && <p className="truncate text-xs text-smoke-500">{message.phone}</p>}
            </div>
            <a href={`mailto:${message.email}?subject=Re: ${message.subject ?? "Ezzy Fitness"}`} className="btn-ghost btn-sm shrink-0">
              Reply
            </a>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-smoke-300">{message.message}</p>
          <div className="flex flex-wrap gap-2 border-t border-white/8 pt-4">
            {message.status !== "read" && (
              <Button size="sm" variant="ghost" onClick={() => setStatus("read")}>
                Mark read
              </Button>
            )}
            {message.status !== "replied" && (
              <Button size="sm" onClick={() => setStatus("replied")}>
                Mark replied
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
