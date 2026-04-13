import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Use a system UUID as the triggered_by since this is automated
  const systemId = "00000000-0000-0000-0000-000000000000";

  const { data, error } = await supabase.rpc("reshuffle_leads", {
    _triggered_by: systemId,
  });

  if (error) {
    console.error("Reshuffle error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`Auto-reshuffle completed: ${data} leads reshuffled`);
  return new Response(JSON.stringify({ reshuffled: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
