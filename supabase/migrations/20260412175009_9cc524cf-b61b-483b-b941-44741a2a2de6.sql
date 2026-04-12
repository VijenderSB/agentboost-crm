
CREATE OR REPLACE FUNCTION public.reshuffle_leads(_triggered_by uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agent_ids uuid[];
  agent_count int;
  lead_rec record;
  idx int := 0;
  reshuffled int := 0;
BEGIN
  -- Get active agents
  SELECT array_agg(ur.user_id ORDER BY ur.user_id)
  INTO agent_ids
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.role = 'agent' AND p.status = 'active';

  agent_count := coalesce(array_length(agent_ids, 1), 0);
  IF agent_count < 2 THEN
    RETURN 0; -- Need at least 2 agents to reshuffle
  END IF;

  FOR lead_rec IN
    SELECT id, current_owner_id
    FROM public.leads
    WHERE temperature IN ('warm', 'cold')
    ORDER BY created_at
  LOOP
    idx := idx + 1;
    DECLARE
      new_owner uuid := agent_ids[((idx - 1) % agent_count) + 1];
    BEGIN
      IF new_owner != lead_rec.current_owner_id THEN
        UPDATE public.leads SET current_owner_id = new_owner WHERE id = lead_rec.id;
        INSERT INTO public.lead_assignments (lead_id, assigned_to, assigned_by)
        VALUES (lead_rec.id, new_owner, _triggered_by);
        reshuffled := reshuffled + 1;
      END IF;
    END;
  END LOOP;

  RETURN reshuffled;
END;
$$;
