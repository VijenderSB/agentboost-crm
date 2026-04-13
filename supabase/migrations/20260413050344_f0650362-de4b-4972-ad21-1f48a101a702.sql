
-- Add address and geo location to eye_centres
ALTER TABLE public.eye_centres
ADD COLUMN address text NOT NULL DEFAULT '',
ADD COLUMN google_maps_url text NOT NULL DEFAULT '';

-- Agent phone numbers table
CREATE TABLE public.agent_phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone_number text NOT NULL,
  label text NOT NULL DEFAULT 'Primary',
  is_whatsapp boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all agent phones"
ON public.agent_phone_numbers FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Users can manage own phones"
ON public.agent_phone_numbers FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phones"
ON public.agent_phone_numbers FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own phones"
ON public.agent_phone_numbers FOR DELETE
TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
