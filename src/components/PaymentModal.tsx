import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, XCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planTitle: string;
  planId: string;
  amount: number;
  onSuccess: () => void;
}

type PaymentState = "input" | "waiting" | "success" | "failed";

export default function PaymentModal({ open, onOpenChange, planTitle, planId, amount, onSuccess }: PaymentModalProps) {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<PaymentState>("input");
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const referenceRef = useRef<string>("");
  const { toast } = useToast();

  // Cleanup polling on unmount or close
  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      setState("input");
      setError("");
      setPhone("");
      referenceRef.current = "";
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open]);

  const formatPhone = (raw: string): string => {
    let p = raw.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
    if (p.startsWith("+254")) p = "254" + p.slice(4);
    if (p.startsWith("0")) p = "254" + p.slice(1);
    if (p.startsWith("7") && p.length === 9) p = "254" + p;
    return p;
  };

  const handleInitiate = async () => {
    setError("");
    const formatted = formatPhone(phone);

    if (!/^2547\d{8}$/.test(formatted)) {
      setError("Enter a valid Safaricom number (e.g. 0712345678)");
      return;
    }

    setState("waiting");

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/payhero-initiate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone: formatted, amount, plan_id: planId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setState("input");
        setError(data.error || "Failed to send STK push");
        return;
      }

      referenceRef.current = data.reference;

      // Start polling
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        if (attempts > 60) {
          // 5 min timeout
          if (pollRef.current) clearInterval(pollRef.current);
          setState("failed");
          setError("Payment timed out. Check your M-Pesa messages.");
          return;
        }

        try {
          const statusRes = await fetch(
            `https://${projectId}.supabase.co/functions/v1/payhero-status?reference=${referenceRef.current}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
            }
          );
          const statusData = await statusRes.json();

          if (statusData.status === "completed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setState("success");
            toast({ title: "Payment successful!", description: "You can now download the plan." });
            setTimeout(() => {
              onSuccess();
              onOpenChange(false);
            }, 2000);
          } else if (statusData.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setState("failed");
            setError("Payment was not completed. Please try again.");
          }
        } catch {
          // continue polling
        }
      }, 5000);
    } catch {
      setState("input");
      setError("Network error. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Pay with M-Pesa</DialogTitle>
          <DialogDescription>Purchase: {planTitle}</DialogDescription>
        </DialogHeader>

        {state === "input" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-display text-2xl font-bold text-foreground">
                KES {amount.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Safaricom Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  type="tel"
                  maxLength={13}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <Button className="w-full" size="lg" onClick={handleInitiate}>
              Pay KES {amount.toLocaleString()}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              An STK push will be sent to your phone. Enter your M-Pesa PIN to confirm.
            </p>
          </div>
        )}

        {state === "waiting" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Waiting for M-Pesa confirmation…</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check your phone and enter your M-Pesa PIN
              </p>
            </div>
          </div>
        )}

        {state === "success" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Payment Successful!</p>
              <p className="mt-1 text-sm text-muted-foreground">You can now download the plan PDF.</p>
            </div>
          </div>
        )}

        {state === "failed" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <XCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Payment Failed</p>
              <p className="mt-1 text-sm text-destructive">{error}</p>
            </div>
            <Button variant="outline" onClick={() => { setState("input"); setError(""); }}>
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
