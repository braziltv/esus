-- Create enum for operator roles
CREATE TYPE public.operator_auth_role AS ENUM ('admin', 'recepcao', 'triagem', 'medico', 'enfermagem', 'tv');

-- Create table to link auth users to operators and units
CREATE TABLE public.auth_operator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  role operator_auth_role NOT NULL DEFAULT 'recepcao',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auth_operator_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.auth_operator_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all profiles in their unit
CREATE POLICY "Admins can manage unit profiles"
ON public.auth_operator_profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.auth_operator_profiles aop
    WHERE aop.user_id = auth.uid()
    AND aop.unit_id = auth_operator_profiles.unit_id
    AND aop.role = 'admin'
  )
);

-- Create security definer function to get user's unit
CREATE OR REPLACE FUNCTION public.get_user_unit_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit_id FROM public.auth_operator_profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Create security definer function to get user's unit name
CREATE OR REPLACE FUNCTION public.get_user_unit_name()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.name 
  FROM public.auth_operator_profiles aop
  JOIN public.units u ON u.id = aop.unit_id
  WHERE aop.user_id = auth.uid() 
  LIMIT 1
$$;

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_operator_role(_role operator_auth_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.auth_operator_profiles
    WHERE user_id = auth.uid() AND role = _role AND is_active = true
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_unit_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.auth_operator_profiles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  )
$$;

-- Update patient_calls RLS to filter by user's unit
DROP POLICY IF EXISTS "Anyone can delete patient calls" ON public.patient_calls;
DROP POLICY IF EXISTS "Anyone can insert patient calls" ON public.patient_calls;
DROP POLICY IF EXISTS "Anyone can update patient calls" ON public.patient_calls;
DROP POLICY IF EXISTS "Anyone can view patient calls" ON public.patient_calls;

CREATE POLICY "Users can view their unit patient calls"
ON public.patient_calls
FOR SELECT
USING (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

CREATE POLICY "Users can insert their unit patient calls"
ON public.patient_calls
FOR INSERT
WITH CHECK (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

CREATE POLICY "Users can update their unit patient calls"
ON public.patient_calls
FOR UPDATE
USING (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

CREATE POLICY "Users can delete their unit patient calls"
ON public.patient_calls
FOR DELETE
USING (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

-- Update call_history RLS to filter by user's unit
DROP POLICY IF EXISTS "Anyone can delete call history" ON public.call_history;
DROP POLICY IF EXISTS "Anyone can insert call history" ON public.call_history;
DROP POLICY IF EXISTS "Anyone can view call history" ON public.call_history;

CREATE POLICY "Users can view their unit call history"
ON public.call_history
FOR SELECT
USING (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

CREATE POLICY "Users can insert their unit call history"
ON public.call_history
FOR INSERT
WITH CHECK (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

CREATE POLICY "Users can delete their unit call history"
ON public.call_history
FOR DELETE
USING (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

-- Update chat_messages RLS
DROP POLICY IF EXISTS "Anyone can delete chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;

CREATE POLICY "Users can view their unit chat messages"
ON public.chat_messages
FOR SELECT
USING (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

CREATE POLICY "Users can insert their unit chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

CREATE POLICY "Users can delete their unit chat messages"
ON public.chat_messages
FOR DELETE
USING (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

-- Update user_sessions RLS
DROP POLICY IF EXISTS "Anyone can delete user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Anyone can insert user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Anyone can update user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Anyone can view user sessions" ON public.user_sessions;

CREATE POLICY "Users can view their unit sessions"
ON public.user_sessions
FOR SELECT
USING (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

CREATE POLICY "Users can insert their unit sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

CREATE POLICY "Users can update their unit sessions"
ON public.user_sessions
FOR UPDATE
USING (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

CREATE POLICY "Users can delete their unit sessions"
ON public.user_sessions
FOR DELETE
USING (unit_name = public.get_user_unit_name() OR public.get_user_unit_name() IS NULL);

-- Add trigger for updated_at on auth_operator_profiles
CREATE TRIGGER update_auth_operator_profiles_updated_at
BEFORE UPDATE ON public.auth_operator_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for auth_operator_profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.auth_operator_profiles;