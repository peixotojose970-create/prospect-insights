CREATE TABLE public.prospecting_preferences (
  user_id uuid PRIMARY KEY,
  selected_country text NOT NULL DEFAULT 'BR' CHECK (selected_country IN ('BR','US','PT','ES','FR','IT')),
  countries jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.prospecting_preferences TO authenticated;
GRANT ALL ON public.prospecting_preferences TO service_role;
ALTER TABLE public.prospecting_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own prospecting preferences" ON public.prospecting_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Insert own prospecting preferences" ON public.prospecting_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own prospecting preferences" ON public.prospecting_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);