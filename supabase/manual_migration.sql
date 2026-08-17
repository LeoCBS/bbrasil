-- Manual migration script for updating existing clients to use profile_id
-- Run this after creating profiles in the profiles table
-- This script updates clients that have a salesperson name to reference the corresponding profile_id

-- Update clients to reference profile_id based on salesperson name
-- This assumes you have already created profiles with names matching the salesperson names
UPDATE public.clients c
SET profile_id = p.id
FROM public.profiles p
WHERE c.salesperson IS NOT NULL 
  AND c.salesperson != ''
  AND p.name = c.salesperson
  AND c.profile_id IS NULL;

-- For clients where the salesperson name doesn't match any profile name,
-- you may need to manually map them. 
-- Run this query to see which clients still need mapping:
-- SELECT id, corporate_name, salesperson 
-- FROM public.clients 
-- WHERE profile_id IS NULL AND salesperson IS NOT NULL AND salesperson != '';

-- After verification, you can then safely drop the salesperson column:
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS salesperson;