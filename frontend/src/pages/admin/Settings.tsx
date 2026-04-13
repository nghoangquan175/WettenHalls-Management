import { useState, useEffect } from 'react';
import { NavigationBuilder } from '../../components/admin/settings/NavigationBuilder';
import { Layout, PanelBottom, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { navigationService } from '../../services/navigationService';
import { ConfirmModal } from '../../components/ui/Modal/ConfirmModal';
import { useBlocker } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'header' | 'footer'>('header');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );

  // Dirty state management
  const [isBuilderDirty, setIsBuilderDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<'header' | 'footer' | null>(
    null
  );

  // 1. Browser-level blocking (Refresh/Close Tab)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isBuilderDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isBuilderDirty]);

  // 2. SPA-level blocking (Sidebar links, etc.)
  const blocker = useBlocker(({}) => {
    // Block if dirty AND moving to a different primary route (not just changing tab state locally)
    return isBuilderDirty && !pendingTab;
  });

  // Handle blocker confirmation
  const handleConfirmBlocker = () => {
    if (blocker.proceed) {
      blocker.proceed();
    }
  };

  const handleCancelBlocker = () => {
    if (blocker.reset) {
      blocker.reset();
    }
  };

  // 1. Fetch all versions list for the current tab
  const { data: versions = [], isLoading: isLoadingVersions } = useQuery({
    queryKey: ['navigation', 'versions', activeTab],
    queryFn: () => navigationService.listVersions(activeTab),
  });

  // 2. Determine which version to load in detail
  const effectiveId =
    selectedVersionId || versions.find((v) => v.active)?.id || null;

  // 3. Fetch specific version details
  const { data: currentVersion = null, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['navigation', 'detail', effectiveId],
    queryFn: () =>
      effectiveId
        ? navigationService.getVersionById(effectiveId)
        : Promise.resolve(null),
    enabled: !!effectiveId,
  });

  // Reset selection when tab changes
  useEffect(() => {
    setSelectedVersionId(null);
    setIsBuilderDirty(false);
  }, [activeTab]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: ({ id, items }: { id: string; items: any[] }) =>
      navigationService.updateVersion(id, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation', 'detail'] });
      toast.success('Version saved successfully!');
    },
    onError: () => {
      toast.error('Failed to save version. Please try again.');
    },
  });

  const saveAsMutation = useMutation({
    mutationFn: (data: {
      type: 'header' | 'footer';
      versionName: string;
      items: any[];
    }) => navigationService.createVersion(data),
    onSuccess: (newVersion) => {
      queryClient.invalidateQueries({
        queryKey: ['navigation', 'versions', activeTab],
      });
      setSelectedVersionId(newVersion.id);
      toast.success(`Version "${newVersion.versionName}" created!`);
    },
    onError: (error: any) => {
      const message = error?.message?.includes('already exists')
        ? 'A version with this name already exists.'
        : 'Failed to create new version.';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => navigationService.deleteVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['navigation', 'versions', activeTab],
      });
      setSelectedVersionId(null);
      toast.success('Version deleted successfully.');
    },
    onError: () => {
      toast.error("Failed to delete version. Ensure it isn't active.");
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => navigationService.activateVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['navigation', 'versions', activeTab],
      });
      queryClient.invalidateQueries({ queryKey: ['navigation', 'detail'] });
      toast.success('Navigation activated for the entire site!');
    },
    onError: () => {
      toast.error('Failed to activate version.');
    },
  });

  const handleTabSwitch = (tab: 'header' | 'footer') => {
    if (tab === activeTab) return;

    if (isBuilderDirty) {
      setPendingTab(tab);
    } else {
      setActiveTab(tab);
    }
  };

  const confirmTabSwitch = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const isLoading = isLoadingVersions || (!!effectiveId && isLoadingDetail);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div>
          <h1 className="DisplayLBold">System Settings</h1>
          <p className="DisplayMRegular text-gray-500">
            Manage your website's versioned navigation and global appearance.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => handleTabSwitch('header')}
          className={clsx(
            'flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all',
            activeTab === 'header'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          )}
        >
          <Layout size={18} />
          Header Navigation
        </button>
        <button
          onClick={() => handleTabSwitch('footer')}
          className={clsx(
            'flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all',
            activeTab === 'footer'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          )}
        >
          <PanelBottom size={18} />
          Footer Settings
        </button>
      </div>

      <ConfirmModal
        isOpen={!!pendingTab}
        onClose={() => setPendingTab(null)}
        onConfirm={confirmTabSwitch}
        title="Unsaved Changes"
        message="You have unsaved changes in the current tab. Switching tabs will lose these changes. Continue?"
        confirmText="Switch Anyway"
        variant="warning"
      />

      <ConfirmModal
        isOpen={blocker.state === 'blocked'}
        onClose={handleCancelBlocker}
        onConfirm={handleConfirmBlocker}
        title="Unsaved Changes"
        message="You have unsaved changes. Leaving this page will lose these changes. Do you want to proceed?"
        confirmText="Leave Anyway"
        variant="warning"
      />

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="ContentMBold text-gray-500">
                Loading navigation data...
              </p>
            </div>
          ) : (
            <NavigationBuilder
              key={activeTab}
              type={activeTab}
              title={
                activeTab === 'header' ? 'Header Navigation' : 'Footer Columns'
              }
              description={
                activeTab === 'header'
                  ? 'Manage main menu items and their dropdown sub-menus.'
                  : 'Configure footer column labels and the links within each column.'
              }
              versions={versions}
              currentVersion={currentVersion}
              onVersionChange={setSelectedVersionId}
              onSave={async (id, items) => {
                await saveMutation.mutateAsync({ id, items });
              }}
              onSaveAs={async (name, items) => {
                await saveAsMutation.mutateAsync({
                  type: activeTab,
                  versionName: name,
                  items,
                });
              }}
              onDelete={async (id) => {
                await deleteMutation.mutateAsync(id);
              }}
              onActivate={async (id) => {
                await activateMutation.mutateAsync(id);
              }}
              onDirtyChange={setIsBuilderDirty}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
