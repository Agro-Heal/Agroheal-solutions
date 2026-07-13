import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    const normalizedUserId = String(user_id || "").trim();

    if (!normalizedUserId) {
      return new Response(
        JSON.stringify({ success: false, message: "User id is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error } = await supabase.auth.admin.getUserById(
      normalizedUserId,
    );

    if (error) {
      throw error;
    }

    const resolvedEmail = userData?.user?.email;

    if (!resolvedEmail) {
      return new Response(
        JSON.stringify({ success: false, message: "No email was found for that user id." }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, email: resolvedEmail }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Failed to resolve email by user id", error);
    return new Response(
      JSON.stringify({ success: false, message: "Unable to resolve email by user id." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
