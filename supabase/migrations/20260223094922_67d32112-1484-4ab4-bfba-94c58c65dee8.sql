
-- Create storage buckets for plan files and verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('plan-images', 'plan-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('plan-pdfs', 'plan-pdfs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false);

-- Public read access for plan images
CREATE POLICY "Anyone can view plan images"
ON storage.objects FOR SELECT
USING (bucket_id = 'plan-images');

-- Professionals can upload plan images
CREATE POLICY "Professionals can upload plan images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'plan-images' AND auth.uid() IS NOT NULL);

-- Professionals can delete own plan images
CREATE POLICY "Users can delete own plan images"
ON storage.objects FOR DELETE
USING (bucket_id = 'plan-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Only purchasers access PDFs (handled via edge function), professionals can upload
CREATE POLICY "Professionals can upload plan PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'plan-pdfs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can read own uploaded PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'plan-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatar policies
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Verification docs - professionals upload, admins read
CREATE POLICY "Professionals can upload verification docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'verification-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own verification docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
