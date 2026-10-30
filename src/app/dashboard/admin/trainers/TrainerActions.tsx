"use client";

import { Award, Mail, Pencil, Phone, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StaffForm } from "@/components/dash/StaffForms";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/client";
import { InstagramIcon } from "@/components/brand/SocialIcons";

export interface TrainerRow {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_media_id: number | null;
  status: string;
  bio: string | null;
  specialties: string[];
  certifications: string[];
  experience_years: number;
  instagram: string | null;
  is_visible: boolean;
  members_trained: number;
}

export function TrainerActions({ trainer }: { trainer: TrainerRow }) {
  const router = useRouter();
  const { push } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: trainer.full_name,
    email: trainer.email,
    phone: trainer.phone ?? "",
    bio: trainer.bio ?? "",
    specialties: trainer.specialties.join(", "),
    experienceYears: String(trainer.experience_years),
    instagram: trainer.instagram ?? "",
    isVisible: trainer.is_visible,
  });

  async function save() {
    setSaving(true);
    try {
      await callApi(`/api/trainers/${trainer.id}`, "PATCH", {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        bio: form.bio,
        specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
        experienceYears: Number(form.experienceYears) || 0,
        instagram: form.instagram,
        isVisible: form.isVisible,
      });
      push("success", "Trainer updated.");
      setEditOpen(false);
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Remove ${trainer.full_name}? Their classes become unassigned.`)) return;
    setSaving(true);
    try {
      await callApi(`/api/trainers/${trainer.id}`, "DELETE");
      push("success", "Trainer removed.");
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex justify-end gap-1.5">
        <button
          onClick={() => setEditOpen(true)}
          aria-label={`Edit ${trainer.full_name}`}
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-smoke-400 transition hover:border-volt-300/50 hover:text-volt-300"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={remove}
          aria-label={`Remove ${trainer.full_name}`}
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-smoke-400 transition hover:border-ember/50 hover:text-ember"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit ${trainer.full_name}`}
        subtitle="Shown on the public coaches page when visible."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <Avatar name={trainer.full_name} mediaId={trainer.avatar_media_id} size="lg" />
            <p className="text-xs text-smoke-500">
              To change the photo, sign in as{" "}
              <span className="font-semibold text-smoke-300">{trainer.full_name}</span> and use
              their profile page — or ask them to upload one.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field label="Experience (years)">
              <Input
                type="number"
                min={0}
                value={form.experienceYears}
                onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))}
              />
            </Field>
            <Field label="Specialties" hint="Comma separated">
              <Input value={form.specialties} onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))} />
            </Field>
            <Field label="Instagram">
              <Input value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} />
            </Field>
          </div>
          <Field label="Bio">
            <Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <input
              type="checkbox"
              checked={form.isVisible}
              onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))}
              className="h-4 w-4 accent-volt-300"
            />
            <span className="text-sm text-smoke-300">Show on the public coaches page</span>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3 border-t border-white/8 pt-4">
          <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={save} loading={saving}>Save changes</Button>
        </div>
      </Modal>
    </>
  );
}

/** “Add trainer” — creates the login account + profile in one flow. */
export function AddTrainerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-volt btn-sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-3.5 w-3.5" />
        Add trainer
      </button>
      <StaffForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function TrainerMeta({ trainer }: { trainer: TrainerRow }) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 truncate text-xs text-smoke-500">
        <Mail className="h-3 w-3 shrink-0" /> {trainer.email}
      </p>
      {trainer.phone && (
        <p className="flex items-center gap-1.5 truncate text-xs text-smoke-500">
          <Phone className="h-3 w-3 shrink-0" /> {trainer.phone}
        </p>
      )}
      {trainer.instagram && (
        <p className="flex items-center gap-1.5 truncate text-xs text-smoke-500">
          <InstagramIcon className="h-3 w-3 shrink-0" /> @{trainer.instagram.replace(/^@/, "")}
        </p>
      )}
      {trainer.certifications.length > 0 && (
        <p className="flex items-center gap-1.5 truncate text-xs text-smoke-500">
          <Award className="h-3 w-3 shrink-0" /> {trainer.certifications.slice(0, 2).join(" · ")}
        </p>
      )}
    </div>
  );
}
