import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthGuard } from '../guards/AuthGuard';
import { getRolePrefix } from '../constants/navigation';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/Login';
import NotFoundPage from '../pages/NotFound';
import { useState, useEffect } from 'react';

// Admin Pages
import Dashboard from '../pages/admin/Dashboard';
import Users from '../pages/admin/Users';
import Articles from '../pages/admin/Articles';
import ArticleForm from '../pages/admin/ArticleForm';
import Trash from '../pages/admin/Trash';
import Settings from '../pages/admin/Settings';

export const AppRoutes = () => {
  const { user, isInitializing } = useAuth();
  const [showSlowConnection, setShowSlowConnection] = useState(false);

  useEffect(() => {
    let timeout: any;
    if (isInitializing) {
      timeout = setTimeout(() => setShowSlowConnection(true), 8000);
    }
    return () => clearTimeout(timeout);
  }, [isInitializing]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="DisplayXLBold text-primary mb-8 tracking-widest animate-pulse">WETTENHALLS</h1>
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
        <p className="ContentSBold text-gray-500 mb-2">Initializing Management System...</p>
        {showSlowConnection && (
          <p className="ContentSMedium text-warning animate-in fade-in duration-500">
            Connection is slower than expected. Please check your network.
          </p>
        )}
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          user?.isAuthenticated ? (
            <Navigate to={getRolePrefix(user.role)} replace />
          ) : (
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          )
        } 
      />

      {/* Super Admin Protected Routes */}
      <Route
        path="/super-admin"
        element={
          <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
            <MainLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="user" element={<Users />} />
        <Route path="article" element={<Articles />} />
        <Route path="article/create" element={<ArticleForm />} />
        <Route path="article/:id/edit" element={<ArticleForm />} />
        <Route path="trash" element={<Trash />} />
        <Route path="setting" element={<Settings />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <AuthGuard allowedRoles={["ADMIN"]}>
            <MainLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="article" element={<Articles />} />
        <Route path="article/create" element={<ArticleForm />} />
        <Route path="article/:id/edit" element={<ArticleForm />} />
        <Route path="trash" element={<Trash />} />
        <Route path="setting" element={<Settings />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>

      {/* Default Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
