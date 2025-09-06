import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  WifiOff,
  AlertTriangle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  Clock,
  Calendar,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { useRecording } from '../../contexts/RecordingContext';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { YouTubeCommentsService, YouTubeComment } from '../../services/youtubeCommentsService';
import { VideoTrimmingService } from '../../services/videoTrimmingService';

export default function ReviewPanel() {
  const { recordedBlob, deleteRecording, restartRecording, getPreviewUrl } = useRecording();
  const { uploadVideo, isConnected, connectYouTube } = useYouTube();
  const { dispatch } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();

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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewUrl = getPreviewUrl();

  useEffect(() => {
    if (videoRef.current && previewUrl) {
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        if (isFinite(video.duration)) {
          setDuration(video.duration);
          setTrimEnd(video.duration);
        }
      };

      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };

      const handlePlay = () => {
        setIsPlaying(true);
      };

      const handlePause = () => {
        setIsPlaying(false);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        // Reset to beginning when video ends
        video.currentTime = 0;
        setCurrentTime(0);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [previewUrl]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // If video has ended, restart from beginning
        if (videoRef.current.ended || videoRef.current.currentTime >= videoRef.current.duration) {
          videoRef.current.currentTime = 0;
        }
        videoRef.current.play().catch(error => {
          console.error('Failed to play video:', error);
          toast({
            title: "Playback Error",
            description: "Failed to play the video preview",
            variant: "destructive",
          });
        });
      }
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTrim = async () => {
    if (!recordedBlob || trimStart >= trimEnd) {
      toast({
        title: "Invalid Trim Range",
        description: "Please select a valid trim range",
        variant: "destructive",
      });
      return;
    }

    try {
      const trimmedVideo = await VideoTrimmingService.trimVideo(recordedBlob, trimStart, trimEnd);
      setTrimmedBlob(trimmedVideo);
      setShowTrimming(false);
      
      toast({
        title: "Video Trimmed",
        description: "Your video has been trimmed successfully",
      });
    } catch (error) {
      console.error('Trim failed:', error);
      toast({
        title: "Trim Failed",
        description: "Failed to trim the video. Please try again.",
        variant: "destructive",
      });
    }
  };


  const handleSaveLocally = async () => {
    const blobToSave = trimmedBlob || recordedBlob;
    if (!blobToSave) return;

    try {
      const url = URL.createObjectURL(blobToSave);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const recording = {
        id: Date.now().toString(),
        title,
        duration: duration * 1000,
        createdAt: new Date(),
        privacy: privacy,
        uploadStatus: 'local' as const,
        localBlob: blobToSave,
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

  const handleSyncToYouTube = async () => {
    if (!isConnected) {
      setShowConnectPrompt(true);
      return;
    }

    const blobToUpload = trimmedBlob || recordedBlob;
    if (!blobToUpload) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      const result = await uploadVideo(blobToUpload, title, privacy, (progress) => {
        setUploadProgress(progress.percentage);
      });
      
      setUploadProgress(100);
      setUploadSuccess(true);
      setUploadResult(result);

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
        title: "Sync Complete",
        description: "Your recording has been synced to YouTube",
      });

      navigate(`/recording/${recording.id}`);
      
    } catch (error) {
      console.error('Sync failed:', error);
      setUploadProgress(0);
      setUploadSuccess(false);
      toast({
        title: "Sync Failed",
        description: "Failed to sync recording to YouTube",
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
      await handleSyncToYouTube();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (uploadSuccess || savedLocally) {
      deleteRecording();
    } else {
      // Simple confirmation without permission modal
      deleteRecording();
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirmation(false);
    deleteRecording();
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const handleRestart = () => {
    // Simple restart without permission modal
    restartRecording();
  };

  if (!recordedBlob || !previewUrl) {
    return null;
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <Dialog open={true} onOpenChange={() => !isUploading && handleClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <div className="p-6 border-b border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>Review Recording</span>
                {uploadSuccess && <CheckCircle className="h-5 w-5 text-green-500" />}
                {savedLocally && !uploadSuccess && <Save className="h-5 w-5 text-blue-500" />}
              </DialogTitle>
              <DialogDescription>
                {uploadSuccess 
                  ? "Your recording has been successfully synced to YouTube"
                  : savedLocally
                  ? "Your recording has been saved locally"
                  : "Review your recording and save locally or sync to YouTube"
                }
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Video Preview */}
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={previewUrl}
                    className="w-full h-auto max-h-80"
                    controls={false}
                    onLoadedMetadata={(e) => {
                      if (isFinite(e.currentTarget.duration)) {
                        setDuration(e.currentTarget.duration);
                        setTrimEnd(e.currentTarget.duration);
                      }
                    }}
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
                          {uploadSuccess ? 'Sync Complete!' : 'Syncing to YouTube...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                {!uploadSuccess && !savedLocally && !showTrimming && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div
                      className="h-2 bg-muted rounded-full cursor-pointer trim-timeline"
                      style={{ '--progress': `${progressPercentage}%` } as any}
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
                        style={{ width: `${progressPercentage}%` }}
                      >
                        <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Trimming Interface */}
                {showTrimming && (
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <h3 className="text-lg font-medium">Trim Video</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium">Start:</label>
                        <input
                          type="range"
                          min={0}
                          max={duration}
                          step={0.1}
                          value={trimStart}
                          onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm w-16">{formatTime(trimStart)}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium">End:</label>
                        <input
                          type="range"
                          min={0}
                          max={duration}
                          step={0.1}
                          value={trimEnd}
                          onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm w-16">{formatTime(trimEnd)}</span>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowTrimming(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleTrim} disabled={trimStart >= trimEnd}>
                        Apply Trim
                      </Button>
                    </div>
                  </div>
                )}

                {/* Recording Details */}
                {!uploadSuccess && !savedLocally && !showTrimming && (
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
                    text={uploadSuccess ? 'Sync completed successfully!' : undefined}
                  />
                )}

                {/* Success Message with Links */}
                {uploadSuccess && uploadResult && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-green-800 dark:text-green-200">
                          Recording synced successfully!
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
                          Connect YouTube to Sync
                        </h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                          Connect your YouTube account to sync and share your recordings online.
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={handleConnectAndUpload}
                            disabled={isUploading}
                          >
                            <Wifi className="h-4 w-4 mr-2" />
                            Connect & Sync
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
          </div>

          {/* Actions Footer */}
          <div className="p-6 border-t border-border">
            {!uploadSuccess && !savedLocally && (
              <div className="flex flex-col space-y-3">
                {/* First row of buttons */}
                <div className="flex items-center justify-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowTrimming(!showTrimming)}
                    disabled={isUploading}
                    className="flex-1 max-w-[180px]"
                  >
                    <Scissors className="h-4 w-4 mr-2" />
                    {showTrimming ? 'Cancel Trim' : 'Trim'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleRestart}
                    disabled={isUploading}
                    className="flex-1 max-w-[180px]"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart
                  </Button>
                </div>

                {/* Second row of buttons */}
                <div className="flex items-center justify-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleSaveLocally}
                    disabled={isUploading || !title.trim()}
                    className="flex-1 max-w-[180px]"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Locally
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleDeleteClick}
                    disabled={isUploading}
                    className="flex-1 max-w-[180px] text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>

                {/* Sync to YouTube button - full width */}
                <Button
                  onClick={handleSyncToYouTube}
                  disabled={isUploading || !title.trim()}
                  className="w-full"
                >
                  {isUploading ? (
                    <LoadingSpinner text="Syncing..." size="sm" />
                  ) : (
                    <>
                      <Cloud className="h-4 w-4 mr-2" />
                      Sync to YouTube
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {(uploadSuccess || savedLocally) && (
              <Button onClick={deleteRecording} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Delete Recording</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this recording? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Recording
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
