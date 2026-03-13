
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role text;
  _categories jsonb;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );

  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role::app_role);

  IF _role = 'professional' THEN
    _categories := NEW.raw_user_meta_data->'categories';
    INSERT INTO public.professional_profiles (user_id, specializations, verification_status, is_verified)
    VALUES (
      NEW.id,
      CASE 
        WHEN _categories IS NOT NULL AND jsonb_array_length(_categories) > 0 
        THEN (SELECT array_agg(elem::text::specialization) FROM jsonb_array_elements_text(_categories) AS elem)
        ELSE '{}'::specialization[]
      END,
      'approved'::verification_status,
      true
    );
  END IF;

  RETURN NEW;
END;
$function$;
