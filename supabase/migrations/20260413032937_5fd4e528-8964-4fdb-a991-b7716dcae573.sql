
-- Add alternative_mobile column
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS alternative_mobile text;

-- Create a trigger function to restrict agent updates
CREATE OR REPLACE FUNCTION public.restrict_agent_lead_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the role of the current user
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Admins and managers can update anything
  IF user_role IN ('admin', 'manager') THEN
    RETURN NEW;
  END IF;

  -- Agents can only update specific fields
  -- Revert any unauthorized field changes
  NEW.mobile := OLD.mobile;
  NEW.name := OLD.name;
  NEW.city := OLD.city;
  NEW.source := OLD.source;
  NEW.source_type := OLD.source_type;
  NEW.website_name := OLD.website_name;
  NEW.first_owner_id := OLD.first_owner_id;
  NEW.current_owner_id := OLD.current_owner_id;
  NEW.conversion_owner_id := OLD.conversion_owner_id;
  NEW.created_at := OLD.created_at;

  -- Agents CAN change: status, temperature, alternative_mobile, notes, followup_date, updated_at

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_agent_lead_restrictions
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.restrict_agent_lead_updates();

-- Allow all authenticated users to view roles (for UI role checks)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Authenticated can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);
