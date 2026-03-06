
CREATE OR REPLACE FUNCTION public.get_professional_sales_stats(_professional_id uuid)
RETURNS TABLE(total_sales bigint, total_earnings numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    COUNT(*)::bigint AS total_sales,
    COALESCE(SUM(pp.amount_kes), 0)::numeric AS total_earnings
  FROM public.plan_purchases pp
  INNER JOIN public.house_plans hp ON hp.id = pp.plan_id
  WHERE hp.professional_id = _professional_id
    AND pp.status = 'paid';
$$;
