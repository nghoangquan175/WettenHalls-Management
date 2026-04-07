import React from 'react';
import { Modal } from './Modal';
import { Button, type ButtonVariant } from '../Button/Button';
import { AlertCircle, HelpCircle, Info, CheckCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'primary' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'primary',
  isLoading = false
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertCircle className="w-12 h-12 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-12 h-12 text-amber-500" />;
      case 'info':
        return <Info className="w-12 h-12 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      default:
        return <HelpCircle className="w-12 h-12 text-primary" />;
    }
  };

  const getButtonVariant = (): ButtonVariant => {
    switch (variant) {
      case 'danger': return 'danger';
      case 'warning': return 'warning';
      case 'success': return 'success';
      default: return 'primary';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getButtonVariant()}
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-4">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300",
          variant === 'danger' ? "bg-red-50" : 
          variant === 'warning' ? "bg-amber-50" :
          variant === 'info' ? "bg-blue-50" :
          variant === 'success' ? "bg-green-50" : "bg-primary/10"
        )}>
          {getIcon()}
        </div>
        <div className="space-y-2">
          <p className="ContentMRegular text-gray-600">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};
