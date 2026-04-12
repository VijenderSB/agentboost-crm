import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const agents = [
    { email: "agent1@leadcrm.com", password: "Agent1234!", name: "Agent One" },
    { email: "agent2@leadcrm.com", password: "Agent2345!", name: "Agent Two" },
  ];

  const results = [];
  for (const agent of agents) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: agent.email,
      password: agent.password,
      email_confirm: true,
      user_metadata: { name: agent.name },
    });
    results.push({ email: agent.email, id: data?.user?.id, error: error?.message });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
});
