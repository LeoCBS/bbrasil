-- Migration to replace salespeople functionality with profiles
-- This migration:
-- 1. Adds profile_id column to clients table
-- 2. Migrates existing salesperson data to profiles table if needed
-- 3. Drops the salespeople table
-- 4. Removes the salesperson column from clients table

-- Step 1: Add profile_id column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS profile_id uuid NULL;

-- Step 2: Create a foreign key constraint to profiles table
ALTER TABLE public.clients 
ADD CONSTRAINT clients_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Step 3: Migrate existing salespeople to profiles if salespeople table exists
-- This step assumes you want to migrate existing salespeople to profiles
DO $$
BEGIN
    -- Check if salespeople table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'salespeople') THEN
        -- Insert salespeople into profiles table
        INSERT INTO public.profiles (user_id, email, name, unit_id, role, active)
        SELECT 
            NULL, 
            COALESCE(email, 'vendedor-' || id || '@temp.com'), 
            name, 
            unit_id, 
            'vendedor' as role, 
            active
        FROM public.salespeople
        ON CONFLICT (email) DO NOTHING;
        
        -- Update clients to reference the new profile_id instead of salesperson name
        -- This matches clients by salesperson name to the new profile
        UPDATE public.clients c
        SET profile_id = p.id
        FROM public.profiles p
        WHERE c.salesperson = p.name;
        
        -- Drop the salespeople table
        DROP TABLE IF EXISTS public.salespeople;
    END IF;
END $$;

-- Step 4: Remove the salesperson column from clients table
ALTER TABLE public.clients 
DROP COLUMN IF EXISTS salesperson;

-- Step 5: Create index on profile_id for better query performance
CREATE INDEX IF NOT EXISTS clients_profile_id_idx ON public.clients (profile_id);