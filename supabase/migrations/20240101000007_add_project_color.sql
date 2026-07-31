-- Add color column to projects
-- Named colors (blue, green, purple, orange, red, teal, pink, indigo) sent by the frontend.
-- Hex default '#3B82F6' applies only when color is omitted on insert.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';
