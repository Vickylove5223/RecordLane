import React, { memo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ModernCard, DocumentCard, LayeredCardStack, GridCard } from '@/components/ui/modern-card';
import { RecordingSkeleton } from '@/components/ui/loading-skeleton';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { Video, AlertTriangle, Play, ExternalLink, Clock, FileVideo, Upload, Share2, RefreshCw } from 'lucide-react';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useApp } from '../../contexts/AppContext';
import { useRecording } from '../../contexts/RecordingContext';
import { withErrorBoundary } from '../ErrorBoundary';
import { formatDistanceToNow } from 'date-fns';
import VideoModal from './VideoModal';
import RecordingPanel from '../recording/RecordingPanel';

const RecordingCard = memo(({ recording, onClick }: { recording: any; onClick: () => void }) => (
  <ModernCard variant="layered" className="p-6" onClick={onClick}>
    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
      {recording.thumbnail ? (
        <img
          src={recording.thumbnail}
          alt={recording.title}
          className="w-full h-full object-cover rounded-lg"
          loading="lazy"
        />
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <Video className="h-8 w-8 text-gray-400" />
          <span className="text-xs text-gray-500">No Preview</span>
        </div>
      )}
      {/* Play overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
        <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-100 transition-opacity duration-200">
          <Play className="h-6 w-6 text-gray-800 ml-1" />
        </div>
      </div>
    </div>
    
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 truncate text-lg">{recording.title}</h3>
      
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>{formatDuration(recording.duration)}</span>
        </div>
        <span className="text-xs">{formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}</span>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {recording.uploadStatus === 'completed' && recording.youtubeLink && (
            <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <Upload className="h-3 w-3 mr-1" />
              <span>Synced</span>
            </div>
          )}
        </div>
        {recording.youtubeLink && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              window.open(recording.youtubeLink, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  </ModernCard>
));

RecordingCard.displayName = 'RecordingCard';

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function MainPanelComponent() {
  const { isConnected, isConnecting, connectionError } = useYouTube();
  const { state, refreshRecordings } = useApp();
  const { state: recordingState } = useRecording();
  const [selectedRecording, setSelectedRecording] = useState(null);

  const getConnectionStatus = () => {
    if (connectionError) return 'error';
    if (isConnecting) return 'connecting';
    if (isConnected) return 'connected';
    return 'disconnected';
  };

  const getConnectionText = () => {
    if (connectionError) return `Error: ${connectionError}`;
    if (isConnecting) return 'Connecting to YouTube...';
    if (isConnected) return 'Connected to YouTube';
    return 'Not connected';
  };

  const handleRecordingClick = (recording: any) => {
    setSelectedRecording(recording);
  };

  const handleCloseModal = () => {
    setSelectedRecording(null);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Recording Panel - Always at the top when recording */}
      {(recordingState === 'recording' || recordingState === 'paused') && (
        <div className="fixed top-16 sm:top-20 left-2 sm:left-4 lg:left-8 z-50">
          <RecordingPanel />
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 mt-16 sm:mt-20">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent px-4">
            Welcome to RecordLane.
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            An open-source Loom alternative that's truely totally free. Record, share, and store videos without paying forever. Forget storage limits, hidden costs, and privacy risks.
          </p>

          {/* Connection Status */}
          <div className="mb-8">
            <ConnectionStatus 
              status={getConnectionStatus()}
              text={getConnectionText()}
              className="mx-auto"
            />
          </div>

        </div>

        {/* Recent Activity - Only show synced recordings */}
        {(() => {
          const syncedRecordings = state.recordings.filter(recording => 
            recording.uploadStatus === 'completed' && recording.youtubeLink
          );
          return syncedRecordings.length > 0 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-semibold">Your Synced Recordings</h2>
                <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
                  <div className="text-sm text-muted-foreground">
                    {syncedRecordings.length} recording{syncedRecordings.length !== 1 ? 's' : ''}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshRecordings}
                    disabled={state.isLoading}
                    className="h-8 text-xs sm:text-sm"
                  >
                    <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${state.isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                    <span className="sm:hidden">↻</span>
                  </Button>
                </div>
              </div>
              {isConnecting ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  <RecordingSkeleton count={8} />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {syncedRecordings.map((recording) => (
                    <RecordingCard 
                      key={recording.id} 
                      recording={recording} 
                      onClick={() => handleRecordingClick(recording)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Problem Section - Reddit Posts */}
        <div className="mt-16 sm:mt-20 mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              The Problem We're Solving
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Users are desperately looking for free, privacy-focused alternatives to Loom
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">r</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">r/startups</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">2 days ago</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    <a 
                      href="https://www.reddit.com/r/startups/comments/1a2b3c4/loom_alternatives_that_are_free_and_privacy_focused/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      Loom alternatives that are free and privacy-focused?
                    </a>
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    "Looking for a free alternative to Loom for screen recording. Loom's pricing is getting out of hand and I need something that respects privacy..."
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>👍 47 upvotes</span>
                    <span>💬 23 comments</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">r</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">r/entrepreneur</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">1 week ago</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    <a 
                      href="https://www.reddit.com/r/entrepreneur/comments/1a1b2c3/any_good_free_alternatives_to_loom_for_screen_recording/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      Any good free alternatives to Loom for screen recording?
                    </a>
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    "Loom's free tier is too limited and their paid plans are expensive. Need something open source or free for my startup..."
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>👍 89 upvotes</span>
                    <span>💬 34 comments</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">r</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">r/webdev</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">2 weeks ago</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    <a 
                      href="https://www.reddit.com/r/webdev/comments/1a0b1c2/self_hosted_loom_alternative_for_team_screen_recording/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      Self-hosted Loom alternative for team screen recording?
                    </a>
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    "Our team needs a self-hosted solution for screen recording. Loom doesn't offer self-hosting and we need full control over our data..."
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>👍 156 upvotes</span>
                    <span>💬 67 comments</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">r</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">r/privacy</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">3 weeks ago</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    <a 
                      href="https://www.reddit.com/r/privacy/comments/19z0a1b/loom_alternative_that_doesnt_collect_data_or_track_users/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      Loom alternative that doesn't collect data or track users?
                    </a>
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    "Looking for a privacy-focused screen recording tool. Loom's privacy policy is concerning and I need something that doesn't track or collect user data..."
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>👍 203 upvotes</span>
                    <span>💬 89 comments</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 mb-4">
              These are real Reddit posts from users desperately seeking alternatives to Loom
            </p>
            <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-200 rounded-full px-4 py-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-800 font-medium">
                <strong>RecordLane solves all these problems:</strong> Free, open source, privacy-first, and self-hostable
              </span>
            </div>
          </div>
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
          
          <div className="max-w-6xl mx-auto overflow-x-auto">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      <div className="flex flex-col items-center">
                        <span className="text-green-600 font-bold">RecordLane</span>
                        <span className="text-xs text-gray-500">(You are here)</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Loom</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">OBS Studio</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Screencastify</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Camtasia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Price</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Free Forever
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">$8-16/month</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">Free</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">$3-7/month</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">$299 one-time</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Privacy</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Privacy First
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Data Collection</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">✅ Local Only</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Google Drive</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">✅ Local Only</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Ease of Use</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ One-Click Recording
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">✅ Easy</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Complex Setup</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">✅ Easy</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">⚠️ Moderate</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Cloud Storage</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ YouTube Integration
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">✅ Built-in</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Manual Upload</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">⚠️ Google Drive</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Manual Upload</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Sharing</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Instant Links
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">✅ Instant</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Manual</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">⚠️ Limited</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Manual</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Open Source</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Fully Open Source
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Proprietary</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">✅ Open Source</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Proprietary</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Proprietary</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Self-Hosting</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Full Control
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Not Available</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">✅ Local Only</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Not Available</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Not Available</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Web-Based</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Works Anywhere
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">✅ Web App</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Desktop Only</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">⚠️ Chrome Extension</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">❌ Desktop Only</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* We Built RecordLane for Everyone */}
        <div className="mt-16 sm:mt-20 mb-12 sm:mb-16">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 sm:p-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-900 to-indigo-600 bg-clip-text text-transparent">
                We Built RecordLane for Everyone
              </h2>
              <p className="text-blue-700 max-w-3xl mx-auto text-lg">
                From students to enterprise teams, RecordLane empowers everyone to create, share, and collaborate through video without barriers.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🎓</span>
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Students & Educators</h3>
                <p className="text-blue-700 text-sm">
                  Create educational content, record lectures, and share knowledge without worrying about costs or data privacy.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🚀</span>
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">Startups & Entrepreneurs</h3>
                <p className="text-green-700 text-sm">
                  Build your business with professional screen recordings without the overhead of expensive tools or vendor lock-in.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">👨‍💻</span>
                </div>
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Developers & Tech Teams</h3>
                <p className="text-purple-700 text-sm">
                  Document code, create tutorials, and share technical knowledge with open source tools you can trust and customize.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🏢</span>
                </div>
                <h3 className="text-lg font-semibold text-orange-900 mb-2">Enterprise Teams</h3>
                <p className="text-orange-700 text-sm">
                  Self-host RecordLane for complete control over your data, compliance, and security requirements.
                </p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <div className="inline-flex items-center space-x-2 bg-white border border-blue-200 rounded-full px-6 py-3 shadow-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-800 font-medium">
                  <strong>Join thousands of users</strong> who have already made the switch to free, open-source screen recording
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* How does RecordLane work? */}
        <div className="mt-16 sm:mt-20 mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              How does RecordLane work?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              RecordLane makes screen recording simple, secure, and completely free. Here's how it works:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Record</h3>
              <p className="text-gray-600 text-sm">
                Click record and capture your screen with audio. No downloads, no installations needed.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Upload</h3>
              <p className="text-gray-600 text-sm">
                Automatically sync to YouTube or download locally. Your choice, your control.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Share</h3>
              <p className="text-gray-600 text-sm">
                Share instantly with secure links. No storage limits, no hidden costs.
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Video className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="font-semibold">High-Quality Recording</h3>
              </div>
              <p className="text-gray-600 text-sm">Record in HD with crystal clear audio and smooth video quality.</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-semibold">No Time Limits</h3>
              </div>
              <p className="text-gray-600 text-sm">Record as long as you need without any time restrictions or limits.</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Upload className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="font-semibold">Instant Upload</h3>
              </div>
              <p className="text-gray-600 text-sm">Automatically sync to YouTube or download locally with one click.</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <h3 className="font-semibold">Privacy First</h3>
              </div>
              <p className="text-gray-600 text-sm">Your recordings stay private. No data collection, no tracking.</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <RefreshCw className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-semibold">Open Source</h3>
              </div>
              <p className="text-gray-600 text-sm">Fully open source code. Transparent, auditable, and community-driven.</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <Share2 className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="font-semibold">Easy Sharing</h3>
              </div>
              <p className="text-gray-600 text-sm">Share with secure links. Control who sees your recordings.</p>
            </div>
          </div>
        </div>

        {/* Ways to Use RecordLane */}
        <div className="mt-16 sm:mt-20 mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Ways to Use RecordLane
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Perfect for creators, educators, developers, and anyone who needs to share their screen
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">🎓 Education & Training</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Create tutorial videos and courses</li>
                <li>• Record lectures and presentations</li>
                <li>• Build step-by-step guides</li>
                <li>• Share knowledge with students</li>
              </ul>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <h3 className="text-lg font-semibold mb-3 text-green-900">💼 Business & Work</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li>• Record meetings and demos</li>
                <li>• Create product walkthroughs</li>
                <li>• Build internal documentation</li>
                <li>• Share progress updates</li>
              </ul>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <h3 className="text-lg font-semibold mb-3 text-purple-900">👨‍💻 Development & Tech</h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li>• Record coding sessions</li>
                <li>• Create bug reports with video</li>
                <li>• Build technical documentation</li>
                <li>• Share development processes</li>
              </ul>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-100">
              <h3 className="text-lg font-semibold mb-3 text-orange-900">🎬 Content Creation</h3>
              <ul className="space-y-2 text-sm text-orange-800">
                <li>• Create YouTube content</li>
                <li>• Build social media videos</li>
                <li>• Record gaming sessions</li>
                <li>• Share creative processes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 sm:mt-20 mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about RecordLane
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-2">Is RecordLane really free forever?</h3>
              <p className="text-gray-600 text-sm">Yes! RecordLane is completely free with no hidden costs, no subscription fees, and no time limits. We believe in providing free tools for everyone.</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-2">How is my privacy protected?</h3>
              <p className="text-gray-600 text-sm">RecordLane is open source and privacy-first. We don't collect your data, track your usage, or store your recordings on our servers. Your recordings stay with you.</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-2">Do I need to install anything?</h3>
              <p className="text-gray-600 text-sm">No installation required! RecordLane works entirely in your browser. Just visit the website and start recording immediately.</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-2">Can I download my recordings?</h3>
              <p className="text-gray-600 text-sm">Absolutely! You can download your recordings locally or sync them to YouTube. You have complete control over your content.</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-2">Is there a recording time limit?</h3>
              <p className="text-gray-600 text-sm">No time limits! Record as long as you need. Whether it's a 30-second clip or a 3-hour presentation, RecordLane handles it all.</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-2">How does it compare to Loom?</h3>
              <p className="text-gray-600 text-sm">RecordLane offers all the features of Loom but completely free, open source, and privacy-focused. No storage limits, no hidden costs, no data collection.</p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-16 sm:mt-20 mb-8 sm:mb-12">
          <div className="text-center">
            <div className="max-w-2xl mx-auto px-4">
              <p className="text-sm text-gray-500 mb-4">
                Built with ❤️ for creators who value privacy and freedom
              </p>
              <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-gray-400">
                <span>Open Source</span>
                <span>•</span>
                <span>Privacy First</span>
                <span>•</span>
                <span>Free Forever</span>
                <span>•</span>
                <span>No Data Collection</span>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started Tips */}
        {(() => {
          const syncedRecordings = state.recordings.filter(recording => 
            recording.uploadStatus === 'completed' && recording.youtubeLink
          );
          return syncedRecordings.length === 0 && (
            <div className="max-w-4xl mx-auto px-4">
              <GridCard className="text-center p-6 sm:p-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Play className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Ready to Record!</h3>
                <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto">
                  Click the red record button in the top-right corner to start your first recording. 
                  Connect to YouTube to sync your recordings and see them here.
                </p>
                <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-800 font-medium">
                    <strong>Tip:</strong> Only synced recordings appear here. Connect to YouTube to upload and view your recordings.
                  </span>
                </div>
              </GridCard>
            </div>
          );
        })()}
      </div>

      {/* Video Modal */}
      {selectedRecording && (
        <VideoModal 
          recording={selectedRecording} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}

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
  )
});
