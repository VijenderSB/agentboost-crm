
-- Settings table for configurable limits
CREATE TABLE public.wa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.wa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage wa_settings"
  ON public.wa_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and managers can view wa_settings"
  ON public.wa_settings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Seed default daily limit
INSERT INTO public.wa_settings (key, value) VALUES ('daily_message_limit', '30');

-- Campaigns table
CREATE TABLE public.wa_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  agent_id uuid NOT NULL,
  template_id uuid,
  filters jsonb NOT NULL DEFAULT '{}',
  date_from date,
  date_to date,
  status text NOT NULL DEFAULT 'draft',
  total_leads int NOT NULL DEFAULT 0,
  messages_sent int NOT NULL DEFAULT 0,
  messages_failed int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wa_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/managers can view campaigns"
  ON public.wa_campaigns FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins/managers can create campaigns"
  ON public.wa_campaigns FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins/managers can update campaigns"
  ON public.wa_campaigns FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Campaign messages table
CREATE TABLE public.wa_campaign_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.wa_campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  lead_name text NOT NULL DEFAULT '',
  lead_mobile text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wa_campaign_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/managers can view campaign messages"
  ON public.wa_campaign_messages FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins/managers can insert campaign messages"
  ON public.wa_campaign_messages FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins/managers can update campaign messages"
  ON public.wa_campaign_messages FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Trigger to auto-update updated_at on campaigns
CREATE TRIGGER update_wa_campaigns_updated_at
  BEFORE UPDATE ON public.wa_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
