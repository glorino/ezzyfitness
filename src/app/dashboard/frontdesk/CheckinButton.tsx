"use client";

import { ScanLine } from "lucide-react";
import { useState } from "react";
import { CheckinForm } from "@/components/dash/MemberForms";

export function CheckinButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-ghost btn-sm" onClick={() => setOpen(true)}>
        <ScanLine className="h-3.5 w-3.5" />
        Check in member
      </button>
      <CheckinForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
