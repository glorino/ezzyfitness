"use client";

import { useState } from "react";

/**
 * Flutterwave payment button for member self-service payments.
 * Posts to /api/payments with card method, backend handles Flutterwave integration.
 */
export function FlutterwavePayButton({
  memberId,
  memberName,
  amount,
  planName,
}: {
  memberId: number;
  memberName: string;
  amount: number;
  planName: string;
}) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          amount,
          method: "card",
          reference: `FW-${Date.now()}`,
          notes: `Flutterwave payment for ${memberName}`,
          extend: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Payment failed");

      setLoading(false);
      // Optionally redirect or show success
      window.location.href = "/dashboard/member";
    } catch (err) {
      setLoading(false);
      alert("Payment failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="btn-volt w-full px-6 py-3 text-lg font-medium tracking-wider transition"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-5 w-5 animate-spin text-white-800"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0L12 3l8 6-8 6V4z"
            />
          </svg>
          Paying…
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 7h4v10H2V7z" />
            <path d="M7 11l5 4.5 5-4.5L7 11z" />
            <path d="M7 15l5-4.5 5 4.5L7 15z" />
            <path d="M7 15l5-4.5 5 4.5L7 15z" />
          </svg>
          Pay ₦{amount.toLocaleString()}
        </span>
      )}
    </button>
  );
}