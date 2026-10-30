"use client";

import { Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PaymentForm, type PlanOption } from "@/components/dash/MemberForms";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/client";

/** “Record payment” button used across admin & front-desk pages. */
export function RecordPaymentButton({
  plans,
  label = "Record payment",
}: {
  plans: PlanOption[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-volt btn-sm" onClick={() => setOpen(true)}>
        <Receipt className="h-3.5 w-3.5" />
        {label}
      </button>
      <PaymentForm open={open} onClose={() => setOpen(false)} plans={plans} />
    </>
  );
}

export function PaymentRowActions({
  payment,
}: {
  payment: { id: number; status: string; member_name: string };
}) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);

  async function refund() {
    if (!window.confirm(`Mark ${payment.member_name}'s payment as refunded?`)) return;
    try {
      await callApi(`/api/payments/${payment.id}`, "PATCH", { status: "refunded" });
      push("success", "Payment marked refunded.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function remove() {
    if (!window.confirm("Permanently delete this payment record?")) return;
    try {
      await callApi(`/api/payments/${payment.id}`, "DELETE");
      push("success", "Payment deleted.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Delete failed.");
    }
  }

  if (payment.status !== "paid") return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-smoke-500 transition hover:text-volt-300"
      >
        Manage
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Payment options" size="sm">
        <div className="space-y-3">
          <p className="text-sm text-smoke-400">
            {payment.member_name}&apos;s payment — refund or remove the record.
          </p>
          <Button variant="danger" onClick={refund} className="w-full">
            Mark as refunded
          </Button>
          <Button variant="ghost" onClick={remove} className="w-full">
            Delete record
          </Button>
        </div>
      </Modal>
    </>
  );
}
