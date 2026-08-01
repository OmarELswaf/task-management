import { Suspense, lazy } from "react";
import { Link, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { LogoutButton } from "@/components/common/LogoutButton";

const Login = lazy(() =>
  import("@/pages/auth/Login").then((m) => ({ default: m.Login }))
);
const Register = lazy(() =>
  import("@/pages/auth/Register").then((m) => ({ default: m.Register }))
);
const ProjectsList = lazy(() =>
  import("@/pages/projects/ProjectsList").then((m) => ({ default: m.ProjectsList }))
);
const ProjectDetail = lazy(() =>
  import("@/pages/projects/ProjectDetail").then((m) => ({ default: m.ProjectDetail }))
);

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome{user?.email ? `, ${user.email}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your projects and tasks
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          to="/projects"
          className="group rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <h2 className="mb-1 text-lg font-semibold group-hover:text-primary">
            Projects
          </h2>
          <p className="text-sm text-muted-foreground">
            View and manage all your projects
          </p>
        </Link>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
          </div>
          <h2 className="mb-1 text-lg font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">
            Create a new project to get started
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="*"
          element={
            <div className="flex min-h-screen flex-col items-center justify-center gap-2">
              <h1 className="text-4xl font-bold">404</h1>
              <p className="text-muted-foreground">Page not found</p>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}
