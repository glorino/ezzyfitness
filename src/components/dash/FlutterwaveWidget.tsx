"use client";

import { useState, useEffect } from "react";

declare global {
  interface Window {
    FlutterwaveCheckout?: (config: Record<string, unknown>) => void;
  }
}

/**
 * Flutterwave payment button for member self-service payments.
 * Opens Flutterwave Inline Checkout, then records payment on success.
 */
export function FlutterwavePayButton({
  memberId,
  memberName,
  amount,
  planName,
  planId,
  email,
  phone,
}: {
  memberId: number;
  memberName: string;
  amount: number;
  planName: string;
  planId?: number | null;
  email?: string;
  phone?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (window.FlutterwaveCheckout) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setError("Failed to load payment system");
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const recordPayment = async (txRef: string, flwRef: string) => {
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          planId,
          amount,
          method: "card",
          reference: txRef,
          notes: `Flutterwave:${flwRef} member_id:${memberId} plan_id:${planId || 0}`,
          extend: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Payment recorded but membership update failed");
        return false;
      }
      return true;
    } catch {
      setError("Payment received but could not update membership. Contact support.");
      return false;
    }
  };

  const handlePay = () => {
    if (!scriptLoaded || !window.FlutterwaveCheckout) {
      setError("Payment system not ready. Please refresh and try again.");
      return;
    }

    setLoading(true);
    setError(null);

    window.FlutterwaveCheckout({
      public_key: process.env.NEXT_PUBLIC_FLW_PUB_KEY || "",
      tx_ref: `EZZY-${Date.now()}-${memberId}`,
      amount: amount,
      currency: "NGN",
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: email || "member@ezzyfitness.com",
        phonenumber: phone || "",
        name: memberName,
      },
      customizations: {
        title: "Ezzy Fitness",
        description: `Payment for ${planName}`,
        logo: "/logo-white.png",
      },
      meta: {
        member_id: memberId,
        plan_id: planId || 0,
        note: `member_id:${memberId} plan_id:${planId || 0}`,
      },
      callback: async (response: { status: string; tx_ref: string; flw_ref: string }) => {
        setLoading(false);
        if (response.status === "successful") {
          const recorded = await recordPayment(response.tx_ref, response.flw_ref);
          if (recorded) {
            window.location.href = "/dashboard/member/membership";
          }
        } else {
          setError("Payment was not completed. Please try again.");
        }
      },
      onclose: () => {
        setLoading(false);
      },
    });
  };

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading || !scriptLoaded}
        className="btn-volt w-full px-6 py-3 text-lg font-medium tracking-wider transition"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-5 w-5 animate-spin text-white"
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
            Opening checkout...
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
            {scriptLoaded ? `Pay ₦${amount.toLocaleString()}` : "Loading..."}
          </span>
        )}
      </button>
      {error && (
        <p className="mt-2 rounded-xl border border-ember/40 bg-ember/10 px-4 py-2 text-sm text-ember">
          {error}
        </p>
      )}
    </div>
  );
}
