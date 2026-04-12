
-- Drop old trigger and function
DROP TRIGGER IF EXISTS trg_assign_lead_round_robin ON public.leads;
DROP FUNCTION IF EXISTS public.assign_lead_round_robin();

-- BEFORE trigger: assigns agent to the lead row
CREATE OR REPLACE FUNCTION public.assign_lead_round_robin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agent_ids uuid[];
  agent_count int;
  current_index int;
  next_index int;
  chosen_agent uuid;
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

  SELECT last_agent_index INTO current_index
  FROM public.round_robin_state LIMIT 1;

  next_index := (coalesce(current_index, 0) % agent_count) + 1;
  chosen_agent := agent_ids[next_index];

  NEW.current_owner_id := chosen_agent;
  NEW.first_owner_id := chosen_agent;

  UPDATE public.round_robin_state SET last_agent_index = next_index, updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_lead_round_robin
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_lead_round_robin();

-- AFTER trigger: logs assignment
CREATE OR REPLACE FUNCTION public.log_lead_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.source_type != 'manual' THEN
    INSERT INTO public.lead_assignments (lead_id, assigned_to, assigned_by)
    VALUES (NEW.id, NEW.current_owner_id, NEW.current_owner_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_lead_assignment
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_assignment();
