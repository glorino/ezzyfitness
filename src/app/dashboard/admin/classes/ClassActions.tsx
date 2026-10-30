"use client";

import { CalendarPlus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClassForm, type TrainerLite } from "@/components/dash/StaffForms";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/client";

export interface ClassRow {
  id: number;
  name: string;
  category: string;
  description: string | null;
  trainer_id: number | null;
  trainer_name: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
  location: string;
  intensity: string;
  is_active: boolean;
  enrolled: number;
}

export function AddClassButton({ trainers }: { trainers: TrainerLite[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-volt btn-sm" onClick={() => setOpen(true)}>
        <CalendarPlus className="h-3.5 w-3.5" />
        Add class
      </button>
      <ClassForm open={open} onClose={() => setOpen(false)} trainers={trainers} />
    </>
  );
}

export function ClassActions({ klass, trainers }: { klass: ClassRow; trainers: TrainerLite[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete “${klass.name}”? Attendance history is removed too.`)) return;
    try {
      await callApi(`/api/classes/${klass.id}`, "DELETE");
      push("success", "Class deleted.");
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Delete failed.");
    }
  }

  async function toggle() {
    try {
      await callApi(`/api/classes/${klass.id}`, "PATCH", { isActive: !klass.is_active });
      push("success", klass.is_active ? "Class paused — hidden from the schedule." : "Class resumed.");
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Update failed.");
    }
  }

  return (
    <>
      <div className="flex justify-end gap-1.5">
        <button
          onClick={toggle}
          title={klass.is_active ? "Pause class" : "Resume class"}
          aria-label={klass.is_active ? `Pause ${klass.name}` : `Resume ${klass.name}`}
          className={`h-8 rounded-lg border px-2.5 text-[10px] font-bold uppercase tracking-wider transition ${
            klass.is_active
              ? "border-volt-300/30 bg-volt-300/10 text-volt-300 hover:bg-volt-300/20"
              : "border-white/12 bg-white/5 text-smoke-500 hover:text-smoke-300"
          }`}
        >
          {klass.is_active ? "live" : "paused"}
        </button>
        <button
          onClick={() => setEditOpen(true)}
          aria-label={`Edit ${klass.name}`}
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-smoke-400 transition hover:border-volt-300/50 hover:text-volt-300"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={remove}
          aria-label={`Delete ${klass.name}`}
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-smoke-400 transition hover:border-ember/50 hover:text-ember"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <ClassForm open={editOpen} onClose={() => setEditOpen(false)} trainers={trainers} klass={klass} />
    </>
  );
}
