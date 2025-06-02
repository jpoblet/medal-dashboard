CREATE TABLE IF NOT EXISTS public.competitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    event_date date,
    venue text,
    is_visible boolean DEFAULT true,
    registration_open boolean DEFAULT true,
    created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE POLICY "Users can view own competitions"
ON public.competitions
FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own competitions"
ON public.competitions
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own competitions"
ON public.competitions
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own competitions"
ON public.competitions
FOR DELETE
USING (auth.uid() = created_by);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

alter publication supabase_realtime add table competitions;