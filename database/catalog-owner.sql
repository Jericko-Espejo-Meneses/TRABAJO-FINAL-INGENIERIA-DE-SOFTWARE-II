BEGIN;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_ownerId_fkey' AND conrelid = 'public.restaurants'::regclass) THEN
    ALTER TABLE public.restaurants ADD CONSTRAINT "restaurants_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END;
$$;
CREATE INDEX IF NOT EXISTS "restaurants_ownerId_idx" ON public.restaurants ("ownerId");
COMMIT;
