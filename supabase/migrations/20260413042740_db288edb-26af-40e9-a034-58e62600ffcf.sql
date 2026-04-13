
-- Eye Centres master table
CREATE TABLE public.eye_centres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.eye_centres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view eye centres"
  ON public.eye_centres FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins/managers can manage eye centres"
  ON public.eye_centres FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Junction table: leads <-> eye centres
CREATE TABLE public.lead_eye_centres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  eye_centre_id UUID NOT NULL REFERENCES public.eye_centres(id) ON DELETE CASCADE,
  referred_by UUID NOT NULL,
  referred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (lead_id, eye_centre_id)
);

ALTER TABLE public.lead_eye_centres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view lead eye centres"
  ON public.lead_eye_centres FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert lead eye centres"
  ON public.lead_eye_centres FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins/managers can delete lead eye centres"
  ON public.lead_eye_centres FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE INDEX idx_lead_eye_centres_lead ON public.lead_eye_centres(lead_id);
CREATE INDEX idx_lead_eye_centres_centre ON public.lead_eye_centres(eye_centre_id);
CREATE INDEX idx_eye_centres_city ON public.eye_centres(city);
