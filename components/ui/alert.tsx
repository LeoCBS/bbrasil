import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type AlertVariant = 'error' | 'success' | 'info';

interface AlertProps {
  variant: AlertVariant;
  message: string;
  onClose?: () => void;
  autoClose?: number;
}

export function Alert({ variant, message, onClose }: AlertProps) {
  const variantStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'text-red-600'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: 'text-green-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'text-blue-600'
    }
  };

  const style = variantStyles[variant];
  const Icon = variant === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div className={`flex gap-2 rounded-md border ${style.bg} ${style.border} ${style.text} p-3 text-sm`}>
      <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${style.icon}`} />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
