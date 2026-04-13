
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active templates"
ON public.whatsapp_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert templates"
ON public.whatsapp_templates FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update templates"
ON public.whatsapp_templates FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete templates"
ON public.whatsapp_templates FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_whatsapp_templates_updated_at
BEFORE UPDATE ON public.whatsapp_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default templates
INSERT INTO public.whatsapp_templates (name, category, message, sort_order) VALUES
('Introduction', 'First Contact', E'Hi {{name}}, this is {{agent}} from our team. Thank you for your interest! I''d love to help you with any questions. When would be a good time to connect?', 1),
('Eye Centre Referral', 'First Contact', E'Hi {{name}}, this is {{agent}}. Thank you for your interest in Lasik surgery! 🏥\n\nWe have scheduled your consultation at:\n\n*{{eye_centre_name}}*\n📍 {{eye_centre_address}}\n📌 Location: {{eye_centre_maps}}\n\nPlease visit the centre at your convenience. Feel free to reach out if you need any assistance!', 2),
('First Follow-up', 'Follow-up', E'Hi {{name}}, just following up on our earlier conversation. Have you had a chance to think about it? Happy to assist with any queries.', 3),
('Gentle Reminder', 'Follow-up', E'Hey {{name}}, hope you''re doing well! Just a quick reminder about our discussion. Let me know if you''d like to proceed or need more information.', 4),
('Missed Call', 'Not Connected', E'Hi {{name}}, I tried reaching you but couldn''t connect. Could you please let me know a convenient time to call? Looking forward to speaking with you.', 5),
('Special Offer', 'Promotion', E'Hi {{name}}! We have an exclusive offer running right now that I think you''d be interested in. Would you like to know more details?', 6),
('Thank You', 'Post-Conversion', E'Hi {{name}}, thank you so much for choosing us! We truly appreciate your trust. If you need anything or know someone who could benefit from our services, feel free to reach out anytime.', 7),
('Ask for Reference', 'Post-Conversion', E'Hi {{name}}, hope you''re happy with our service! If you know anyone who might benefit, we''d really appreciate a referral. Thank you!', 8);
