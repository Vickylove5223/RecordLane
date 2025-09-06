import React, { useEffect } from 'react';
import VideoPreviewPage from '../preview/VideoPreviewPage';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoModalProps {
  recording: any;
  onClose: () => void;
}

export default function VideoModal({ recording, onClose }: VideoModalProps) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full h-full max-w-7xl max-h-[95vh] bg-background rounded-lg shadow-2xl overflow-hidden">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 p-0 bg-background/80 hover:bg-background/90"
        >
          <X className="h-4 w-4" />
        </Button>
        
        {/* Video Preview Content */}
        <VideoPreviewPage 
          recording={recording} 
          onClose={onClose} 
        />
      </div>
    </div>
  );
}
