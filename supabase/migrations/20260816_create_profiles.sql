-- Create profiles table to store metadata for Supabase users

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NULL,
  email text NOT NULL,
  name text NULL,
  unit_id text NULL,
  role text NOT NULL DEFAULT 'vendedor', -- allowed: admin, vendedor
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS profiles_unit_idx ON public.profiles (unit_id);
