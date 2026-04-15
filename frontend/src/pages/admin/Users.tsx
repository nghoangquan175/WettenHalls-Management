import { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Trash2,
  Power,
  PowerOff,
  Mail,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import DataTable, { type Column } from '../../components/common/DataTable';
import { cn } from '../../utils/cn';
import { CreateAdminModal } from '../../components/admin/CreateAdminModal';
import { ConfirmModal } from '../../components/ui/Modal/ConfirmModal';
import { ActionButton } from '../../components/ui/Button/ActionButton';
import {
  adminService,
  type UserData,
  type InfiniteUserData,
} from '../../services/adminService';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '../../services/api';

import { useDebounce } from '../../hooks/useDebounce';

const Users = () => {
  const { triggerAuthError } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE'
  >('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'GUEST'>(
    'ALL'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [actionType, setActionType] = useState<'status' | 'delete' | null>(
    null
  );

  const debouncedSearch = useDebounce(searchTerm, 500);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      'users',
      {
        search: debouncedSearch,
        status: statusFilter,
        role: roleFilter,
        sort: sortOrder,
      },
    ],
    queryFn: ({ pageParam = 1 }) =>
      adminService.getUsers(
        debouncedSearch,
        statusFilter === 'ALL' ? undefined : statusFilter,
        sortOrder,
        pageParam as number,
        10,
        roleFilter === 'ALL' ? undefined : roleFilter
      ),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  const flatUsers = data?.pages.flatMap((page) => page.users) || [];

  useEffect(() => {
    if (error instanceof ApiError) {
      if (error.status === 403 || error.code === 'ACCOUNT_INACTIVE') {
        triggerAuthError(error.message);
      }
    }
  }, [error, triggerAuthError]);

  const handleCloseModals = () => {
    setSelectedUser(null);
    setActionType(null);
  };

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'ACTIVE' | 'INACTIVE';
    }) => adminService.updateUserStatus(id, status),
    onMutate: async ({ id, status }) => {
      handleCloseModals(); // Close modal immediately
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData(['users']);

      queryClient.setQueryData(
        ['users'],
        (old: InfiniteData<InfiniteUserData> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              users: page.users.map((user: UserData) =>
                user.id === id ? { ...user, status } : user
              ),
            })),
          };
        }
      );
      return { previousUsers };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onMutate: async (id) => {
      handleCloseModals(); // Close modal immediately
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData(['users']);

      queryClient.setQueryData(
        ['users'],
        (old: InfiniteData<InfiniteUserData> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              users: page.users.filter((user: UserData) => user.id !== id),
            })),
          };
        }
      );
      return { previousUsers };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const permissionsMutation = useMutation({
    mutationFn: ({
      id,
      permissions,
    }: {
      id: string;
      permissions: string[];
      permissionType: string;
    }) => adminService.updateUserPermissions(id, permissions),
    onMutate: async (newPermissions) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['users'] });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData(['users']);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ['users'],
        (old: InfiniteData<InfiniteUserData> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              users: page.users.map((user: UserData) =>
                user.id === newPermissions.id
                  ? { ...user, permissions: newPermissions.permissions }
                  : user
              ),
            })),
          };
        }
      );

      return { previousUsers };
    },
    onError: (_err, _newPermissions, context) => {
      // Rollback to the previous value if mutation fails
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
    },
    onSuccess: () => {
      // Only refetch after success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const columns = useMemo(
    (): Column<UserData>[] => [
      {
        header: 'User',
        accessor: (user) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary ContentSBold shrink-0 uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="ContentMMedium text-gray-900 truncate">
                {user.name}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <Mail className="w-3 h-3" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        header: (
          <div className="relative group/filter">
            <button
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                const menu = document.getElementById('role-filter-menu');
                if (menu) menu.classList.toggle('hidden');
              }}
            >
              Role
              <ChevronDown className="w-3 h-3" />
            </button>
            <div
              id="role-filter-menu"
              className="hidden absolute top-full left-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200"
            >
              {['ALL', 'ADMIN', 'GUEST'].map((role) => (
                <button
                  key={role}
                  className={cn(
                    'w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors',
                    roleFilter === role ? 'text-primary' : 'text-gray-500'
                  )}
                  onClick={() => {
                    setRoleFilter(role as 'ALL' | 'ADMIN' | 'GUEST');
                    document
                      .getElementById('role-filter-menu')
                      ?.classList.add('hidden');
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        ),
        accessor: (user) => (
          <div
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest',
              user.role === 'ADMIN'
                ? 'bg-blue-500/10 text-blue-500'
                : 'bg-purple-500/10 text-purple-500'
            )}
          >
            {user.role}
          </div>
        ),
      },
      {
        header: (
          <div className="relative group/filter">
            <button
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                const menu = document.getElementById('status-filter-menu');
                if (menu) menu.classList.toggle('hidden');
              }}
            >
              Status
              <ChevronDown className="w-3 h-3" />
            </button>
            <div
              id="status-filter-menu"
              className="hidden absolute top-full left-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200"
            >
              {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
                <button
                  key={status}
                  className={cn(
                    'w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors',
                    statusFilter === status ? 'text-primary' : 'text-gray-500'
                  )}
                  onClick={() => {
                    setStatusFilter(status as 'ALL' | 'ACTIVE' | 'INACTIVE');
                    document
                      .getElementById('status-filter-menu')
                      ?.classList.add('hidden');
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        ),
        accessor: (user) => (
          <div
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest',
              user.status === 'ACTIVE'
                ? 'bg-green-500/10 text-green-500'
                : user.status === 'PENDING'
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-red-500/10 text-red-500'
            )}
          >
            {user.status}
          </div>
        ),
      },
      {
        header: (
          <button
            className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            onClick={() =>
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
          >
            Joined Date
            {sortOrder === 'desc' ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </button>
        ),
        accessor: 'createdAt',
        className: 'tabular-nums',
      },
      {
        header: 'Permissions',
        accessor: (user) => {
          const mutationVars = permissionsMutation.variables as
            | { id: string; permissions: string[]; permissionType: string }
            | undefined;
          const isUserUpdating =
            permissionsMutation.isPending && mutationVars?.id === user.id;

          const renderCheckbox = (perm: string, label: string) => {
            const isThisPermUpdating =
              isUserUpdating && mutationVars?.permissionType === perm;

            return (
              <label
                className={cn(
                  'flex items-center gap-1.5 cursor-pointer group transition-opacity',
                  isThisPermUpdating && 'opacity-70'
                )}
              >
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                  checked={user.permissions?.includes(perm)}
                  disabled={isThisPermUpdating || user.role === 'SUPER_ADMIN'}
                  onChange={(e) => {
                    const newPerms = e.target.checked
                      ? [...(user.permissions || []), perm]
                      : (user.permissions || []).filter((p) => p !== perm);
                    permissionsMutation.mutate({
                      id: user.id,
                      permissions: newPerms,
                      permissionType: perm,
                    });
                  }}
                />
                <span className="text-[11px] font-bold text-gray-500 group-hover:text-primary transition-colors uppercase">
                  {label}
                </span>
              </label>
            );
          };

          return (
            <div
              className="flex flex-wrap gap-2 items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {renderCheckbox('CREATE', 'CREATE')}
              {renderCheckbox('VIEW', 'VIEW')}
              {renderCheckbox('PUBLISH_TOGGLE', 'REPUBLISH')}
              {renderCheckbox('EDIT', 'EDIT')}
              {renderCheckbox('DELETE', 'DELETE')}
            </div>
          );
        },
      },
      {
        header: 'Actions',
        accessor: (user) => (
          <div
            className="flex justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ActionButton
              icon={
                user.status === 'ACTIVE' ? (
                  <PowerOff className="w-4 h-4" />
                ) : (
                  <Power className="w-4 h-4" />
                )
              }
              variant={user.status === 'ACTIVE' ? 'warning' : 'success'}
              tooltip={
                user.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'
              }
              onClick={() => {
                setSelectedUser(user);
                setActionType('status');
              }}
              disabled={user.role === 'SUPER_ADMIN'}
            />
            <ActionButton
              icon={<Trash2 className="w-4 h-4" />}
              variant="danger"
              tooltip="Delete User"
              onClick={() => {
                setSelectedUser(user);
                setActionType('delete');
              }}
              disabled={user.role === 'SUPER_ADMIN'}
            />
          </div>
        ),
        className: 'text-right',
      },
    ],
    [statusFilter, roleFilter, sortOrder, permissionsMutation]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="DisplayLBold text-gray-900">User Management</h2>
          <p className="ContentMRegular text-gray-400 mt-1">
            Manage and monitor system administrators and entities.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-5 h-5" />}
          onClick={() => setIsModalOpen(true)}
        >
          New Admin
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by name, email or role..."
            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-11 pr-4 ContentMRegular text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={flatUsers}
        isLoading={isLoading}
        onRowClick={(u) => console.log(u)}
        onLoadMore={fetchNextPage}
        hasMore={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />

      {/* Modals */}
      <CreateAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <ConfirmModal
        isOpen={actionType === 'status'}
        onClose={handleCloseModals}
        onConfirm={() =>
          selectedUser &&
          statusMutation.mutate({
            id: selectedUser.id,
            status: selectedUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
          })
        }
        title={
          selectedUser?.status === 'ACTIVE'
            ? 'Deactivate User'
            : 'Activate User'
        }
        message={
          <>
            Are you sure you want to{' '}
            {selectedUser?.status === 'ACTIVE' ? 'deactivate' : 'activate'} user
            <span className="font-bold text-gray-900 mx-1">
              {selectedUser?.name}
            </span>
            ?
          </>
        }
        confirmText={
          selectedUser?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'
        }
        variant={selectedUser?.status === 'ACTIVE' ? 'warning' : 'success'}
        isLoading={statusMutation.isPending}
      />

      <ConfirmModal
        isOpen={actionType === 'delete'}
        onClose={handleCloseModals}
        onConfirm={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
        title="Delete User"
        message={
          <>
            Are you sure you want to permanently delete user
            <span className="font-bold text-gray-900 mx-1">
              {selectedUser?.name}
            </span>
            ?
            <br />
            This action cannot be undone.
          </>
        }
        confirmText="Delete User"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Users;
