import React from 'react';
import { Progress } from './progress';
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Upload, AlertCircle } from 'lucide-react';

interface ProgressIndicatorProps {
  progress: number;
  status: 'uploading' | 'completed' | 'failed' | 'pending';
  text?: string;
  className?: string;
}

export function ProgressIndicator({ progress, status, text, className }: ProgressIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Upload complete';
      case 'failed':
        return 'Upload failed';
      case 'uploading':
        return `Uploading... ${Math.round(progress)}%`;
      case 'pending':
        return 'Pending upload';
      default:
        return '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-foreground">
            {text || getStatusText()}
          </span>
        </div>
        {status === 'uploading' && (
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        )}
      </div>
      
      {(status === 'uploading' || status === 'pending') && (
        <Progress 
          value={status === 'uploading' ? progress : 0} 
          className="h-2" 
        />
      )}
    </div>
  );
}

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularProgress({ 
  progress, 
  size = 40, 
  strokeWidth = 4,
  className 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-300 ease-in-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
