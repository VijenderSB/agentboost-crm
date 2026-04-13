
CREATE OR REPLACE FUNCTION public.restrict_agent_lead_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role text;
  current_uid uuid;
BEGIN
  current_uid := auth.uid();
  
  -- Allow system/migration updates (no authenticated user)
  IF current_uid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the role of the current user
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = current_uid
  LIMIT 1;

  -- Admins and managers can update anything
  IF user_role IN ('admin', 'manager') THEN
    RETURN NEW;
  END IF;

  -- Agents can only update specific fields
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

  RETURN NEW;
END;
$$;
