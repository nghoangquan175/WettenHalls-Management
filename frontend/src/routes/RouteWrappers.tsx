import { AuthGuard } from '../guards/AuthGuard';
import ArticleForm from '../pages/admin/ArticleForm';

/**
 * Wrapper for the Article Create page to apply specific permissions.
 * Moved to a separate file to satisfy the 'react-refresh/only-export-components' rule
 * in AppRoutes.tsx.
 */
export const CreateArticleWrapper = () => {
  return (
    <AuthGuard
      allowedRoles={['SUPER_ADMIN', 'ADMIN']}
      requirePermission="CREATE"
    >
      <ArticleForm />
    </AuthGuard>
  );
};
