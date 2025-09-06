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
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewUrl = getPreviewUrl();

  useEffect(() => {
    if (videoRef.current && previewUrl) {
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded:', video.duration);
        if (isFinite(video.duration) && video.duration > 0) {
          setDuration(video.duration);
          setTrimEnd(video.duration);
          setVideoLoading(false);
        }
      };

      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };

      const handlePlay = () => {
        console.log('Video playing');
        setIsPlaying(true);
      };

      const handlePause = () => {
        console.log('Video paused');
        setIsPlaying(false);
      };

      const handleEnded = () => {
        console.log('Video ended');
        setIsPlaying(false);
        // Reset to beginning when video ends
        video.currentTime = 0;
        setCurrentTime(0);
      };

      const handleError = (e: any) => {
        console.error('Video error:', e);
        toast({
          title: "Video Error",
          description: "Failed to load video preview",
          variant: "destructive",
        });
      };

      const handleCanPlay = () => {
        console.log('Video can play');
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('error', handleError);
      video.addEventListener('canplay', handleCanPlay);

      // Set video source if not already set
      if (video.src !== previewUrl) {
        video.src = previewUrl;
        video.load();
      }

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('error', handleError);
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [previewUrl, toast]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      if (isPlaying) {
        video.pause();
      } else {
        // If video has ended, restart from beginning
        if (video.ended || video.currentTime >= video.duration) {
          video.currentTime = 0;
          setCurrentTime(0);
        }
        
        // Ensure video is ready to play
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA
          video.play().catch(error => {
            console.error('Failed to play video:', error);
            toast({
              title: "Playback Error",
              description: "Failed to play the video preview. Please try again.",
              variant: "destructive",
            });
          });
        } else {
          // Wait for video to be ready
          video.addEventListener('canplay', () => {
            video.play().catch(error => {
              console.error('Failed to play video after canplay:', error);
              toast({
                title: "Playback Error",
                description: "Failed to play the video preview. Please try again.",
                variant: "destructive",
              });
            });
          }, { once: true });
        }
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
      toast({
        title: "Trimming Video",
        description: "Please wait while we trim your video...",
      });
      
      const trimmedVideo = await VideoTrimmingService.trimVideo(recordedBlob, trimStart, trimEnd);
      setTrimmedBlob(trimmedVideo);
      setShowTrimming(false);
      
      // Update the video source to show trimmed version
      const newPreviewUrl = URL.createObjectURL(trimmedVideo);
      if (videoRef.current) {
        videoRef.current.src = newPreviewUrl;
        videoRef.current.load();
        // Reset current time to 0 for the trimmed video
        setCurrentTime(0);
      }
      
      toast({
        title: "Video Trimmed Successfully",
        description: `Video trimmed from ${formatTime(trimStart)} to ${formatTime(trimEnd)}`,
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

  const handleDownload = () => {
    const blobToDownload = trimmedBlob || recordedBlob;
    if (!blobToDownload) {
      toast({
        title: "Download Error",
        description: "No video available to download",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = URL.createObjectURL(blobToDownload);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'recording'}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your video is being downloaded",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSyncToYouTube = async () => {
    if (!isConnected) {
      toast({
        title: "YouTube Not Connected",
        description: "Please connect your YouTube account to sync recordings",
        variant: "destructive",
      });
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
    deleteRecording();
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
    restartRecording();
  };

  if (!recordedBlob || !previewUrl) {
    return null;
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <Dialog open={true} onOpenChange={() => !isUploading && handleClose()}>
        <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
          <div className="p-6 border-b border-border bg-background">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-xl font-semibold">
                <span>Review Recording</span>
                {uploadSuccess && <CheckCircle className="h-5 w-5 text-green-500" />}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground mt-2">
                {uploadSuccess 
                  ? "Your recording has been successfully synced to YouTube"
                  : "Review your recording and sync to YouTube"
                }
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {/* Video Preview */}
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={previewUrl}
                    className="w-full h-auto max-h-96 min-h-64"
                    controls={false}
                    preload="metadata"
                    playsInline
                    onLoadedMetadata={(e) => {
                      console.log('Video metadata loaded in JSX:', e.currentTarget.duration);
                      if (isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) {
                        setDuration(e.currentTarget.duration);
                        setTrimEnd(e.currentTarget.duration);
                        setVideoLoading(false);
                      }
                    }}
                    onError={(e) => {
                      console.error('Video error in JSX:', e);
                      setVideoLoading(false);
                      toast({
                        title: "Video Error",
                        description: "Failed to load video preview",
                        variant: "destructive",
                      });
                    }}
                  />
                  
                  {/* Loading Overlay */}
                  {videoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center">
                        <LoadingSpinner size="lg" />
                        <p className="text-white text-sm mt-2">Loading video preview...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Play/Pause Overlay */}
                  {!uploadSuccess && !videoLoading && (
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
                {!uploadSuccess && !showTrimming && !videoLoading && duration > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="text-foreground">{formatTime(currentTime)}</span>
                      <span className="text-muted-foreground">/ {formatTime(duration)}</span>
                    </div>
                    <div
                      className="h-3 bg-muted rounded-full cursor-pointer trim-timeline relative group"
                      style={{ '--progress': `${progressPercentage}%` } as any}
                      onClick={(e) => {
                        if (!isUploading && duration > 0) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                          const newTime = percent * duration;
                          handleSeek(newTime);
                        }
                      }}
                    >
                      <div
                        className="h-full bg-primary rounded-full relative transition-all duration-200"
                        style={{ width: `${progressPercentage}%` }}
                      >
                        <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-primary rounded-full border-2 border-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                      <div className="absolute inset-0 flex items-center">
                        <div 
                          className="h-full bg-primary/30 rounded-full"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Trimming Interface */}
                {showTrimming && (
                  <div className="space-y-6 p-6 bg-muted rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <Scissors className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Trim Video</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Start Time</label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="range"
                            min={0}
                            max={duration}
                            step={0.1}
                            value={trimStart}
                            onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <span className="text-sm font-mono w-20 text-center bg-background px-2 py-1 rounded border">
                            {formatTime(trimStart)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">End Time</label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="range"
                            min={0}
                            max={duration}
                            step={0.1}
                            value={trimEnd}
                            onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <span className="text-sm font-mono w-20 text-center bg-background px-2 py-1 rounded border">
                            {formatTime(trimEnd)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Duration: {formatTime(trimEnd - trimStart)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Button variant="outline" onClick={() => setShowTrimming(false)}>
                        Cancel
                      </Button>
                      <div className="flex space-x-3">
                        <Button 
                          onClick={handleTrim} 
                          disabled={trimStart >= trimEnd || (trimEnd - trimStart) < 1}
                          className="min-w-[120px]"
                        >
                          <Scissors className="h-4 w-4 mr-2" />
                          Apply Trim
                        </Button>
                        <Button 
                          onClick={handleDownload}
                          variant="outline"
                          className="min-w-[140px]"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Locally
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recording Details */}
                {!uploadSuccess && !showTrimming && (
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
            {!uploadSuccess && (
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
            
            {uploadSuccess && (
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
