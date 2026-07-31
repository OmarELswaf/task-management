-- =============================================================
-- Seed Data for Task Management Application
-- =============================================================
-- This script creates test users, projects, tasks, and comments.
-- It uses pgcrypto for password hashing and inserts directly
-- into auth.users and auth.identities to bootstrap test accounts.
--
-- NOTE: Lookups are inlined as scalar subqueries instead of helper
-- functions. The Supabase CLI runs seed statements as prepared
-- statements (extended protocol); at prepare time functions
-- referenced by later statements are not visible to the parser yet,
-- which surfaces as `function xxx(unknown) does not exist`
-- (SQLSTATE 42883) even when the CREATE FUNCTION statements appear
-- first in the file.
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
-- Projects for Alice
-- =============================================================

INSERT INTO public.projects (id, user_id, name, description, created_at, updated_at)
VALUES
    (
        gen_random_uuid(),
        (SELECT id FROM auth.users WHERE email = 'alice@example.com'),
        'Website Redesign',
        'Complete overhaul of the company website with modern design and improved UX.',
        now() - interval '14 days',
        now() - interval '2 days'
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM auth.users WHERE email = 'alice@example.com'),
        'Mobile App Development',
        'Build a cross-platform mobile application for iOS and Android using React Native.',
        now() - interval '10 days',
        now() - interval '1 day'
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM auth.users WHERE email = 'alice@example.com'),
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
        (SELECT id FROM auth.users WHERE email = 'bob@example.com'),
        'Data Pipeline',
        'Build an ETL pipeline to process customer data and generate reports.',
        now() - interval '12 days',
        now() - interval '3 days'
    );

-- =============================================================
-- Tasks for Alice's projects
-- =============================================================

-- Website Redesign tasks
INSERT INTO public.tasks (id, project_id, assignee_id, title, description, status, priority, due_date, created_at, updated_at)
VALUES
    (
        gen_random_uuid(),
        (SELECT p.id FROM public.projects p JOIN auth.users u ON u.id = p.user_id WHERE p.name = 'Website Redesign' AND u.email = 'alice@example.com'),
        (SELECT id FROM auth.users WHERE email = 'alice@example.com'),
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
        (SELECT p.id FROM public.projects p JOIN auth.users u ON u.id = p.user_id WHERE p.name = 'Website Redesign' AND u.email = 'alice@example.com'),
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
        (SELECT p.id FROM public.projects p JOIN auth.users u ON u.id = p.user_id WHERE p.name = 'Website Redesign' AND u.email = 'alice@example.com'),
        (SELECT id FROM auth.users WHERE email = 'alice@example.com'),
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
        (SELECT p.id FROM public.projects p JOIN auth.users u ON u.id = p.user_id WHERE p.name = 'Mobile App Development' AND u.email = 'alice@example.com'),
        (SELECT id FROM auth.users WHERE email = 'alice@example.com'),
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
        (SELECT p.id FROM public.projects p JOIN auth.users u ON u.id = p.user_id WHERE p.name = 'Mobile App Development' AND u.email = 'alice@example.com'),
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
        (SELECT p.id FROM public.projects p JOIN auth.users u ON u.id = p.user_id WHERE p.name = 'Mobile App Development' AND u.email = 'alice@example.com'),
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
        (SELECT p.id FROM public.projects p JOIN auth.users u ON u.id = p.user_id WHERE p.name = 'API Integration' AND u.email = 'alice@example.com'),
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
        (SELECT p.id FROM public.projects p JOIN auth.users u ON u.id = p.user_id WHERE p.name = 'API Integration' AND u.email = 'alice@example.com'),
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

INSERT INTO public.comments (id, task_id, author_id, message, created_at)
VALUES
    (
        gen_random_uuid(),
        (SELECT t.id FROM public.tasks t JOIN public.projects p ON p.id = t.project_id JOIN auth.users u ON u.id = p.user_id WHERE t.title = 'Design homepage mockup' AND p.name = 'Website Redesign' AND u.email = 'alice@example.com'),
        (SELECT id FROM auth.users WHERE email = 'alice@example.com'),
        'I have shared the first draft of the homepage mockup in Figma. Please review and provide feedback.',
        now() - interval '3 days'
    ),
    (
        gen_random_uuid(),
        (SELECT t.id FROM public.tasks t JOIN public.projects p ON p.id = t.project_id JOIN auth.users u ON u.id = p.user_id WHERE t.title = 'Implement responsive navigation' AND p.name = 'Website Redesign' AND u.email = 'alice@example.com'),
        (SELECT id FROM auth.users WHERE email = 'alice@example.com'),
        'The mobile hamburger menu is working. Still need to add dropdown support for nested pages.',
        now() - interval '1 day'
    ),
    (
        gen_random_uuid(),
        (SELECT t.id FROM public.tasks t JOIN public.projects p ON p.id = t.project_id JOIN auth.users u ON u.id = p.user_id WHERE t.title = 'Set up React Native project' AND p.name = 'Mobile App Development' AND u.email = 'alice@example.com'),
        (SELECT id FROM auth.users WHERE email = 'alice@example.com'),
        'Project initialized with React Native CLI. Added TypeScript, React Navigation, and Zustand for state management.',
        now() - interval '1 day'
    ),
    (
        gen_random_uuid(),
        (SELECT t.id FROM public.tasks t JOIN public.projects p ON p.id = t.project_id JOIN auth.users u ON u.id = p.user_id WHERE t.title = 'Set up React Native project' AND p.name = 'Mobile App Development' AND u.email = 'alice@example.com'),
        (SELECT id FROM auth.users WHERE email = 'alice@example.com'),
        'All dependencies are installed and the app runs successfully on both iOS simulator and Android emulator.',
        now() - interval '12 hours'
    );
