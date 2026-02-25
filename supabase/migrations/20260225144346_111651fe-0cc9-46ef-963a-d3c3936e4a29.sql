
-- Add missing columns to house_plans
ALTER TABLE public.house_plans
  ADD COLUMN IF NOT EXISTS plan_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS estimated_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS style text,
  ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0;

-- Auto-generate plan_code for existing rows
UPDATE public.house_plans SET plan_code = 'LP-' || SUBSTR(id::text, 1, 8) WHERE plan_code IS NULL;

-- Function to auto-generate plan_code on insert
CREATE OR REPLACE FUNCTION public.generate_plan_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.plan_code IS NULL OR NEW.plan_code = '' THEN
    NEW.plan_code := 'LP-' || SUBSTR(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_plan_code
  BEFORE INSERT ON public.house_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_plan_code();

-- Add is_featured column for admin control
ALTER TABLE public.house_plans
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Add download logging table
CREATE TABLE IF NOT EXISTS public.download_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.house_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address text
);

ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own downloads"
  ON public.download_logs FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert download logs"
  ON public.download_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
