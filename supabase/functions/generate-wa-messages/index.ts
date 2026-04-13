import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { leads, templateMessage, agentName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      throw new Error("No leads provided");
    }

    const systemPrompt = `You are a WhatsApp message writer for a Lasik eye surgery clinic. 
Your job is to create UNIQUE variations of a template message for each lead.

RULES:
- Each message must convey the SAME intent as the template but use DIFFERENT wording
- Messages should feel personal and natural, not like bulk messages
- Keep the same emoji style and tone as the template
- Use the lead's name naturally in the message
- Agent name should be included
- Keep messages concise (similar length to template)
- Do NOT use any markdown or special formatting
- Messages should be in the same language as the template
- Each message MUST be distinctly different from others

You will receive a list of leads and must generate one unique message per lead.
Return a JSON array of objects with "lead_id" and "message" fields.`;

    const userPrompt = `Template message:
"""
${templateMessage}
"""

Agent name: ${agentName}

Generate unique WhatsApp messages for these ${leads.length} leads:
${leads.map((l: any, i: number) => `${i + 1}. Lead ID: ${l.id}, Name: ${l.name || 'there'}`).join('\n')}

Return ONLY a valid JSON array like:
[{"lead_id": "...", "message": "..."}, ...]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_messages",
              description: "Return the generated unique messages for each lead",
              parameters: {
                type: "object",
                properties: {
                  messages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        lead_id: { type: "string" },
                        message: { type: "string" },
                      },
                      required: ["lead_id", "message"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["messages"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_messages" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    
    return new Response(JSON.stringify({ messages: parsed.messages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-wa-messages error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
