import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub;

    const url = new URL(req.url);
    const profileId = url.searchParams.get("id");
    const action = url.searchParams.get("action") || "get";

    // Use service role client for security definer function calls
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "list") {
      const { data, error } = await adminClient.rpc("list_public_profiles");
      if (error) throw error;
      return new Response(JSON.stringify({ profiles: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get" && profileId) {
      // If requesting own profile, return full data
      if (profileId === callerId) {
        const { data, error } = await adminClient
          .from("profiles")
          .select("*")
          .eq("id", callerId)
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ profile: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For other profiles, use privacy-respecting function
      const { data, error } = await adminClient.rpc("get_public_profile", {
        _profile_id: profileId,
      });
      if (error) throw error;
      return new Response(
        JSON.stringify({ profile: data?.[0] || null }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Audit log for profile access
    await adminClient.from("audit_logs").insert({
      user_id: callerId,
      action_type: "profile_access",
      resource_type: "profile",
      resource_id: profileId || "list",
    });

    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
