-- Trigger function to auto-set user_id from JWT auth
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  NEW.user_id = COALESCE(NEW.user_id, auth.uid());
  RETURN NEW;
END;
$$;

-- Apply to projects (tasks/comments use project-based RLS, no user_id column)
DROP TRIGGER IF EXISTS set_user_id_projects ON public.projects;
CREATE TRIGGER set_user_id_projects
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();
