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
  const [copied, setCopied] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
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

  const youtubeEmbedUrl = getYouTubeEmbedUrl(recording.youtubeLink);
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

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (recording.youtubeVideoId) {
        const { RealYouTubeService } = await import('../../services/realYouTubeService');
        await RealYouTubeService.deleteVideo(recording.youtubeVideoId);
      }
      
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
                  variant={recording.uploadStatus === 'completed' ? 'default' : 'destructive'}
                  className="flex items-center space-x-1"
                >
                  {recording.uploadStatus === 'completed' ? (
                    <><Wifi className="h-3 w-3" />Synced</>
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
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    {youtubeError || 'Video not available for preview'}
                  </p>
                  {recording.youtubeLink && youtubeError && (
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
