import React, { memo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ModernCard, DocumentCard, LayeredCardStack, GridCard } from '@/components/ui/modern-card';
import { RecordingSkeleton } from '@/components/ui/loading-skeleton';
import { Video, AlertTriangle, Play, ExternalLink, Clock, FileVideo, Upload, Share2, RefreshCw, Settings } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useRecording } from '../../contexts/RecordingContext';
import { withErrorBoundary } from '../ErrorBoundary';
import { TestimonialCarousel } from '../ui/testimonial-carousel';
import { ComparisonTable } from '../ui/comparison-table';
import { formatDistanceToNow } from 'date-fns';
import VideoModal from './VideoModal';
import RecordingPanel from '../recording/RecordingPanel';

// Testimonial data for the carousel
const testimonialData = [
  {
    id: '1',
    content: "Looking for a free alternative to Loom for screen recording. Loom's pricing is getting out of hand and I need something that respects privacy...",
    subreddit: 'r/startups',
    timeAgo: '2 days ago',
    redditUrl: 'https://www.reddit.com/r/startups/comments/1a2b3c4/loom_alternatives_that_are_free_and_privacy_focused/'
  },
  {
    id: '2',
    content: "Loom's free tier is too limited and their paid plans are expensive. Need something open source or free for my startup...",
    subreddit: 'r/entrepreneur',
    timeAgo: '1 week ago',
    redditUrl: 'https://www.reddit.com/r/entrepreneur/comments/1a1b2c3/any_good_free_alternatives_to_loom_for_screen_recording/'
  },
  {
    id: '3',
    content: "Our team needs a self-hosted solution for screen recording. Loom doesn't offer self-hosting and we need full control over our data...",
    subreddit: 'r/webdev',
    timeAgo: '2 weeks ago',
    redditUrl: 'https://www.reddit.com/r/webdev/comments/1a0b1c2/self_hosted_loom_alternative_for_team_screen_recording/'
  },
  {
    id: '4',
    content: "Looking for a privacy-focused screen recording tool. Loom's privacy policy is concerning and I need something that doesn't track or collect user data...",
    subreddit: 'r/privacy',
    timeAgo: '3 weeks ago',
    redditUrl: 'https://www.reddit.com/r/privacy/comments/19z0a1b/loom_alternative_that_doesnt_collect_data_or_track_users/'
  }
];

const RecordingCard = memo(({ recording, onClick }: { recording: any; onClick: () => void }) => (
  <ModernCard variant="layered" className="p-6" onClick={onClick}>
    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-blue-500/20"></div>
      <div className="relative z-10 flex items-center justify-center">
        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
          <Play className="h-8 w-8 text-red-600 ml-1" />
        </div>
      </div>
      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        {Math.round(recording.duration || 0)}s
      </div>
    </div>
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-900 truncate">
        {recording.title || 'Untitled Recording'}
      </h3>
      <p className="text-sm text-gray-600">
        {formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}
      </p>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>{recording.duration || 0}s</span>
        <FileVideo className="h-3 w-3 ml-2" />
        <span>{Math.round((recording.file_size || 0) / 1024 / 1024)}MB</span>
      </div>
    </div>
  </ModernCard>
));

RecordingCard.displayName = 'RecordingCard';

const MainPanelComponent = () => {
  const { recordings = [], isLoading = false, error = null } = useApp();
  const { isRecording = false, startRecording, stopRecording } = useRecording();
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleRecordingClick = (recording: any) => {
    setSelectedRecording(recording);
    setShowVideoModal(true);
  };

  const handleCloseModal = () => {
    setShowVideoModal(false);
    setSelectedRecording(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <RecordingSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Recordings</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center pt-16 sm:pt-20 lg:pt-24 mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Cancel your Loom, Tella, etc Subscription for RecordLane
          </h1>
          <p className="text-[24px] text-gray-600 max-w-3xl mx-auto mb-8">
            An open-source Loom alternative that's truly totally free. Record, share, and store videos without paying forever. Forget storage limits, hidden costs, and privacy risks.
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="mb-16 sm:mb-20">
          <TestimonialCarousel testimonials={testimonialData} />
        </div>

        {/* Why Choose RecordLane */}
        <div className="mt-16 sm:mt-20 mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Why Choose RecordLane?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See how RecordLane compares to other screen recording solutions
            </p>
          </div>
          
          <ComparisonTable />
        </div>

        {/* How does RecordLane work? */}
        <div className="mt-16 sm:mt-20 mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              How does RecordLane work?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              RecordLane makes screen recording simple, secure, and completely free. Connect to YouTube, record with advanced features, and sync everything automatically. Here's how it works:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Connect YouTube</h3>
              <p className="text-gray-600 text-sm">
                Go to the settings page and connect your YouTube account. This enables automatic uploads and secure storage.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Start Recording</h3>
              <p className="text-gray-600 text-sm">
                Click the record button in the header, select your options (screen, camera, or both), and start recording. Use pause, stop, and highlighting features as needed.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Sync & Share</h3>
              <p className="text-gray-600 text-sm">
                Your video automatically syncs to YouTube. Share instantly, enable comments, download locally, or get direct links. Full control over your content.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 sm:mt-20 mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Features of RecordLane
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need for professional screen recording, completely free
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">One-Click Recording</h3>
              <p className="text-gray-600 text-sm">
                Start recording instantly with a single click. No complex setup or configuration needed.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">YouTube Integration</h3>
              <p className="text-gray-600 text-sm">
                Seamlessly upload your recordings directly to YouTube with automatic processing.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Sharing</h3>
              <p className="text-gray-600 text-sm">
                Get shareable links immediately after recording. No waiting, no processing delays.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Processing</h3>
              <p className="text-gray-600 text-sm">
                Your videos are processed in real-time as you record. No post-processing needed.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Time Limits</h3>
              <p className="text-gray-600 text-sm">
                Record for as long as you need. No artificial time restrictions or watermarks.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileVideo className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">High Quality</h3>
              <p className="text-gray-600 text-sm">
                Record in high definition with crystal clear audio. Professional quality every time.
              </p>
            </div>
          </div>
        </div>


        {/* Why I Created RecordLane */}
        <div className="mt-16 sm:mt-20 mb-12 sm:mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-lg border border-gray-200 rounded-lg p-8 sm:p-12">
              <h2 className="text-xl font-semibold text-black mb-6">
                Why I Created RecordLane
              </h2>
              <div className="text-black space-y-4 leading-relaxed">
                <p>
                  I absolutely <strong>love Loom</strong>. The ease with which they make recording and sharing videos with clients and teammates is pure genius. It's one of those tools that just works perfectly.
                </p>
                <p>
                  But here's the thing - I only use it occasionally. I kept finding myself wanting to subscribe to Loom, but then I'd think "what if I don't use it this month?" and end up not subscribing at all. I might not even use more than once or twice in a month.
                </p>
                <p>
                  Other open-source Loom alternatives out there don't provide an easy way to use by non-technical people, as users still have to pay a subscription fee due to video hosting, which is proper. And not everyone out there wants to self-host a video tool they use once in a while - at least not me.
                </p>
                <p>
                  It broke my heart to keep missing out on such a brilliant product just because I couldn't justify $8-16/month for something I might not use regularly. So I decided to create RecordLane - a free alternative that syncs with YouTube, so I can have that same ease of use without the subscription pressure.
                </p>
                <p className="text-sm text-gray-600 mt-6">
                  - Ifeoluwa Ajetomobi
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 sm:mt-20 mb-12 sm:mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Everything you need to know about RecordLane
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Is RecordLane really free?
                </h3>
                <p className="text-gray-600">
                  Yes! RecordLane is completely free to use. No hidden costs, no subscription fees, no storage limits. We believe everyone should have access to professional screen recording tools.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  How does YouTube integration work?
                </h3>
                <p className="text-gray-600">
                  RecordLane automatically syncs your recordings to YouTube. You can choose to make them public, private, or unlisted. Your videos are stored on YouTube's servers, so you never have to worry about storage limits.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Do I need to install anything?
                </h3>
                <p className="text-gray-600">
                  No installation required! RecordLane runs entirely in your browser. Just visit our website, grant camera and microphone permissions, and start recording.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  What browsers are supported?
                </h3>
                <p className="text-gray-600">
                  RecordLane works on Chrome, Firefox, Edge, and Safari. For the best experience, we recommend using the latest version of Chrome or Edge.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Can I record without YouTube?
                </h3>
                <p className="text-gray-600">
                  Absolutely! YouTube integration is optional. You can record locally and download your videos without connecting to YouTube. The choice is yours.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Is my data private and secure?
                </h3>
                <p className="text-gray-600">
                  Yes! We take privacy seriously. Your recordings are only stored where you choose (locally or on YouTube). We don't collect or store your personal data without your explicit consent.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recordings Grid */}
        {recordings && recordings.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Your Recordings</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recordings.slice(0, 8).map((recording: any) => (
                <RecordingCard
                  key={recording.id}
                  recording={recording}
                  onClick={() => handleRecordingClick(recording)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recording Panel */}
        {isRecording && <RecordingPanel />}

        {/* Video Modal */}
        {showVideoModal && selectedRecording && (
          <VideoModal
            recording={selectedRecording}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </div>
  );
};

// Export with error boundary
export default withErrorBoundary(MainPanelComponent, {
  fallback: (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to Load Main Panel</h2>
        <p className="text-muted-foreground">Please refresh the page to try again.</p>
      </div>
    </div>
  ),
});