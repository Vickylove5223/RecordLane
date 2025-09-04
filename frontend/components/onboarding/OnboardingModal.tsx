import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/spinner';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { 
  Shield, 
  Zap, 
  Cloud, 
  Video,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Download
} from 'lucide-react';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '@/components/ui/use-toast';

export default function OnboardingModal() {
  const { connectYouTube, isConnecting, isConnected, connectionError, retryConnection } = useYouTube();
  const { dispatch } = useApp();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      await connectYouTube();
      if (isConnected) {
        dispatch({ type: 'SET_ONBOARDED', payload: true });
      }
    } catch (error) {
      console.error('Connection failed:', error);
      // Error is handled in YouTubeContext
    }
  };

  const handleRetry = async () => {
    try {
      await retryConnection();
      if (isConnected) {
        dispatch({ type: 'SET_ONBOARDED', payload: true });
      }
    } catch (error) {
      console.error('Retry failed:', error);
      toast({
        title: "Retry Failed",
        description: "Failed to establish connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = () => {
    dispatch({ type: 'SET_ONBOARDED', payload: true });
    toast({
      title: "Welcome to RecordLane",
      description: "You can connect YouTube anytime from settings to sync your recordings.",
    });
  };

  const handleComplete = () => {
    dispatch({ type: 'SET_ONBOARDED', payload: true });
  };

  const features = [
    {
      icon: Play,
      title: 'Instant Recording',
      description: 'Start recording immediately without any setup. Works offline.',
      color: 'text-green-500',
    },
    {
      icon: Download,
      title: 'Local Storage',
      description: 'Recordings are saved to your device first for instant access.',
      color: 'text-blue-500',
    },
    {
      icon: Cloud,
      title: 'Optional Cloud Sync',
      description: 'Connect YouTube to automatically sync and share recordings online.',
      color: 'text-purple-500',
    },
  ];

  const getConnectionStatus = () => {
    if (connectionError) return 'error';
    if (isConnecting) return 'connecting';
    if (isConnected) return 'connected';
    return 'disconnected';
  };

  const getConnectionText = () => {
    if (connectionError) return `Demo Mode Available`;
    if (isConnecting) return 'Connecting to YouTube...';
    if (isConnected) return 'Successfully connected to YouTube';
    return 'Ready to connect';
  };

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 border-0 bg-transparent shadow-none">
        <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 text-center overflow-hidden">
          {/* Background blur effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl" />
          
          {/* Content */}
          <div className="relative z-10">
            {/* Logo/Icon */}
            <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Video className="h-10 w-10 text-white" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              RecordLane
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Beautiful screen recordings with instant YouTube sync and privacy-first design
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start space-x-3 text-left">
                  <div className={`p-2 rounded-lg ${feature.color} bg-opacity-10`}>
                    <feature.icon className={`h-4 w-4 ${feature.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Connection Status */}
            {(isConnecting || connectionError) && (
              <div className="mb-6">
                <ConnectionStatus 
                  status={getConnectionStatus()}
                  text={getConnectionText()}
                  className="mx-auto"
                />
              </div>
            )}

            {/* Error Display */}
            {connectionError && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1 text-sm">
                      Demo Mode Available
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      RecordLane is running in demo mode. You can start recording immediately, and connect YouTube later for cloud sync.
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={handleRetry}
                        disabled={isConnecting}
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300"
                      >
                        {isConnecting ? (
                          <LoadingSpinner text="Retrying..." size="sm" />
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try YouTube Again
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSkip}
                        className="text-blue-700 hover:bg-blue-100 dark:text-blue-300"
                      >
                        Continue in Demo Mode
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Call to Action */}
            {!isConnected ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Get Started</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You can start recording immediately! Connect YouTube for cloud sync, or skip to record locally.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    size="lg"
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full h-12 bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isConnecting ? (
                      <LoadingSpinner text="Connecting..." size="sm" />
                    ) : (
                      <>
                        <Cloud className="h-5 w-5 mr-2" />
                        Connect YouTube
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleSkip}
                    disabled={isConnecting}
                    className="w-full h-12 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-all duration-200"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-medium">Connected Successfully!</span>
                </div>
                <Button 
                  onClick={handleComplete} 
                  size="lg" 
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Continue to RecordLane
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            )}

            {/* Footer */}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-6">
              {!isConnected 
                ? "YouTube connection is optional. You can record locally and connect later from settings."
                : "You can disconnect or reconnect anytime from settings."
              }
            </p>

            {/* Credits */}
            <div className="mt-4 text-xs text-gray-400 dark:text-gray-600">
              Created with lots of ☕ 💜 🎵 🐦 @RecordLaneHQ
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
