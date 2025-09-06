import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  AlertTriangle,
  Trash2,
  ExternalLink,
  Download
} from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recording: {
    title: string;
    youtubeLink?: string;
    localBlob?: Blob;
    uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed' | 'local';
  };
  isDeleting?: boolean;
}

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  recording,
  isDeleting = false 
}: DeleteConfirmationModalProps) {
  const hasYouTubeVideo = !!recording.youtubeLink && recording.uploadStatus === 'completed';
  const hasLocalVideo = !!recording.localBlob || recording.uploadStatus === 'local';

  const getDeletionScope = () => {
    if (hasYouTubeVideo && hasLocalVideo) {
      return 'both local and YouTube versions';
    } else if (hasYouTubeVideo) {
      return 'YouTube video';
    } else if (hasLocalVideo) {
      return 'local recording';
    }
    return 'recording';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Delete Recording</span>
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to delete this recording? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">{recording.title}</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {hasLocalVideo && (
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Local recording available</span>
                </div>
              )}
              {hasYouTubeVideo && (
                <div className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>Synced to YouTube</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive font-medium">
              This will permanently delete the {getDeletionScope()}.
            </p>
            {hasYouTubeVideo && (
              <p className="text-xs text-destructive/80 mt-1">
                The YouTube video will be removed from your channel.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center space-x-2"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete {getDeletionScope()}</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
