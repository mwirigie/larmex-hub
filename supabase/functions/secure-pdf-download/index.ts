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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client with user's token for auth check
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const planId = url.searchParams.get("plan_id");
    if (!planId) {
      return new Response(JSON.stringify({ error: "plan_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for privileged operations
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check plan exists and get pdf_url
    const { data: plan, error: planError } = await adminClient
      .from("house_plans")
      .select("id, pdf_url, professional_id, title, download_count")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      console.error("Plan fetch error:", planError);
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!plan.pdf_url) {
      return new Response(JSON.stringify({ error: "No PDF uploaded for this plan yet" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Allow if user is the professional who uploaded it
    const isProfessional = plan.professional_id === user.id;

    // Allow if user is admin
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    // Check purchase
    let hasPurchased = false;
    if (!isProfessional && !isAdmin) {
      const { data: purchase } = await adminClient
        .from("plan_purchases")
        .select("id")
        .eq("client_id", user.id)
        .eq("plan_id", planId)
        .eq("status", "paid")
        .limit(1);

      hasPurchased = (purchase?.length || 0) > 0;
    }

    if (!isProfessional && !isAdmin && !hasPurchased) {
      return new Response(JSON.stringify({ error: "Purchase required to download this plan" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate signed URL (5 minutes)
    console.log("Generating signed URL for:", plan.pdf_url);
    const { data: signedData, error: signedError } = await adminClient.storage
      .from("plan-pdfs")
      .createSignedUrl(plan.pdf_url, 300);

    if (signedError || !signedData?.signedUrl) {
      console.error("Signed URL error:", signedError);
      return new Response(JSON.stringify({ error: "Failed to generate download link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the download
    await adminClient.from("download_logs").insert({
      plan_id: planId,
      user_id: user.id,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown",
    });

    // Increment download count directly
    await adminClient
      .from("house_plans")
      .update({ download_count: (plan.download_count || 0) + 1 })
      .eq("id", planId);

    return new Response(
      JSON.stringify({
        url: signedData.signedUrl,
        filename: `${plan.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Download error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
