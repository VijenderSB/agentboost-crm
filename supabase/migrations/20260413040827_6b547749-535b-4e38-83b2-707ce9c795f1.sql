
CREATE OR REPLACE FUNCTION public.set_conversion_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- When temperature changes to 'success', record who did it
  IF NEW.temperature = 'success' AND (OLD.temperature IS DISTINCT FROM 'success') THEN
    NEW.conversion_owner_id := auth.uid();
  END IF;

  -- Clear conversion_owner if temperature changed away from success
  IF OLD.temperature = 'success' AND NEW.temperature != 'success' THEN
    NEW.conversion_owner_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_conversion_owner
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.set_conversion_owner();
