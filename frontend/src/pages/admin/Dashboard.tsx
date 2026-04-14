import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { formatRoleName } from '../../utils/format';
import StatsCard from '../../components/common/StatsCard';
import { Users, FileText, ShieldCheck, ArrowRight } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../../services/api';

const Dashboard = () => {
  const { user, triggerAuthError } = useAuth();
  const roleName = user ? formatRoleName(user.role) : 'Admin';

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminService.getDashboardStats,
  });

  useEffect(() => {
    if (error instanceof ApiError) {
      if (error.status === 403 || error.code === 'ACCOUNT_INACTIVE') {
        triggerAuthError(error.message);
      }
    }
  }, [error, triggerAuthError]);

  const statCards = [
    {
      label: 'Super Administrators',
      value: stats?.superAdminCount,
      icon: ShieldCheck,
      variant: 'primary' as const,
    },
    {
      label: 'Administrators',
      value: stats?.adminCount,
      icon: Users,
      variant: 'success' as const,
    },
    {
      label: 'Total visible Articles',
      value: stats?.articleCount,
      icon: FileText,
      variant: 'warning' as const,
    },
    {
      label: 'Published Articles',
      value: stats?.publishedArticleCount,
      icon: ShieldCheck,
      variant: 'success' as const,
    },
  ].filter((card) => card.value !== undefined);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="DisplayLBold text-gray-900">
            Welcome back, {user?.name}!
          </h2>
          <p className="ContentMRegular text-gray-400 mt-1">
            You're logged in as{' '}
            <span className="ContentMBold text-primary uppercase">
              {roleName}
            </span>
            . Here's what's happening today.
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatsCard
            key={index}
            {...stat}
            value={isLoading ? '...' : stat.value!}
          />
        ))}
      </div>

      {/* Placeholder for future sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[384px] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <h4 className="DisplaySBold text-gray-700">Activity Analytics</h4>
          <p className="ContentMRegular text-gray-400 max-w-sm mt-2">
            This space will eventually feature charts and graphs detailing user
            engagement and article trends.
          </p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[384px] flex flex-col">
          <h4 className="DisplaySBold text-gray-900 mb-6 border-b border-gray-50 pb-4">
            Recent Notifications
          </h4>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="ContentSMedium text-gray-800 leading-snug">
                    New administrator account verified by the system.
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                    {i + 1}h ago
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 text-primary ContentSBold hover:underline text-left inline-flex items-center gap-2 group">
            View all notifications
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
