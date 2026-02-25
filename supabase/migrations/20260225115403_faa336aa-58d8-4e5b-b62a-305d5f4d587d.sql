
CREATE OR REPLACE FUNCTION public.get_completed_project_count(_professional_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer FROM public.project_requests
  WHERE professional_id = _professional_id AND status = 'completed';
$$;
