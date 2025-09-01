import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Cloud, 
  Scissors,
  X
} from 'lucide-react';
import { useRecording } from '../../contexts/RecordingContext';
import { useDrive } from '../../contexts/DriveContext';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '@/components/ui/use-toast';

export default function ReviewPanel() {
  const { recordedBlob, deleteRecording, restartRecording, getPreviewUrl } = useRecording();
  const { uploadFile } = useDrive();
  const { dispatch } = useApp();
  const { toast } = useToast();

  const [title, setTitle] = useState(`Recording ${new Date().toLocaleDateString()}`);
  const [privacy, setPrivacy] = useState('anyone-viewer');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTrimming, setShowTrimming] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewUrl = getPreviewUrl();

  useEffect(() => {
    if (videoRef.current && previewUrl) {
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
        setTrimEnd(video.duration);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [previewUrl]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleUpload = async () => {
    if (!recordedBlob) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      const result = await uploadFile(recordedBlob, title, privacy);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add to recordings list
      const recording = {
        id: Date.now().toString(),
        title,
        driveFileId: result.fileId,
        driveLink: result.shareLink,
        duration: duration * 1000,
        createdAt: new Date(),
        privacy: privacy as any,
        uploadStatus: 'completed' as const,
      };

      dispatch({ type: 'ADD_RECORDING', payload: recording });

      toast({
        title: "Upload Complete",
        description: "Your recording has been saved to Google Drive",
      });

      // Show share modal logic would go here
      deleteRecording(); // Clean up local recording
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: "Failed to upload recording to Google Drive",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!recordedBlob || !previewUrl) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => deleteRecording()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Recording</DialogTitle>
          <DialogDescription>
            Review your recording and upload to Google Drive
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={previewUrl}
              className="w-full h-auto max-h-96"
              onEnded={() => setIsPlaying(false)}
            />
            
            {/* Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
              <Button
                size="lg"
                variant="secondary"
                onClick={togglePlayPause}
                className="rounded-full h-16 w-16"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div
              className="h-2 bg-muted rounded-full cursor-pointer trim-timeline"
              style={{ '--progress': `${(currentTime / duration) * 100}%` } as any}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                handleSeek(percent * duration);
              }}
            >
              <div
                className="h-full bg-primary rounded-full relative"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background" />
              </div>
            </div>
          </div>

          {/* Recording Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter recording title"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Privacy</label>
              <Select value={privacy} onValueChange={setPrivacy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private (Only you)</SelectItem>
                  <SelectItem value="anyone-viewer">Anyone with link (Viewer)</SelectItem>
                  <SelectItem value="anyone-commenter">Anyone with link (Commenter)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading to Google Drive...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowTrimming(true)}
                disabled={isUploading}
              >
                <Scissors className="h-4 w-4 mr-2" />
                Trim
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={deleteRecording}
                disabled={isUploading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              
              <Button
                variant="outline"
                onClick={restartRecording}
                disabled={isUploading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart
              </Button>

              <Button
                onClick={handleUpload}
                disabled={isUploading || !title.trim()}
              >
                <Cloud className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Sync to Drive'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
