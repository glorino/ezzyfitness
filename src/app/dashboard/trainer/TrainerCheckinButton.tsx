"use client";

import { ScanLine } from "lucide-react";
import { useState } from "react";
import { CheckinForm } from "@/components/dash/MemberForms";

/** Trainers can check members in directly from the floor. */
export function TrainerCheckinButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-ghost btn-sm" onClick={() => setOpen(true)}>
        <ScanLine className="h-3.5 w-3.5" />
        Check member in
      </button>
      <CheckinForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
