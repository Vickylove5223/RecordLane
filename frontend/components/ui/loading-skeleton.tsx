import React from 'react';
import { Skeleton } from './skeleton';
import { cn } from "@/lib/utils";

interface RecordingSkeletonProps {
  count?: number;
  className?: string;
}

export function RecordingSkeleton({ count = 3, className }: RecordingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-3 border border-border rounded-lg">
          {/* Thumbnail */}
          <Skeleton className="aspect-video w-full mb-3 rounded" />
          
          {/* Title */}
          <Skeleton className="h-4 w-3/4 mb-2" />
          
          {/* Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
          
          {/* Status */}
          <div className="flex items-center justify-between mt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-6 border border-border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-lg mx-auto mb-4" />
          <Skeleton className="h-5 w-24 mx-auto mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      {/* Sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
