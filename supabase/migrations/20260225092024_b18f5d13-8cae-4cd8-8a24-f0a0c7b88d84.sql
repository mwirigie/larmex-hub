
-- Add new professional category enum values to specialization
ALTER TYPE public.specialization ADD VALUE IF NOT EXISTS 'architect';
ALTER TYPE public.specialization ADD VALUE IF NOT EXISTS 'structural_engineer';
ALTER TYPE public.specialization ADD VALUE IF NOT EXISTS 'quantity_surveyor';
ALTER TYPE public.specialization ADD VALUE IF NOT EXISTS 'site_supervisor';

-- Add starting_price and portfolio to professional_profiles
ALTER TABLE public.professional_profiles 
  ADD COLUMN IF NOT EXISTS starting_price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS portfolio jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL;

-- Add timeline to project_requests
ALTER TABLE public.project_requests 
  ADD COLUMN IF NOT EXISTS timeline text DEFAULT NULL;

-- Create portfolio-images storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for portfolio uploads
CREATE POLICY "Users can upload portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Portfolio images are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-images');

CREATE POLICY "Users can delete own portfolio images"
ON storage.objects FOR DELETE
USING (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);
