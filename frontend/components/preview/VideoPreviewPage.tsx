import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  Check,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Loader2,
  ArrowLeft,
  MessageCircle,
  Heart,
  Reply,
  MoreHorizontal,
  Send
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useApp } from '../../contexts/AppContext';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { YouTubeCommentsService, YouTubeComment } from '../../services/youtubeCommentsService';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';

interface VideoPreviewPageProps {
  recording: any;
  onClose: () => void;
}

export default function VideoPreviewPage({ recording, onClose }: VideoPreviewPageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const { dispatch } = useApp();
  const { isConnected } = useYouTube();
  const { toast } = useToast();

  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      let videoId: string | null = null;
      if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&showinfo=0&controls=1&enablejsapi=1`;
      }
    } catch (error) {
      console.error('Invalid YouTube URL:', url, error);
      setYoutubeError('Invalid YouTube URL');
    }
    return null;
  };

  const getLocalVideoSource = () => {
    if (recording.localBlob) {
      return URL.createObjectURL(recording.localBlob);
    }
    if (recording.localPath) {
      return recording.localPath;
    }
    return null;
  };

  const videoSource = getLocalVideoSource();
  const youtubeEmbedUrl = getYouTubeEmbedUrl(recording.youtubeLink);
  const hasLocalVideo = !!videoSource;
  const hasYouTubeVideo = !!youtubeEmbedUrl;
  const videoId = recording.youtubeVideoId;

  // Load comments when component mounts
  useEffect(() => {
    if (videoId && isConnected) {
      loadComments();
    }
  }, [videoId, isConnected]);

  const loadComments = async () => {
    if (!videoId) return;
    
    setLoadingComments(true);
    try {
      const response = await YouTubeCommentsService.getComments(videoId);
      setComments(response.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast({
        title: "Comments Unavailable",
        description: "Could not load comments from YouTube",
        variant: "destructive",
      });
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !videoId) return;
    
    try {
      const comment = await YouTubeCommentsService.addComment(videoId, newComment.trim());
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      toast({
        title: "Comment Added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        title: "Comment Failed",
        description: "Could not post your comment",
        variant: "destructive",
      });
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || !videoId) return;
    
    try {
      const comment = await YouTubeCommentsService.addComment(videoId, replyText.trim(), parentId);
      setComments(prev => 
        prev.map(c => 
          c.id === parentId 
            ? { ...c, replies: [...(c.replies || []), comment] }
            : c
        )
      );
      setReplyText('');
      setReplyingTo(null);
      toast({
        title: "Reply Added",
        description: "Your reply has been posted",
      });
    } catch (error) {
      console.error('Failed to add reply:', error);
      toast({
        title: "Reply Failed",
        description: "Could not post your reply",
        variant: "destructive",
      });
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await YouTubeCommentsService.likeComment(commentId);
      setComments(prev =>
        prev.map(comment => 
          comment.id === commentId
            ? { ...comment, likeCount: comment.likeCount + 1, viewerRating: 'like' }
            : comment
        )
      );
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  // Video event handlers (same as before)
  useEffect(() => {
    if (videoRef.current && videoSource) {
      const video = videoRef.current;
      setIsLoading(true);
      setVideoError(null);
      
      const handleLoadedMetadata = () => {
        if (isFinite(video.duration)) {
          setDuration(video.duration);
        }
        setIsLoading(false);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };

      const handlePlay = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      const handlePause = () => {
        setIsPlaying(false);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        video.currentTime = 0;
        setCurrentTime(0);
      };

      const handleError = () => {
        setVideoError('Failed to load video');
        setIsLoading(false);
        console.error('Video load error:', video.error);
      };

      const handleLoadStart = () => {
        setIsLoading(true);
      };

      const handleCanPlay = () => {
        setIsLoading(false);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('canplay', handleCanPlay);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [videoSource]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
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

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        videoRef.current.play().catch(error => {
          console.error('Failed to play video:', error);
        });
      }
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete from YouTube if synced
      if (hasYouTubeVideo && recording.youtubeVideoId) {
        const { RealYouTubeService } = await import('../../services/realYouTubeService');
        await RealYouTubeService.deleteVideo(recording.youtubeVideoId);
      }
      
      // Remove from local state
      dispatch({ type: 'REMOVE_RECORDING', payload: recording.id });
      
      toast({
        title: "Recording Deleted",
        description: "The recording has been removed from your library",
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to delete recording:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the recording",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
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

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Cleanup video source URL when component unmounts
  useEffect(() => {
    return () => {
      if (videoSource && videoSource.startsWith('blob:')) {
        URL.revokeObjectURL(videoSource);
      }
    };
  }, [videoSource]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold truncate max-w-md">{recording.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(recording.duration)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}</span>
                </div>
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
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {recording.youtubeLink && (
              <Button variant="outline" onClick={handleShare}>
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            )}
            
            {recording.youtubeLink && (
              <Button 
                variant="outline" 
                onClick={() => window.open(recording.youtubeLink, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in YouTube
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Video Player */}
        <div className="flex-1 flex flex-col">
          <div 
            ref={containerRef}
            className="relative bg-black flex-1 group"
          >
            {youtubeEmbedUrl && !youtubeError ? (
              <div className="relative w-full h-full">
                <iframe
                  src={youtubeEmbedUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  onError={() => setYoutubeError('Failed to load YouTube video')}
                />
              </div>
            ) : hasLocalVideo && !videoError ? (
              <>
                <video
                  ref={videoRef}
                  src={videoSource!}
                  className="w-full h-full object-contain"
                  controls={false}
                  poster={recording.thumbnail}
                  preload="metadata"
                />
                
                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                
                {/* Play/Pause Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <div className="flex space-x-2">
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
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={restartVideo}
                      className="rounded-full h-16 w-16"
                    >
                      <RotateCcw className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                {/* Video Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-2 text-white">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                    />
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20 ml-auto"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    {videoError || youtubeError || 'Video not available for preview'}
                  </p>
                  {hasYouTubeVideo && youtubeError && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(recording.youtubeLink, '_blank')}
                      className="mt-2"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open in YouTube
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Timeline for local videos */}
          {hasLocalVideo && !youtubeEmbedUrl && (
            <div className="bg-background border-t p-4">
              <div className="space-y-2">
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
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="w-96 border-l bg-background flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Comments ({comments.length})
            </h3>
          </div>

          {/* Add Comment */}
          {isConnected && videoId && (
            <div className="p-4 border-b">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <Button 
                  size="sm" 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div ref={commentsRef} className="flex-1 overflow-y-auto">
            {loadingComments ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No comments yet</p>
                {!isConnected && (
                  <p className="text-xs mt-1">Connect to YouTube to view comments</p>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-2">
                    {/* Main Comment */}
                    <div className="flex space-x-3">
                      <img
                        src={comment.authorProfileImageUrl}
                        alt={comment.authorDisplayName}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{comment.authorDisplayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.publishedAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.textDisplay}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleLikeComment(comment.id)}
                            className="h-6 px-2 text-xs"
                          >
                            <Heart className="h-3 w-3 mr-1" />
                            {comment.likeCount}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="h-6 px-2 text-xs"
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <div className="ml-11 flex space-x-2">
                        <input
                          type="text"
                          placeholder="Write a reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleReply(comment.id)}
                          className="flex-1 px-3 py-2 border rounded-md text-sm"
                        />
                        <Button 
                          size="sm" 
                          onClick={() => handleReply(comment.id)}
                          disabled={!replyText.trim()}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-11 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex space-x-3">
                            <img
                              src={reply.authorProfileImageUrl}
                              alt={reply.authorDisplayName}
                              className="w-6 h-6 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-xs">{reply.authorDisplayName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(reply.publishedAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-xs mt-1">{reply.textDisplay}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleLikeComment(reply.id)}
                                  className="h-5 px-2 text-xs"
                                >
                                  <Heart className="h-3 w-3 mr-1" />
                                  {reply.likeCount}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        recording={recording}
        isDeleting={isDeleting}
      />
    </div>
  );
}
