
-- Notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  lead_id uuid,
  link text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read) WHERE read = false;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify agent on lead assignment/reassignment
CREATE OR REPLACE FUNCTION public.notify_lead_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_name text;
BEGIN
  -- Only fire when owner actually changed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.current_owner_id IS DISTINCT FROM NEW.current_owner_id) THEN
    lead_name := COALESCE(NULLIF(NEW.name, ''), NEW.mobile);
    INSERT INTO public.notifications (user_id, type, title, message, lead_id, link)
    VALUES (
      NEW.current_owner_id,
      'new_lead',
      'New Lead Assigned',
      'You have been assigned lead: ' || lead_name,
      NEW.id,
      '/leads/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lead_assigned
  AFTER INSERT OR UPDATE OF current_owner_id ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_lead_assigned();

-- Trigger: notify on overdue followup (marks as overdue and notifies)
CREATE OR REPLACE FUNCTION public.notify_overdue_followups()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a followup becomes overdue (followup_date in the past, not completed)
  -- This is called on update; we check if it's still not completed and past due
  IF NEW.completed = false AND NEW.followup_date < now() THEN
    INSERT INTO public.notifications (user_id, type, title, message, lead_id, link)
    SELECT
      NEW.assigned_to,
      'overdue_followup',
      'Overdue Follow-up',
      'You have an overdue follow-up for lead due on ' || to_char(NEW.followup_date, 'Mon DD, YYYY'),
      NEW.lead_id,
      '/leads/' || NEW.lead_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE lead_id = NEW.lead_id
        AND user_id = NEW.assigned_to
        AND type = 'overdue_followup'
        AND created_at > now() - interval '1 day'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_followup_overdue
  AFTER UPDATE ON public.followups
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_overdue_followups();
