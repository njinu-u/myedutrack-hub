import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { recordPaypalPayment, PAYPAL_PRICE_USD, PAYPAL_DESCRIPTION } from "@/lib/subscription.functions";
import { toast } from "sonner";
import { Lock, Sparkles, CheckCircle2 } from "lucide-react";

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: {
        style?: Record<string, unknown>;
        createOrder: (data: unknown, actions: any) => Promise<string>;
        onApprove: (data: { orderID: string }, actions: any) => Promise<void>;
        onError?: (err: unknown) => void;
        onCancel?: () => void;
      }) => { render: (sel: string | HTMLElement) => Promise<void> };
    };
  }
}

export function PaymentWall({ schoolName, mode = "expired" }: { schoolName?: string | null; mode?: "expired" | "renewal" }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const recordFn = useServerFn(recordPaypalPayment);
  const qc = useQueryClient();
  const [renderedKey, setRenderedKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const tryRender = () => {
      if (cancelled) return;
      if (!window.paypal || !containerRef.current) {
        setTimeout(tryRender, 200);
        return;
      }
      containerRef.current.innerHTML = "";
      window.paypal.Buttons({
        style: { layout: "vertical", shape: "pill", color: "gold", label: "paypal" },
        createOrder: (_data, actions) => actions.order.create({
          purchase_units: [{
            amount: { value: PAYPAL_PRICE_USD, currency_code: "USD" },
            description: PAYPAL_DESCRIPTION,
          }],
        }),
        onApprove: async (data, actions) => {
          try {
            await actions.order.capture();
            const res = await recordFn({ data: { orderId: data.orderID } });
            if (res.ok) {
              toast.success("Payment successful — welcome back!");
              await qc.invalidateQueries({ queryKey: ["subscription-status"] });
            } else {
              toast.error(res.error ?? "Could not record payment");
            }
          } catch (e: any) {
            toast.error(e?.message ?? "Payment failed");
          }
        },
        onError: (err) => {
          console.error("[PayPal]", err);
          toast.error("PayPal error — please try again");
        },
      }).render(containerRef.current).catch((e) => console.error("PayPal render", e));
    };
    tryRender();
    return () => { cancelled = true; };
  }, [recordFn, qc, renderedKey]);

  const isRenewal = mode === "renewal";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-card border border-border/70 rounded-3xl shadow-soft p-8 md:p-10">
        <div className="h-12 w-12 rounded-2xl bg-amber/15 grid place-items-center text-amber mb-5">
          <Lock className="h-6 w-6" />
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {schoolName ?? "Your school"}
        </div>
        <h1 className="font-display text-3xl md:text-4xl mt-2 tracking-tight">
          {isRenewal ? "Renew your EduTrack subscription" : "Your free pilot has ended"}
        </h1>
        <p className="text-muted-foreground mt-3">
          Unlock full access for <span className="font-semibold text-foreground">${PAYPAL_PRICE_USD}/year</span> for your entire school. One flat fee — unlimited staff, parents and students.
        </p>

        <ul className="mt-5 space-y-2 text-sm">
          {["Unlimited staff, parents & students", "Full AI co-pilot", "WhatsApp delivery & multi-language reports", "Priority support"].map((b) => (
            <li key={b} className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-teal shrink-0" /> {b}
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-2xl border bg-secondary/50 p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> {PAYPAL_DESCRIPTION}
          </div>
          <div className="font-display text-2xl mt-1">${PAYPAL_PRICE_USD} USD</div>
          <div className="text-xs text-muted-foreground">flat annual fee</div>
        </div>

        <div ref={containerRef} className="mt-5 min-h-[50px]" />
        <button
          onClick={() => setRenderedKey((k) => k + 1)}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground"
        >
          PayPal button not loading? Click to retry
        </button>
      </div>
    </div>
  );
}

export function NonAdminLockedWall({ schoolName }: { schoolName?: string | null }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border/70 rounded-3xl shadow-soft p-8 text-center">
        <div className="h-12 w-12 mx-auto rounded-2xl bg-danger/15 grid place-items-center text-danger mb-5">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl">Subscription expired</h1>
        <p className="text-muted-foreground mt-3">
          {schoolName ? `${schoolName}'s ` : "Your school's "}
          subscription has expired. Please ask your school admin to renew.
        </p>
      </div>
    </div>
  );
}

export function RenewalBanner({ days }: { days: number }) {
  return (
    <div className="rounded-2xl border border-amber/30 bg-amber/10 px-4 py-3 mb-4 text-sm text-amber-foreground flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-amber shrink-0" />
      <span>
        Your EduTrack subscription expires in <span className="font-semibold">{days} day{days === 1 ? "" : "s"}</span>. Renew now to avoid interruption.
      </span>
    </div>
  );
}
