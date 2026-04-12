
CREATE OR REPLACE FUNCTION public.auto_schedule_followups()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Mark old pending followups as completed
  UPDATE public.followups
  SET completed = true
  WHERE lead_id = NEW.id AND completed = false;

  IF NEW.status = 'connected' THEN
    -- Schedule at 2, 7, 14, 30 days
    INSERT INTO public.followups (lead_id, followup_date, assigned_to)
    VALUES
      (NEW.id, now() + interval '2 days', NEW.current_owner_id),
      (NEW.id, now() + interval '7 days', NEW.current_owner_id),
      (NEW.id, now() + interval '14 days', NEW.current_owner_id),
      (NEW.id, now() + interval '30 days', NEW.current_owner_id);

    -- Set next followup on lead
    UPDATE public.leads SET followup_date = now() + interval '2 days' WHERE id = NEW.id;

  ELSIF NEW.status = 'not_connected' THEN
    -- Retry at 1, 2, 3 days
    INSERT INTO public.followups (lead_id, followup_date, assigned_to)
    VALUES
      (NEW.id, now() + interval '1 day', NEW.current_owner_id),
      (NEW.id, now() + interval '2 days', NEW.current_owner_id),
      (NEW.id, now() + interval '3 days', NEW.current_owner_id);

    UPDATE public.leads SET followup_date = now() + interval '1 day' WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_schedule_followups
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_schedule_followups();
