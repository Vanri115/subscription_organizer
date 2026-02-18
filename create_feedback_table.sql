-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    message text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can INSERT their own feedback
CREATE POLICY "Users can submit feedback"
    ON public.feedback FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Only service_role (admin) can read all feedback (via Supabase Dashboard)
-- No SELECT policy for regular users = they can't read others' feedback
