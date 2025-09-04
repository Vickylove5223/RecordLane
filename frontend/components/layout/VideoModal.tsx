import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  Download, 
  ExternalLink,
  Share,
  Trash2,
  Clock,
  Calendar,
  Wifi,
  WifiOff,
  Copy,
  Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useApp } from '../../contexts/AppContext';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface VideoModalProps {
  recording: any;
  onClose: () => void;
}

export default function VideoModal({ recording, onClose }: VideoModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { dispatch } = useApp();
  const { isConnected } = useYouTube();
  const { toast } = useToast();

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        if (isFinite(video.duration)) {
          setDuration(video.duration);
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
  }, [recording]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
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

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (recording.localBlob) {
      const url = URL.createObjectURL(recording.localBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recording.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your recording is being downloaded",
      });
    } else {
      toast({
        title: "Download Unavailable",
        description: "This recording is not available for download",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (recording.youtubeLink) {
      try {
        await navigator.clipboard.writeText(recording.youtubeLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        
        toast({
          title: "Link Copied",
          description: "YouTube link copied to clipboard",
        });
      } catch (error) {
        console.error('Failed to copy:', error);
        toast({
          title: "Copy Failed",
          description: "Failed to copy link to clipboard",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "No Share Link",
        description: "This recording hasn't been synced to YouTube yet",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      dispatch({ type: 'REMOVE_RECORDING', payload: recording.id });
      onClose();
      
      toast({
        title: "Recording Deleted",
        description: "The recording has been removed from your library",
      });
    }
  };

  const getVideoSource = () => {
    if (recording.localBlob) {
      return URL.createObjectURL(recording.localBlob);
    }
    return null;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const videoSource = getVideoSource();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <div className="p-6 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <span className="truncate">{recording.title}</span>
              <Badge 
                variant={
                  recording.uploadStatus === 'completed' 
                    ? 'default' 
                    : recording.uploadStatus === 'local' 
                    ? 'secondary' 
                    : 'destructive'
                }
                className="flex items-center space-x-1"
              >
                {recording.uploadStatus === 'completed' ? (
                  <><Wifi className="h-3 w-3" />Synced</>
                ) : recording.uploadStatus === 'local' ? (
                  <><Download className="h-3 w-3" />Local</>
                ) : (
                  <><WifiOff className="h-3 w-3" />Failed</>
                )}
              </Badge>
            </DialogTitle>
            <DialogDescription className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(recording.duration)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}</span>
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 flex flex-col p-6">
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            {videoSource ? (
              <>
                <video
                  ref={videoRef}
                  src={videoSource}
                  className="w-full h-auto max-h-96"
                  controls={false}
                  poster={recording.thumbnail}
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
              </>
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Video not available for preview</p>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          {videoSource && (
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div
                className="h-2 bg-muted rounded-full cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  handleSeek(percent * duration);
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

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {recording.localBlob && (
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            
            {recording.youtubeLink && (
              <>
                <Button variant="outline" onClick={handleShare}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.open(recording.youtubeLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in YouTube
                </Button>
              </>
            )}
            
            <Button variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
