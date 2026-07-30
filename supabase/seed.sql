-- =============================================================
-- Seed Data for Task Management Application
-- =============================================================
-- This script creates test users, projects, tasks, and comments.
-- It uses pgcrypto for password hashing and inserts directly
-- into auth.users and auth.identities to bootstrap test accounts.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================
-- Test Users
-- =============================================================

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES
    (
        gen_random_uuid(),
        'alice@example.com',
        crypt('password123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Alice Johnson"}',
        'authenticated',
        'authenticated'
    ),
    (
        gen_random_uuid(),
        'bob@example.com',
        crypt('password123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Bob Smith"}',
        'authenticated',
        'authenticated'
    );

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
SELECT
    gen_random_uuid(),
    id,
    jsonb_build_object('sub', id, 'email', email),
    'email',
    email,
    now(),
    now()
FROM auth.users
WHERE email IN ('alice@example.com', 'bob@example.com');

-- =============================================================
-- Helper function to get user_id by email
-- =============================================================

CREATE OR REPLACE FUNCTION get_user_id(p_email TEXT)
RETURNS UUID AS $$
    SELECT id FROM auth.users WHERE email = p_email;
$$ LANGUAGE SQL STABLE;

-- =============================================================
-- Projects for Alice
-- =============================================================

INSERT INTO public.projects (id, user_id, name, description, created_at, updated_at)
VALUES
    (
        gen_random_uuid(),
        get_user_id('alice@example.com'),
        'Website Redesign',
        'Complete overhaul of the company website with modern design and improved UX.',
        now() - interval '14 days',
        now() - interval '2 days'
    ),
    (
        gen_random_uuid(),
        get_user_id('alice@example.com'),
        'Mobile App Development',
        'Build a cross-platform mobile application for iOS and Android using React Native.',
        now() - interval '10 days',
        now() - interval '1 day'
    ),
    (
        gen_random_uuid(),
        get_user_id('alice@example.com'),
        'API Integration',
        'Integrate third-party payment and analytics APIs into the existing platform.',
        now() - interval '7 days',
        now()
    );

-- =============================================================
-- Projects for Bob
-- =============================================================

INSERT INTO public.projects (id, user_id, name, description, created_at, updated_at)
VALUES
    (
        gen_random_uuid(),
        get_user_id('bob@example.com'),
        'Data Pipeline',
        'Build an ETL pipeline to process customer data and generate reports.',
        now() - interval '12 days',
        now() - interval '3 days'
    );

-- =============================================================
-- Tasks for Alice's projects
-- =============================================================

-- Helper to get project_id by name and user
CREATE OR REPLACE FUNCTION get_project_id(p_name TEXT, p_email TEXT)
RETURNS UUID AS $$
    SELECT p.id FROM public.projects p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.name = p_name AND u.email = p_email;
$$ LANGUAGE SQL STABLE;

-- Website Redesign tasks
INSERT INTO public.tasks (id, project_id, assignee_id, title, description, status, priority, due_date, created_at, updated_at)
VALUES
    (
        gen_random_uuid(),
        get_project_id('Website Redesign', 'alice@example.com'),
        get_user_id('alice@example.com'),
        'Design homepage mockup',
        'Create Figma mockups for the new homepage layout with hero section, features, and footer.',
        'Done',
        'High',
        now() + interval '5 days',
        now() - interval '14 days',
        now() - interval '2 days'
    ),
    (
        gen_random_uuid(),
        get_project_id('Website Redesign', 'alice@example.com'),
        NULL,
        'Implement responsive navigation',
        'Build a responsive navbar with mobile hamburger menu, dropdown support, and active state highlighting.',
        'In Progress',
        'High',
        now() + interval '10 days',
        now() - interval '12 days',
        now() - interval '1 day'
    ),
    (
        gen_random_uuid(),
        get_project_id('Website Redesign', 'alice@example.com'),
        get_user_id('alice@example.com'),
        'Set up CI/CD pipeline',
        'Configure GitHub Actions for automated testing, linting, and deployment to staging.',
        'Todo',
        'Medium',
        now() + interval '15 days',
        now() - interval '10 days',
        now() - interval '10 days'
    );

-- Mobile App Development tasks
INSERT INTO public.tasks (id, project_id, assignee_id, title, description, status, priority, due_date, created_at, updated_at)
VALUES
    (
        gen_random_uuid(),
        get_project_id('Mobile App Development', 'alice@example.com'),
        get_user_id('alice@example.com'),
        'Set up React Native project',
        'Initialize React Native project with TypeScript, navigation, and state management.',
        'Done',
        'High',
        now() + interval '3 days',
        now() - interval '10 days',
        now() - interval '1 day'
    ),
    (
        gen_random_uuid(),
        get_project_id('Mobile App Development', 'alice@example.com'),
        NULL,
        'Implement user authentication screens',
        'Build login, register, and password reset screens with form validation.',
        'In Progress',
        'High',
        now() + interval '8 days',
        now() - interval '8 days',
        now()
    ),
    (
        gen_random_uuid(),
        get_project_id('Mobile App Development', 'alice@example.com'),
        NULL,
        'Design dashboard UI components',
        'Create reusable dashboard components: stats cards, charts, activity feed, and profile header.',
        'Todo',
        'Medium',
        now() + interval '14 days',
        now() - interval '6 days',
        now() - interval '6 days'
    );

-- API Integration tasks
INSERT INTO public.tasks (id, project_id, assignee_id, title, description, status, priority, due_date, created_at, updated_at)
VALUES
    (
        gen_random_uuid(),
        get_project_id('API Integration', 'alice@example.com'),
        NULL,
        'Integrate Stripe payment gateway',
        'Implement Stripe checkout, webhook handling, and subscription management.',
        'Todo',
        'High',
        now() + interval '20 days',
        now() - interval '7 days',
        now() - interval '7 days'
    ),
    (
        gen_random_uuid(),
        get_project_id('API Integration', 'alice@example.com'),
        NULL,
        'Set up analytics tracking',
        'Integrate Google Analytics 4 with custom event tracking for key user actions.',
        'Todo',
        'Low',
        now() + interval '30 days',
        now() - interval '5 days',
        now() - interval '5 days'
    );

-- =============================================================
-- Comments on tasks
-- =============================================================

-- Helper to get task_id by title and project
CREATE OR REPLACE FUNCTION get_task_id(p_title TEXT, p_project_name TEXT, p_email TEXT)
RETURNS UUID AS $$
    SELECT t.id FROM public.tasks t
    JOIN public.projects p ON p.id = t.project_id
    JOIN auth.users u ON u.id = p.user_id
    WHERE t.title = p_title AND p.name = p_project_name AND u.email = p_email;
$$ LANGUAGE SQL STABLE;

INSERT INTO public.comments (id, task_id, author_id, message, created_at)
VALUES
    (
        gen_random_uuid(),
        get_task_id('Design homepage mockup', 'Website Redesign', 'alice@example.com'),
        get_user_id('alice@example.com'),
        'I have shared the first draft of the homepage mockup in Figma. Please review and provide feedback.',
        now() - interval '3 days'
    ),
    (
        gen_random_uuid(),
        get_task_id('Implement responsive navigation', 'Website Redesign', 'alice@example.com'),
        get_user_id('alice@example.com'),
        'The mobile hamburger menu is working. Still need to add dropdown support for nested pages.',
        now() - interval '1 day'
    ),
    (
        gen_random_uuid(),
        get_task_id('Set up React Native project', 'Mobile App Development', 'alice@example.com'),
        get_user_id('alice@example.com'),
        'Project initialized with React Native CLI. Added TypeScript, React Navigation, and Zustand for state management.',
        now() - interval '1 day'
    ),
    (
        gen_random_uuid(),
        get_task_id('Set up React Native project', 'Mobile App Development', 'alice@example.com'),
        get_user_id('alice@example.com'),
        'All dependencies are installed and the app runs successfully on both iOS simulator and Android emulator.',
        now() - interval '12 hours'
    );

-- =============================================================
-- Cleanup helper functions (not needed at runtime)
-- =============================================================

DROP FUNCTION IF EXISTS get_task_id(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_project_id(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_user_id(TEXT);
