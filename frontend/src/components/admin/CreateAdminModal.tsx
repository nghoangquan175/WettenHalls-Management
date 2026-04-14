import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal/Modal';
import { ConfirmModal } from '../ui/Modal/ConfirmModal';
import { Input } from '../ui/Form/Input';
import { Button } from '../ui/Button/Button';
import { User, Mail, Lock } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const createAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'GUEST']),
});

type CreateAdminFormValues = z.infer<typeof createAdminSchema>;

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAdminModal: React.FC<CreateAdminModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<CreateAdminFormValues | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      role: 'ADMIN',
    },
  });

  const mutation = useMutation({
    mutationFn: adminService.createUser,
    onSuccess: () => {
      // Refresh dashboard stats and user list
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    },
    onSettled: () => {
      setShowConfirm(false);
    },
  });

  const handleClose = () => {
    reset();
    setShowConfirm(false);
    setFormData(null);
    onClose();
  };

  const onPreSubmit = (data: CreateAdminFormValues) => {
    setFormData(data);
    setShowConfirm(true);
  };

  const onConfirmCreate = () => {
    if (formData) {
      mutation.mutate(formData);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Create New Administrator"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit(onPreSubmit)}
              disabled={mutation.isPending}
            >
              Create Account
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-4">
          {mutation.isError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm animate-in fade-in duration-300">
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'An error occurred while creating the account'}
            </div>
          )}

          <Input
            label="Full Name"
            placeholder="John Doe"
            leftIcon={<User className="w-5 h-5" />}
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Work Email"
            type="email"
            placeholder="admin@wettenhalls.com"
            leftIcon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Initial Password"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-5 h-5" />}
            error={errors.password?.message}
            {...register('password')}
          />
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmCreate}
        title="Confirm Account Creation"
        message={
          <>
            Are you sure you want to create a new administrator account for
            <span className="font-bold text-gray-900 mx-1">
              {formData?.name}
            </span>
            ?
            <br />
            An invitation will be sent to{' '}
            <span className="font-medium text-primary">{formData?.email}</span>.
          </>
        }
        confirmText="Confirm Creation"
        isLoading={mutation.isPending}
      />
    </>
  );
};
