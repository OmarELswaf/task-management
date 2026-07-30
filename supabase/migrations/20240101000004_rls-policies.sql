-- =============================================================
-- RLS Policies for projects
-- =============================================================

CREATE POLICY "Users can view their own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================================
-- RLS Policies for tasks
-- =============================================================

CREATE POLICY "Users can view tasks in their projects"
    ON public.tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tasks in their projects"
    ON public.tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks in their projects"
    ON public.tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = tasks.project_id
            AND projects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tasks in their projects"
    ON public.tasks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- =============================================================
-- RLS Policies for comments
-- =============================================================

CREATE POLICY "Users can view comments on their tasks"
    ON public.comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks
            JOIN public.projects ON projects.id = tasks.project_id
            WHERE tasks.id = comments.task_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create comments on their tasks"
    ON public.comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks
            JOIN public.projects ON projects.id = tasks.project_id
            WHERE tasks.id = comments.task_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = author_id);
