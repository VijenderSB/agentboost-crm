CREATE OR REPLACE FUNCTION public.assign_lead_round_robin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  agent_ids uuid[];
  agent_count int;
  current_index int;
  next_index int;
  chosen_agent uuid;
  state_id uuid;
BEGIN
  IF NEW.source_type = 'manual' THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(ur.user_id ORDER BY ur.user_id)
  INTO agent_ids
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.role = 'agent' AND p.status = 'active';

  agent_count := coalesce(array_length(agent_ids, 1), 0);
  IF agent_count = 0 THEN
    RETURN NEW;
  END IF;

  SELECT id, last_agent_index INTO state_id, current_index
  FROM public.round_robin_state LIMIT 1;

  next_index := (coalesce(current_index, 0) % agent_count) + 1;
  chosen_agent := agent_ids[next_index];

  NEW.current_owner_id := chosen_agent;
  NEW.first_owner_id := chosen_agent;

  UPDATE public.round_robin_state SET last_agent_index = next_index, updated_at = now() WHERE id = state_id;

  RETURN NEW;
END;
$function$;