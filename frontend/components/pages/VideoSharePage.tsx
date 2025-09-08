import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ModernCard, DocumentCard, GridCard } from '@/components/ui/modern-card';
import { 
  Download, 
  ExternalLink,
  Trash2,
  Clock,
  Calendar,
  Wifi,
  WifiOff,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  FolderOpen,
  FileVideo,
  MessageCircle,
  Send,
  Heart,
  Reply
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '../../contexts/AppContext';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';
import { YouTubeCommentsService, YouTubeComment } from '../../services/youtubeCommentsService';

export default function VideoSharePage() {
  const { recordingId } = useParams<{ recordingId: string }>();
  const navigate = useNavigate();
  const [recording, setRecording] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { state } = useApp();
  const { isConnected } = useYouTube();
  const { toast } = useToast();

  // Load recording data based on ID
  useEffect(() => {
    const loadRecording = () => {
      if (!recordingId) {
        navigate('/');
        return;
      }

      // Find recording by ID in the app state
      const foundRecording = state.recordings.find(r => r.id === recordingId);
      if (foundRecording) {
        setRecording(foundRecording);
        setIsLoading(false);
      } else {
        // If not found in local state, try to load from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const title = urlParams.get('title');
        const youtubeId = urlParams.get('youtubeId');
        const youtubeLink = urlParams.get('youtubeLink');
        const duration = urlParams.get('duration');
        const createdAt = urlParams.get('createdAt');

        if (title && (youtubeId || youtubeLink)) {
          setRecording({
            id: recordingId,
            title,
            youtubeVideoId: youtubeId,
            youtubeLink: youtubeLink,
            duration: duration ? parseInt(duration) : 0,
            createdAt: createdAt ? new Date(createdAt) : new Date(),
            uploadStatus: 'completed'
          });
          setIsLoading(false);
        } else {
          navigate('/');
        }
      }
    };

    loadRecording();
  }, [recordingId, state.recordings, navigate]);

  const handleCopyLink = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleOpenYouTube = () => {
    if (recording?.youtubeLink) {
      window.open(recording.youtubeLink, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!recording) return;

    setIsDeleting(true);
    try {
      // Delete from YouTube if synced
      if (recording.youtubeVideoId) {
        const { SupabaseYouTubeService } = await import('../../services/supabaseYouTubeService');
        await SupabaseYouTubeService.deleteVideo(recording.youtubeVideoId);
      }

      // Remove from local state
      // Note: In a real app, you'd also need to remove from the parent component's state
      toast({
        title: "Recording deleted",
        description: "The recording has been successfully deleted",
      });

      // Navigate back to home
      navigate('/');
    } catch (error) {
      console.error('Failed to delete recording:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the recording",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasYouTubeVideo = recording?.youtubeVideoId && recording?.youtubeLink;
  const videoId = recording?.youtubeVideoId;

  // Helper function to extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      } else if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      }
    } catch (error) {
      console.error('Invalid YouTube URL:', url, error);
    }
    return null;
  };

  const loadComments = useCallback(async () => {
    if (!videoId) return;
    
    setLoadingComments(true);
    try {
      console.log('Loading comments for videoId:', videoId);
      const response = await YouTubeCommentsService.getComments(videoId);
      console.log('Comments response:', response);
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
  }, [videoId, toast]);

  // Load comments when component mounts
  useEffect(() => {
    if (videoId && isConnected) {
      loadComments();
    }
  }, [videoId, isConnected, loadComments]);

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
      const reply = await YouTubeCommentsService.addComment(videoId, replyText.trim(), parentId);
      setComments(prev => prev.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: [...(comment.replies || []), reply] }
          : comment
      ));
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading recording...</p>
        </div>
      </div>
    );
  }

  if (!recording || !hasYouTubeVideo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Recording not found</h1>
          <p className="text-muted-foreground mb-4">The recording you're looking for doesn't exist or is not available on YouTube.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{recording.title}</h1>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(recording.duration || 0)}</span>
                  <span>•</span>
                  <Calendar className="h-4 w-4" />
                  <span>{formatDistanceToNow(recording.createdAt)} ago</span>
                  <span>•</span>
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Wifi className="h-3 w-3" />
                    <span>Synced</span>
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex items-center space-x-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenYouTube}
                className="flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open in YouTube</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* YouTube Video */}
          <div className="flex-1">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${recording.youtubeVideoId}?autoplay=0&rel=0`}
                className="w-full aspect-video"
                allowFullScreen
                title={recording.title}
              />
            </div>
          </div>

          {/* Comments Section */}
          <div className="w-80 border-l bg-background flex flex-col">
            {/* Action Buttons */}
            <div className="p-4 border-b">
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleCopyLink} className="flex-1 justify-center">
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleOpenYouTube}
                  className="flex-1 justify-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in YouTube
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 justify-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

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
            <div className="flex-1 overflow-y-auto">
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
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {comment.authorDisplayName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{comment.authorDisplayName}</span>
                            <span className="text-xs text-muted-foreground">
                              {comment.publishedAt ? new Date(comment.publishedAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{comment.textDisplay}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <button className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground">
                              <Heart className="h-3 w-3" />
                              <span>{comment.likeCount || 0}</span>
                            </button>
                            {comment.canReply && (
                              <button 
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Reply
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Reply Form */}
                      {replyingTo === comment.id && (
                        <div className="ml-10 flex space-x-2">
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
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-10 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start space-x-2">
                              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                                {reply.authorDisplayName?.charAt(0) || 'U'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-xs">{reply.authorDisplayName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {reply.publishedAt ? new Date(reply.publishedAt).toLocaleDateString() : ''}
                                  </span>
                                </div>
                                <p className="text-xs mt-1">{reply.textDisplay}</p>
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
      </div>
       {/* Delete Confirmation Modal */}
       <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        recording={recording}
        isLoading={isDeleting}
      />
    </div>
  );
}
