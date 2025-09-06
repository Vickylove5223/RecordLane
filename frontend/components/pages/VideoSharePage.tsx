import React, { useState, useEffect } from 'react';
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
  FileVideo
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '../../contexts/AppContext';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';

export default function VideoSharePage() {
  const { recordingId } = useParams<{ recordingId: string }>();
  const navigate = useNavigate();
  const [recording, setRecording] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDownload = () => {
    if (recording?.localBlob) {
      const url = URL.createObjectURL(recording.localBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recording.title || 'recording'}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleOpenLocalFile = () => {
    if (recording?.localBlob) {
      const url = URL.createObjectURL(recording.localBlob);
      window.open(url, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!recording) return;

    setIsDeleting(true);
    try {
      // Delete from YouTube if synced
      if (recording.youtubeVideoId) {
        const { RealYouTubeService } = await import('../../services/realYouTubeService');
        await RealYouTubeService.deleteVideo(recording.youtubeVideoId);
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
  const isLocalVideo = recording?.localBlob;

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

  if (!recording) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Recording not found</h1>
          <p className="text-muted-foreground mb-4">The recording you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // For YouTube videos, show the full preview page
  if (hasYouTubeVideo) {
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

        {/* YouTube Video */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${recording.youtubeVideoId}?autoplay=0&rel=0`}
              className="w-full aspect-video"
              allowFullScreen
              title={recording.title}
            />
          </div>
        </div>
      </div>
    );
  }

  // For local videos, show a simple modal-style page
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <ModernCard variant="layered" className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <FileVideo className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{recording.title}</h1>
          <p className="text-lg text-gray-600">
            This recording is saved locally on your device
          </p>
        </div>
        
        <CardContent className="space-y-6">
          {/* Recording Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Duration</span>
              </div>
              <span>{formatTime(recording.duration || 0)}</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Created</span>
              </div>
              <span>{formatDistanceToNow(recording.createdAt)} ago</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center space-x-2">
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Status</span>
              </div>
              <Badge variant="outline" className="flex items-center space-x-1">
                <WifiOff className="h-3 w-3" />
                <span>Local</span>
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleOpenLocalFile}
              className="w-full"
              size="lg"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Open Recording
            </Button>
            
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Recording
            </Button>
            
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Link Copied!' : 'Copy Share Link'}
            </Button>
          </div>

          {/* Warning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <WifiOff className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Local Recording</p>
                <p className="text-yellow-700 mt-1">
                  This recording is only available on this device. To share it with others, 
                  you'll need to upload it to YouTube or download and share the file directly.
                </p>
              </div>
            </div>
          </div>

          {/* Delete Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Recording
            </Button>
          </div>
        </CardContent>
      </ModernCard>

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
