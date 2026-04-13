import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from '../guards/AuthGuard';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/Login';
import NotFoundPage from '../pages/NotFound';

// Admin Pages
import Dashboard from '../pages/admin/Dashboard';
import Users from '../pages/admin/Users';
import Articles from '../pages/admin/Articles';
import ArticleForm from '../pages/admin/ArticleForm';
import Settings from '../pages/admin/Settings';
import ArticlePreview from '../pages/admin/ArticlePreview';

// Helper for permissions (we'll need to wrap components that need this check)
const CreateArticleWrapper = () => {
  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN", "ADMIN"]} requirePermission="CREATE">
      <ArticleForm />
    </AuthGuard>
  );
};

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: "/users/article/:id/preview",
    element: (
      <AuthGuard allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
        <ArticlePreview />
      </AuthGuard>
    ),
  },
  {
    path: "/users",
    element: (
      <AuthGuard allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "user",
        element: (
          <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
            <Users />
          </AuthGuard>
        ),
      },
      {
        path: "article",
        children: [
          {
            index: true,
            element: <Articles />,
          },
          {
            path: "create",
            element: <CreateArticleWrapper />,
          },
          {
            path: ":id/edit",
            element: <ArticleForm />,
          },
        ]
      },
      {
        path: "setting",
        element: <Settings />,
      },
      {
        path: "*",
        element: <Navigate to="/404" replace />,
      },
    ],
  },
  {
    path: "/",
    element: <Navigate to="/users" replace />,
  },
  {
    path: "/404",
    element: <NotFoundPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
