
-- Table to track round-robin position
CREATE TABLE public.round_robin_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_agent_index int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.round_robin_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage round_robin_state"
  ON public.round_robin_state FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Seed single row
INSERT INTO public.round_robin_state (last_agent_index) VALUES (0);

-- Function: auto-assign lead via round-robin
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
  -- If lead already has an owner explicitly set and it's not the inserting user's own id,
  -- skip auto-assignment (manual assignment)
  -- We only auto-assign when source_type != 'manual'
  IF NEW.source_type = 'manual' THEN
    RETURN NEW;
  END IF;

  -- Get active agents ordered consistently
  SELECT array_agg(ur.user_id ORDER BY ur.user_id)
  INTO agent_ids
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.role = 'agent' AND p.status = 'active';

  agent_count := coalesce(array_length(agent_ids, 1), 0);

  IF agent_count = 0 THEN
    RETURN NEW;
  END IF;

  -- Get current index
  SELECT last_agent_index INTO current_index
  FROM public.round_robin_state
  LIMIT 1;

  next_index := (coalesce(current_index, 0) % agent_count) + 1;
  chosen_agent := agent_ids[next_index];

  -- Assign to the lead
  NEW.current_owner_id := chosen_agent;
  NEW.first_owner_id := chosen_agent;

  -- Update counter
  UPDATE public.round_robin_state SET last_agent_index = next_index, updated_at = now();

  -- Log assignment
  INSERT INTO public.lead_assignments (lead_id, assigned_to, assigned_by)
  VALUES (NEW.id, chosen_agent, chosen_agent);

  RETURN NEW;
END;
$$;

-- Trigger: runs before insert on leads
CREATE TRIGGER trg_assign_lead_round_robin
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_lead_round_robin();
