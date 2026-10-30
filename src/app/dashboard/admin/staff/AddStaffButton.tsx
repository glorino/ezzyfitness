"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import { StaffForm } from "@/components/dash/StaffForms";

export function AddStaffButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-volt btn-sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-3.5 w-3.5" />
        Add staff
      </button>
      <StaffForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
