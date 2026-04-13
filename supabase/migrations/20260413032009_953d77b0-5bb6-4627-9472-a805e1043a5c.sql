
CREATE OR REPLACE FUNCTION public.reshuffle_leads(_triggered_by uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  all_agent_ids uuid[];
  lead_rec record;
  eligible_agents uuid[];
  agent_count int;
  idx int;
  reshuffled int := 0;
BEGIN
  -- Get all active agents
  SELECT array_agg(ur.user_id ORDER BY ur.user_id)
  INTO all_agent_ids
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.role = 'agent' AND p.status = 'active';

  IF coalesce(array_length(all_agent_ids, 1), 0) < 2 THEN
    RETURN 0;
  END IF;

  -- Only warm/cold leads older than 30 days
  FOR lead_rec IN
    SELECT id, current_owner_id
    FROM public.leads
    WHERE temperature IN ('warm', 'cold')
      AND created_at < now() - interval '30 days'
    ORDER BY created_at
  LOOP
    -- Build list of agents excluding current owner
    eligible_agents := ARRAY(
      SELECT unnest FROM unnest(all_agent_ids)
      WHERE unnest != lead_rec.current_owner_id
    );
    agent_count := coalesce(array_length(eligible_agents, 1), 0);

    IF agent_count = 0 THEN
      CONTINUE;
    END IF;

    -- Round-robin among eligible agents
    reshuffled := reshuffled + 1;
    idx := ((reshuffled - 1) % agent_count) + 1;

    UPDATE public.leads
    SET current_owner_id = eligible_agents[idx]
    WHERE id = lead_rec.id;

    INSERT INTO public.lead_assignments (lead_id, assigned_to, assigned_by)
    VALUES (lead_rec.id, eligible_agents[idx], _triggered_by);
  END LOOP;

  RETURN reshuffled;
END;
$function$;
