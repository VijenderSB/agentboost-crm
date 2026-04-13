
-- Drop existing write policies
DROP POLICY IF EXISTS "Users can manage own phones" ON public.agent_phone_numbers;
DROP POLICY IF EXISTS "Users can update own phones" ON public.agent_phone_numbers;
DROP POLICY IF EXISTS "Users can delete own phones" ON public.agent_phone_numbers;

-- Only admin can insert
CREATE POLICY "Admins can insert agent phones"
ON public.agent_phone_numbers FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admin can update
CREATE POLICY "Admins can update agent phones"
ON public.agent_phone_numbers FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admin can delete
CREATE POLICY "Admins can delete agent phones"
ON public.agent_phone_numbers FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
