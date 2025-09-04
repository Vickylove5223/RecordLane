import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/spinner';
import { ProgressIndicator, CircularProgress } from '@/components/ui/progress-indicator';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Cloud, 
  Scissors,
  X,
  CheckCircle,
  ExternalLink,
  Save,
  Upload,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useRecording } from '../../contexts/RecordingContext';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '@/components/ui/use-toast';

export default function ReviewPanel() {
  const { recordedBlob, deleteRecording, restartRecording, getPreviewUrl } = useRecording();
  const { uploadVideo, isConnected, connectYouTube } = useYouTube();
  const { dispatch } = useApp();
  const { toast } = useToast();

  const [title, setTitle] = useState(`Recording ${new Date().toLocaleDateString()}`);
  const [privacy, setPrivacy] = useState<'private' | 'unlisted' | 'public'>('unlisted');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTrimming, setShowTrimming] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ videoId: string; videoUrl: string } | null>(null);
  const [savedLocally, setSavedLocally] = useState(false);
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);

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

  const handleSaveLocally = async () => {
    if (!recordedBlob) return;

    try {
      // Create a download link
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Add to recordings list as local recording
      const recording = {
        id: Date.now().toString(),
        title,
        duration: duration * 1000,
        createdAt: new Date(),
        privacy: privacy,
        uploadStatus: 'local' as const,
        localBlob: recordedBlob,
      };

      dispatch({ type: 'ADD_RECORDING', payload: recording });
      setSavedLocally(true);

      toast({
        title: "Recording Saved",
        description: "Your recording has been saved locally",
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save recording locally",
        variant: "destructive",
      });
    }
  };

  const handleUploadToYouTube = async () => {
    if (!isConnected) {
      setShowConnectPrompt(true);
      return;
    }

    if (!recordedBlob) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      const result = await uploadVideo(recordedBlob, title, privacy, (progress) => {
        setUploadProgress(progress.percentage);
      });
      
      setUploadProgress(100);
      setUploadSuccess(true);
      setUploadResult(result);

      // Add to recordings list
      const recording = {
        id: Date.now().toString(),
        title,
        youtubeVideoId: result.videoId,
        youtubeLink: result.videoUrl,
        duration: duration * 1000,
        createdAt: new Date(),
        privacy: privacy,
        uploadStatus: 'completed' as const,
      };

      dispatch({ type: 'ADD_RECORDING', payload: recording });

      toast({
        title: "Upload Complete",
        description: "Your recording has been uploaded to YouTube",
      });

      // Show share modal with the result
      dispatch({ 
        type: 'SET_SHARE_MODAL_DATA', 
        payload: { 
          shareLink: result.videoUrl, 
          title 
        } 
      });
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(0);
      setUploadSuccess(false);
      toast({
        title: "Upload Failed",
        description: "Failed to upload recording to YouTube",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsUploading(false), 1000);
    }
  };

  const handleConnectAndUpload = async () => {
    try {
      await connectYouTube();
      setShowConnectPrompt(false);
      // After successful connection, proceed with upload
      await handleUploadToYouTube();
    } catch (error) {
      console.error('Connection failed:', error);
      // Connection error is handled in YouTubeContext
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (uploadSuccess || savedLocally) {
      deleteRecording();
    } else {
      // Show confirmation if recording not saved
      if (window.confirm('Are you sure you want to close without saving your recording?')) {
        deleteRecording();
      }
    }
  };

  if (!recordedBlob || !previewUrl) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => !isUploading && handleClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <div className="p-6 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Review Recording</span>
              {uploadSuccess && <CheckCircle className="h-5 w-5 text-green-500" />}
              {savedLocally && !uploadSuccess && <Save className="h-5 w-5 text-blue-500" />}
            </DialogTitle>
            <DialogDescription>
              {uploadSuccess 
                ? "Your recording has been successfully uploaded to YouTube"
                : savedLocally
                ? "Your recording has been saved locally"
                : "Review your recording and save locally or upload to YouTube"
              }
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Video Preview */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={previewUrl}
                className="w-full h-auto max-h-80"
                onEnded={() => setIsPlaying(false)}
              />
              
              {/* Play/Pause Overlay */}
              {!uploadSuccess && !savedLocally && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={togglePlayPause}
                    disabled={isUploading}
                    className="rounded-full h-16 w-16"
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6 ml-1" />
                    )}
                  </Button>
                </div>
              )}

              {/* Upload Progress Overlay */}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center">
                    <CircularProgress 
                      progress={uploadProgress} 
                      size={80} 
                      className="text-white mb-4"
                    />
                    <p className="text-white text-sm">
                      {uploadSuccess ? 'Upload Complete!' : 'Uploading to YouTube...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            {!uploadSuccess && !savedLocally && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div
                  className="h-2 bg-muted rounded-full cursor-pointer trim-timeline"
                  style={{ '--progress': `${(currentTime / duration) * 100}%` } as any}
                  onClick={(e) => {
                    if (!isUploading) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percent = (e.clientX - rect.left) / rect.width;
                      handleSeek(percent * duration);
                    }
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
            )}

            {/* Recording Details */}
            {!uploadSuccess && !savedLocally && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter recording title"
                    disabled={isUploading}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Privacy</label>
                  <Select value={privacy} onValueChange={(v) => setPrivacy(v as any)} disabled={isUploading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="unlisted">Unlisted (Anyone with link)</SelectItem>
                      <SelectItem value="private">Private (Only you)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <ProgressIndicator
                progress={uploadProgress}
                status={uploadSuccess ? 'completed' : 'uploading'}
                text={uploadSuccess ? 'Upload completed successfully!' : undefined}
              />
            )}

            {/* Success Message with Links */}
            {uploadSuccess && uploadResult && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-green-800 dark:text-green-200">
                      Recording uploaded successfully!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Your recording is now available on YouTube
                    </p>
                    <div className="flex space-x-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(uploadResult.videoUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on YouTube
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Local Save Success */}
            {savedLocally && !uploadSuccess && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Save className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200">
                      Recording saved locally!
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Your recording has been downloaded to your device
                    </p>
                    {!isConnected && (
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Connect YouTube to also sync your recordings online
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Connect YouTube Prompt */}
            {showConnectPrompt && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <WifiOff className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Connect YouTube to Upload
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                      Connect your YouTube account to upload and sync your recordings online.
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={handleConnectAndUpload}
                        disabled={isUploading}
                      >
                        <Wifi className="h-4 w-4 mr-2" />
                        Connect & Upload
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowConnectPrompt(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions Footer */}
        <div className="p-6 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {!uploadSuccess && !savedLocally && (
                <Button
                  variant="outline"
                  onClick={() => setShowTrimming(true)}
                  disabled={isUploading}
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  Trim
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {!uploadSuccess && !savedLocally && (
                <>
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
                    variant="outline"
                    onClick={handleSaveLocally}
                    disabled={isUploading || !title.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Locally
                  </Button>

                  <Button
                    onClick={handleUploadToYouTube}
                    disabled={isUploading || !title.trim()}
                  >
                    {isUploading ? (
                      <LoadingSpinner text="Uploading..." size="sm" />
                    ) : (
                      <>
                        <Cloud className="h-4 w-4 mr-2" />
                        Upload to YouTube
                      </>
                    )}
                  </Button>
                </>
              )}
              
              {(uploadSuccess || savedLocally) && (
                <Button onClick={deleteRecording}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Done
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
