import React from 'react';
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  text?: string;
  className?: string;
}

export function ConnectionStatus({ status, text, className }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          text: text || 'Connected',
        };
      case 'disconnected':
        return {
          icon: XCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          text: text || 'Disconnected',
        };
      case 'connecting':
        return {
          icon: Loader2,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          text: text || 'Connecting...',
          animate: true,
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          text: text || 'Connection error',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          text: 'Unknown status',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn(
      'inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <Icon 
        className={cn(
          'h-4 w-4',
          config.color,
          config.animate && 'animate-spin'
        )} 
      />
      <span className={cn('font-medium', config.color)}>
        {config.text}
      </span>
    </div>
  );
}
