import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // Parse body
    const { phone, amount, plan_id } = await req.json();

    // Validate phone (must be 2547XXXXXXXX format, 12 digits)
    const phoneRegex = /^2547\d{8}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone. Use format 2547XXXXXXXX" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Amount must be greater than 0" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!plan_id) {
      return new Response(
        JSON.stringify({ error: "plan_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate reference
    const reference = `LMX-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Save pending payment using service role for insert
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: insertError } = await adminClient.from("payments").insert({
      user_id: userId,
      phone,
      amount,
      reference,
      plan_id,
      status: "pending",
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create payment record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call PayHero STK Push
    const channelId = Deno.env.get("PAYHERO_CHANNEL_ID");
    const basicAuth = Deno.env.get("PAYHERO_BASIC_AUTH");

    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/payhero-callback`;

    const payheroResponse = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
      method: "POST",
      headers: {
        Authorization: basicAuth!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(amount),
        phone_number: phone,
        channel_id: Number(channelId),
        provider: "m-pesa",
        external_reference: reference,
        callback_url: callbackUrl,
      }),
    });

    const payheroData = await payheroResponse.json();

    if (!payheroResponse.ok) {
      console.error("PayHero error:", payheroData);
      // Update payment status to failed
      await adminClient.from("payments").update({ status: "failed" }).eq("reference", reference);
      return new Response(
        JSON.stringify({ error: "Failed to initiate STK push. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store payhero reference if available
    if (payheroData?.reference) {
      await adminClient
        .from("payments")
        .update({ payhero_reference: String(payheroData.reference) })
        .eq("reference", reference);
    }

    return new Response(
      JSON.stringify({ success: true, message: "STK push sent", reference }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Initiate error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
