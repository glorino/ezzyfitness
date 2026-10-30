"use client";

import { ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { AttendanceSheet } from "@/components/dash/StaffForms";
import type { MemberOption } from "@/components/dash/MemberPicker";

/** Opens the shared attendance sheet (all active classes selectable inside). */
export function MarkAttendanceButton({
  classes,
  members,
}: {
  classes: { id: number; name: string }[];
  members: MemberOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-ghost btn-sm" onClick={() => setOpen(true)}>
        <ClipboardCheck className="h-3.5 w-3.5" />
        Mark attendance
      </button>
      <AttendanceSheet
        open={open}
        onClose={() => setOpen(false)}
        klass={null}
        classes={classes}
        members={members}
      />
    </>
  );
}
