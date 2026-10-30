"use client";

import { ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { AttendanceSheet } from "@/components/dash/StaffForms";
import type { MemberOption } from "@/components/dash/MemberPicker";

/** Trainer-side attendance marking for one of their classes. */
export function MarkAttendance({
  klass,
  members,
}: {
  klass: { id: number; name: string; day_of_week: number };
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
        klass={klass}
        classes={[{ id: klass.id, name: klass.name }]}
        members={members}
      />
    </>
  );
}
