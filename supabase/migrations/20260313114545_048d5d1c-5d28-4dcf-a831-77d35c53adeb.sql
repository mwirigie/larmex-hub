CREATE POLICY "Admins can delete plans"
ON public.house_plans
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));