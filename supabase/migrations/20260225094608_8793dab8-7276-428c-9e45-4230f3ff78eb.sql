
-- Update handle_new_user to also assign roles and create professional profiles from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role text;
  _categories jsonb;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );

  -- Assign role from metadata
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role::app_role);

  -- If professional, create professional profile with specializations
  IF _role = 'professional' THEN
    _categories := NEW.raw_user_meta_data->'categories';
    INSERT INTO public.professional_profiles (user_id, specializations)
    VALUES (
      NEW.id,
      CASE 
        WHEN _categories IS NOT NULL AND jsonb_array_length(_categories) > 0 
        THEN (SELECT array_agg(elem::text::specialization) FROM jsonb_array_elements_text(_categories) AS elem)
        ELSE '{}'::specialization[]
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Fix the existing user who registered as professional but has no role
INSERT INTO public.user_roles (user_id, role)
VALUES ('774bda5e-2707-43f3-ab6a-02c5676ff49c', 'professional')
ON CONFLICT DO NOTHING;

-- Create professional profile if missing
INSERT INTO public.professional_profiles (user_id, specializations)
VALUES ('774bda5e-2707-43f3-ab6a-02c5676ff49c', '{architect,quantity_surveyor,structural_engineer,site_supervisor}'::specialization[])
ON CONFLICT DO NOTHING;
