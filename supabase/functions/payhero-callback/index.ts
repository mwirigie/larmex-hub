import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("PayHero callback received:", JSON.stringify(body));

    const externalReference = body.external_reference || body.ExternalReference;
    const status = body.status || body.Status;

    if (!externalReference) {
      console.error("No reference in callback");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Determine status
    const isSuccess =
      status === "SUCCESS" ||
      status === "success" ||
      body.ResultCode === 0 ||
      body.result_code === 0;

    const newStatus = isSuccess ? "completed" : "failed";

    // Update payment
    const { data: payment, error: updateError } = await adminClient
      .from("payments")
      .update({ status: newStatus })
      .eq("reference", externalReference)
      .select("id, user_id, plan_id, amount, reference")
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // If successful, create plan_purchase record to grant access
    if (isSuccess && payment) {
      const { error: purchaseError } = await adminClient.from("plan_purchases").insert({
        client_id: payment.user_id,
        plan_id: payment.plan_id,
        amount_kes: payment.amount,
        status: "paid",
        payment_method: "mpesa",
        payment_reference: payment.reference,
      });

      if (purchaseError) {
        console.error("Purchase insert error:", purchaseError);
      }

      // Also create transaction record
      await adminClient.from("transactions").insert({
        user_id: payment.user_id,
        type: "plan_purchase",
        amount_kes: payment.amount,
        commission_kes: Math.round(Number(payment.amount) * 0.1),
        status: "completed",
        reference: payment.reference,
        metadata: { plan_id: payment.plan_id },
      });
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Callback error:", err);
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
