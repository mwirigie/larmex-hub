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

    // PayHero sends nested format: { status: true, response: { ExternalReference, Status, ResultCode, ... } }
    // Also handle flat format as fallback
    const response = body.response || body;
    
    const externalReference =
      response.ExternalReference ||
      response.external_reference ||
      body.ExternalReference ||
      body.external_reference;

    const status =
      response.Status ||
      response.status ||
      body.Status ||
      body.status;

    const resultCode =
      response.ResultCode ??
      response.result_code ??
      body.ResultCode ??
      body.result_code;

    console.log("Parsed - reference:", externalReference, "status:", status, "resultCode:", resultCode);

    if (!externalReference || typeof externalReference !== "string") {
      console.error("No valid reference in callback");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Determine success: Status === "Success" OR ResultCode === 0
    const isSuccess =
      status === "Success" ||
      status === "SUCCESS" ||
      status === "success" ||
      resultCode === 0;

    const newStatus = isSuccess ? "completed" : "failed";
    console.log("Determined payment status:", newStatus);

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

    console.log("Payment updated:", payment?.id, "to", newStatus);

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
      } else {
        console.log("Plan purchase created for user:", payment.user_id);
      }

      // Also create transaction record
      const { error: txError } = await adminClient.from("transactions").insert({
        user_id: payment.user_id,
        type: "plan_purchase",
        amount_kes: payment.amount,
        commission_kes: Math.round(Number(payment.amount) * 0.1),
        status: "completed",
        reference: payment.reference,
        metadata: { plan_id: payment.plan_id },
      });

      if (txError) {
        console.error("Transaction insert error:", txError);
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Callback error:", err);
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
