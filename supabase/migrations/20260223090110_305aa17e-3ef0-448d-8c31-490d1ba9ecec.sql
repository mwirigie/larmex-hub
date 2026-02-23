
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('client', 'professional', 'admin');

-- Create house type enum
CREATE TYPE public.house_type AS ENUM ('bungalow', 'maisonette', 'apartment', 'villa', 'townhouse', 'mansion', 'other');

-- Create verification status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Create plan status enum  
CREATE TYPE public.plan_status AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- Create specialization enum
CREATE TYPE public.specialization AS ENUM ('residential', 'commercial', 'structural', 'interior', 'landscape', 'urban_planning');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  county TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Professional profiles
CREATE TABLE public.professional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  license_number TEXT,
  specializations specialization[] DEFAULT '{}',
  service_counties TEXT[] DEFAULT '{}',
  years_experience INTEGER DEFAULT 0,
  company_name TEXT,
  website TEXT,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- House plans
CREATE TABLE public.house_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  house_type house_type NOT NULL DEFAULT 'bungalow',
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  floors INTEGER NOT NULL DEFAULT 1,
  area_sqm NUMERIC,
  land_size TEXT,
  price_kes NUMERIC NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  images TEXT[] DEFAULT '{}',
  pdf_url TEXT,
  county TEXT,
  status plan_status NOT NULL DEFAULT 'draft',
  features TEXT[] DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Favorites
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.house_plans(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

-- Plan purchases
CREATE TABLE public.plan_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.house_plans(id) ON DELETE CASCADE NOT NULL,
  amount_kes NUMERIC NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project requests
CREATE TABLE public.project_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  land_size TEXT,
  budget_kes NUMERIC,
  county TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.house_plans(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Verification documents
CREATE TABLE public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_kes NUMERIC NOT NULL,
  commission_kes NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Security definer functions (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_professional_profiles_updated_at BEFORE UPDATE ON public.professional_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_house_plans_updated_at BEFORE UPDATE ON public.house_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_project_requests_updated_at BEFORE UPDATE ON public.project_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_verification_documents_updated_at BEFORE UPDATE ON public.verification_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies

-- Profiles: anyone authenticated can read, only own can update
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User roles: users see own, admins see all
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Professional profiles
CREATE POLICY "Anyone can view professional profiles" ON public.professional_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Professionals can insert own" ON public.professional_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Professionals can update own" ON public.professional_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- House plans: public read, professional write
CREATE POLICY "Anyone can view approved plans" ON public.house_plans FOR SELECT USING (status = 'approved' OR (auth.uid() = professional_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Professionals can insert plans" ON public.house_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = professional_id AND public.has_role(auth.uid(), 'professional'));
CREATE POLICY "Professionals can update own plans" ON public.house_plans FOR UPDATE TO authenticated USING (auth.uid() = professional_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Professionals can delete own plans" ON public.house_plans FOR DELETE TO authenticated USING (auth.uid() = professional_id);

-- Favorites
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Plan purchases
CREATE POLICY "Users can view own purchases" ON public.plan_purchases FOR SELECT TO authenticated USING (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create purchases" ON public.plan_purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

-- Project requests
CREATE POLICY "Users can view own requests" ON public.project_requests FOR SELECT TO authenticated USING (auth.uid() = client_id OR auth.uid() = professional_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can create requests" ON public.project_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Involved parties can update requests" ON public.project_requests FOR UPDATE TO authenticated USING (auth.uid() = client_id OR auth.uid() = professional_id OR public.has_role(auth.uid(), 'admin'));

-- Reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = reviewer_id);

-- Messages
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver can update read status" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- Verification documents
CREATE POLICY "Professionals can view own docs" ON public.verification_documents FOR SELECT TO authenticated USING (auth.uid() = professional_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Professionals can upload docs" ON public.verification_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = professional_id);
CREATE POLICY "Admin can update docs" ON public.verification_documents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can create transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_house_plans_professional ON public.house_plans(professional_id);
CREATE INDEX idx_house_plans_status ON public.house_plans(status);
CREATE INDEX idx_house_plans_type ON public.house_plans(house_type);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_plan_purchases_client ON public.plan_purchases(client_id);
CREATE INDEX idx_messages_participants ON public.messages(sender_id, receiver_id);
CREATE INDEX idx_reviews_professional ON public.reviews(professional_id);
