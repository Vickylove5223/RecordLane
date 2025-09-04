import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Copy, 
  ExternalLink, 
  Mail, 
  MessageSquare,
  Check
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '@/components/ui/use-toast';

export default function ShareModal() {
  const { state, dispatch } = useApp();
  const [privacy, setPrivacy] = useState('unlisted');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const isOpen = state.shareModalOpen;
  const shareLink = state.shareModalData?.shareLink || '';
  const title = state.shareModalData?.title || '';

  const handleClose = () => {
    dispatch({ type: 'SET_SHARE_MODAL_OPEN', payload: false });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleEmailShare = () => {
    const subject = `Check out my recording: ${title}`;
    const body = `I've shared a recording with you:\n\n${shareLink}`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const handleSlackShare = () => {
    // This would typically integrate with Slack API or use Slack's sharing URL
    const slackText = `Check out my recording: ${title} - ${shareLink}`;
    const slackUrl = `https://slack.com/intl/en-gb/help/articles/201330736-Add-apps-to-your-Slack-workspace?text=${encodeURIComponent(slackText)}`;
    window.open(slackUrl, '_blank');
  };

  if (!isOpen || !shareLink) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Recording</DialogTitle>
          <DialogDescription>
            Your recording has been uploaded to YouTube
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex space-x-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Privacy</label>
            <Select value={privacy} onValueChange={(v) => setPrivacy(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="unlisted">Unlisted (Anyone with link)</SelectItem>
                <SelectItem value="private">Private (Only you)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Changes to privacy settings are applied on YouTube.
            </p>
          </div>

          {/* Quick Share Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Quick Share</h4>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={handleEmailShare}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <Mail className="h-4 w-4" />
                <span className="text-xs">Email</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSlackShare}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">Slack</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open(shareLink, '_blank')}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-xs">Open</span>
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={() => window.open(shareLink, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in YouTube
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
