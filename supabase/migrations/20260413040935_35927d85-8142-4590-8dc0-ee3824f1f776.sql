
-- Table to track every ownership change
CREATE TABLE public.lead_ownership_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ownership_history_lead ON public.lead_ownership_history(lead_id);
CREATE INDEX idx_ownership_history_owner ON public.lead_ownership_history(owner_id);

ALTER TABLE public.lead_ownership_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ownership history"
ON public.lead_ownership_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert ownership history"
ON public.lead_ownership_history FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
);

-- Trigger: on lead insert, log the first owner
-- On lead update (owner change), close the previous record and open a new one
CREATE OR REPLACE FUNCTION public.track_ownership_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.lead_ownership_history (lead_id, owner_id, started_at)
    VALUES (NEW.id, NEW.current_owner_id, now());
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.current_owner_id IS DISTINCT FROM NEW.current_owner_id THEN
    -- Close previous ownership
    UPDATE public.lead_ownership_history
    SET ended_at = now()
    WHERE lead_id = NEW.id AND ended_at IS NULL;

    -- Open new ownership
    INSERT INTO public.lead_ownership_history (lead_id, owner_id, started_at)
    VALUES (NEW.id, NEW.current_owner_id, now());
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_track_ownership_history
AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.track_ownership_history();
