import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { paypalSmokeTestVerify, PAYPAL_SMOKE_TEST_AMOUNT } from "@/lib/subscription.functions";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, XCircle, Loader2, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/admin/smoke-test")({
  head: () => ({ meta: [{ title: "PayPal Smoke Test — EduTrack" }] }),
  component: SmokeTest,
});

type Stage = "idle" | "rendering" | "awaiting_approval" | "capturing" | "verifying" | "success" | "error";

interface Report {
  environment?: string;
  orderId?: string;
  orderStatus?: string | null;
  captureId?: string | null;
  captureStatus?: string | null;
  amount?: string | null;
  currency?: string | null;
  payerEmail?: string | null;
  payerId?: string | null;
}

function SmokeTest() {
  const auth = useAuth();
  const verify = useServerFn(paypalSmokeTestVerify);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  const isOwner = auth.appUser?.role === "super_admin";

  useEffect(() => {
    if (!isOwner) return;
    if (stage === "success" || stage === "error") return;
    let cancelled = false;
    setStage("rendering");

    const tryRender = () => {
      if (cancelled) return;
      if (!window.paypal || !containerRef.current) {
        setTimeout(tryRender, 200);
        return;
      }
      containerRef.current.innerHTML = "";
      window.paypal.Buttons({
        style: { layout: "vertical", shape: "pill", color: "blue", label: "paypal" },
        createOrder: (_d, actions) => {
          setStage("awaiting_approval");
          return actions.order.create({
            purchase_units: [{
              amount: { value: PAYPAL_SMOKE_TEST_AMOUNT, currency_code: "USD" },
              description: "EduTrack — $1 live smoke test",
            }],
          });
        },
        onApprove: async (data, actions) => {
          try {
            setStage("capturing");
            await actions.order.capture();
            setStage("verifying");
            const res = await verify({ data: { orderId: data.orderID } });
            if (res.ok) {
              setReport(res.report);
              setStage("success");
            } else {
              setErrorMsg(`[${res.stage}] ${res.error}`);
              setReport((res as { report?: Report }).report ?? null);
              setStage("error");
            }
          } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : "Capture failed");
            setStage("error");
          }
        },
        onCancel: () => {
          setErrorMsg("Buyer cancelled before approving.");
          setStage("error");
        },
        onError: (err) => {
          console.error("[PayPal smoke]", err);
          setErrorMsg("PayPal SDK error — see console.");
          setStage("error");
        },
      }).render(containerRef.current).catch((e) => console.error(e));
    };
    tryRender();
    return () => { cancelled = true; };
  }, [isOwner, verify, renderKey, stage]);

  const reset = () => {
    setStage("idle");
    setErrorMsg(null);
    setReport(null);
    setRenderKey((k) => k + 1);
  };

  if (!isOwner) {
    return (
      <div className="p-8 max-w-xl">
        <h1 className="font-display text-2xl">Restricted</h1>
        <p className="text-muted-foreground mt-2">This $1 live smoke test is only available to the website owner.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber/15 grid place-items-center text-amber">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl tracking-tight">PayPal Live Smoke Test</h1>
          <p className="text-xs text-muted-foreground">${PAYPAL_SMOKE_TEST_AMOUNT} USD — create → approve → capture → verify</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-5">
        <ul className="text-sm space-y-1.5 text-muted-foreground">
          <li>1. PayPal Buttons render below.</li>
          <li>2. Click PayPal, sign in with a <em>real</em> PayPal account, approve the $1 charge.</li>
          <li>3. SDK captures; server re-verifies the order against PayPal's API.</li>
          <li>4. Result with capture ID and payer email appears below.</li>
        </ul>

        {(stage === "rendering" || stage === "idle" || stage === "awaiting_approval") && (
          <div ref={containerRef} key={renderKey} className="mt-4 min-h-[50px]" />
        )}

        {(stage === "capturing" || stage === "verifying") && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {stage === "capturing" ? "Capturing payment…" : "Verifying with PayPal API…"}
          </div>
        )}

        {stage === "success" && report && (
          <div className="mt-4 rounded-xl border border-teal/40 bg-teal/10 p-4">
            <div className="flex items-center gap-2 font-semibold text-teal">
              <CheckCircle2 className="h-5 w-5" /> Payment captured & verified
            </div>
            <ReportTable r={report} />
            <button onClick={reset} className="mt-3 text-xs underline">Run again</button>
          </div>
        )}

        {stage === "error" && (
          <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-4">
            <div className="flex items-center gap-2 font-semibold text-danger">
              <XCircle className="h-5 w-5" /> Smoke test failed
            </div>
            <p className="mt-2 text-sm">{errorMsg}</p>
            {report && <ReportTable r={report} />}
            <button onClick={reset} className="mt-3 text-xs underline">Try again</button>
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Note: a real $1 USD charge is made and captured to your live PayPal merchant account. Refund manually in PayPal if needed.
      </p>
    </div>
  );
}

function ReportTable({ r }: { r: Report }) {
  const rows: [string, string | null | undefined][] = [
    ["Environment", r.environment],
    ["Order ID", r.orderId],
    ["Order status", r.orderStatus],
    ["Capture ID", r.captureId],
    ["Capture status", r.captureStatus],
    ["Amount", r.amount ? `${r.amount} ${r.currency ?? ""}` : null],
    ["Payer email", r.payerEmail],
    ["Payer ID", r.payerId],
  ];
  return (
    <table className="mt-3 text-xs w-full">
      <tbody>
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <tr key={k} className="border-t border-border/50">
            <td className="py-1.5 pr-3 text-muted-foreground">{k}</td>
            <td className="py-1.5 font-mono break-all">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
