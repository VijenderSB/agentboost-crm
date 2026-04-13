import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const WEBSITE_MAP: Record<string, string> = {
  "lasikindelhi.com": "Lasik in Delhi",
  "www.lasikindelhi.com": "Lasik in Delhi",
  "laser.fyi": "Laser FYI",
  "www.laser.fyi": "Laser FYI",
  "lasikinpune.com": "Lasik in Pune",
  "www.lasikinpune.com": "Lasik in Pune",
  "lasikinmumbai.com": "Lasik in Mumbai",
  "www.lasikinmumbai.com": "Lasik in Mumbai",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();

    // Validate required fields
    const mobile = (body.mobile || body.phone || body.contact || "").toString().replace(/\D/g, "").slice(-10);
    if (!mobile || mobile.length < 10) {
      return new Response(JSON.stringify({ error: "Valid mobile number is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine source from the request
    const sourceRaw = (body.source || "query_form").toLowerCase();
    const sourceMap: Record<string, string> = {
      form: "query_form",
      query_form: "query_form",
      whatsapp: "whatsapp",
      wa: "whatsapp",
      chat: "chat",
      tawk: "chat",
      "tawk.to": "chat",
      tawkto: "chat",
      ivr: "ivr",
      call: "ivr",
      justdial: "justdial",
      indiamart: "indiamart",
      google_business: "google_business",
      practo: "practo",
      facebook: "facebook",
      instagram: "instagram",
      whatsapp_ads: "whatsapp_ads",
      reference: "reference",
      walkin: "walkin",
    };
    const source = sourceMap[sourceRaw] || "query_form";

    // Determine website name from domain or explicit field
    const domain = (body.domain || body.website || body.origin || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
    const websiteName = WEBSITE_MAP[domain] || body.website_name || domain || null;

    // Determine city from website or explicit field
    let city = body.city || "";
    if (!city && domain) {
      if (domain.includes("delhi")) city = "Delhi";
      else if (domain.includes("pune")) city = "Pune";
      else if (domain.includes("mumbai")) city = "Mumbai";
    }

    // Check for duplicate by mobile number (within last 30 days)
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("mobile", mobile)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (existing && existing.length > 0) {
      // Add activity to existing lead instead of creating duplicate
      await supabase.from("lead_activities").insert({
        lead_id: existing[0].id,
        user_id: existing[0].id, // system
        activity_type: "duplicate_inquiry",
        remarks: `Duplicate inquiry from ${websiteName || source}. Name: ${body.name || "N/A"}`,
      });

      return new Response(JSON.stringify({ 
        status: "duplicate", 
        lead_id: existing[0].id,
        message: "Lead already exists, activity logged" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get a fallback owner (first active agent) - round-robin trigger will override
    const { data: agents } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "agent")
      .limit(1);

    const fallbackOwner = agents?.[0]?.user_id;
    if (!fallbackOwner) {
      return new Response(JSON.stringify({ error: "No agents available" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert lead - round-robin trigger will auto-assign
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        mobile,
        alternative_mobile: body.alternative_mobile || null,
        name: body.name || "",
        city,
        source,
        source_type: "auto",
        website_name: websiteName,
        status: "fresh",
        temperature: "warm",
        current_owner_id: fallbackOwner,
        first_owner_id: fallbackOwner,
        notes: body.notes || body.message || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "created", lead_id: lead.id }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
