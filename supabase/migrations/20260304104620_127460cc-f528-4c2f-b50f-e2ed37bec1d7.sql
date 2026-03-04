
-- Fix overly permissive update policy
DROP POLICY "Service can update payments" ON public.payments;

-- Only allow updates by admin or the payment owner
CREATE POLICY "Admins and owners can update payments"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
