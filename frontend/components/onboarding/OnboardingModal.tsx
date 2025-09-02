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
import { ScrollArea } from '@/components/ui/scroll-area';
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
      dispatch({ type: 'SET_ONBOARDED', payload: true });
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
    if (connectionError) return `Error: ${connectionError}`;
    if (isConnecting) return 'Connecting to YouTube...';
    if (isConnected) return 'Successfully connected to YouTube';
    return 'Ready to connect';
  };

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="text-center mb-6">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Video className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Welcome to RecordLane</DialogTitle>
              <DialogDescription className="text-lg">
                Record your screen and camera instantly, with optional YouTube sync
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Features */}
              <div className="grid gap-4">
                {features.map((feature) => (
                  <Card key={feature.title} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-lg bg-background ${feature.color}`}>
                          <feature.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* YouTube Benefits */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Cloud className="h-5 w-5 mr-2 text-blue-500" />
                    YouTube Sync Benefits (Optional)
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span>Automatic cloud backup to your YouTube channel</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span>Instant shareable links for collaboration</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                      <span>Access recordings from any device</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Connection Status */}
              {isConnecting || connectionError ? (
                <div className="text-center py-4">
                  <ConnectionStatus 
                    status={getConnectionStatus()}
                    text={getConnectionText()}
                    className="mx-auto"
                  />
                </div>
              ) : null}

              {/* Error Display */}
              {connectionError && (
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">
                          Connection Failed
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                          {connectionError}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={handleRetry}
                            disabled={isConnecting}
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
                          >
                            {isConnecting ? (
                              <LoadingSpinner text="Retrying..." size="sm" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSkip}
                            className="text-red-700 hover:bg-red-100 dark:text-red-300"
                          >
                            Skip for now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Call to Action */}
              <div className="text-center space-y-4 pt-4">
                {!isConnected ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Get Started</h3>
                      <p className="text-sm text-muted-foreground">
                        You can start recording immediately! Connect YouTube for cloud sync, or skip to record locally.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        size="lg"
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="flex-1 sm:flex-none"
                      >
                        {isConnecting ? (
                          <LoadingSpinner text="Connecting..." size="sm" />
                        ) : (
                          <>
                            <Cloud className="h-4 w-4 mr-2" />
                            Connect YouTube
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleSkip}
                        disabled={isConnecting}
                        className="flex-1 sm:flex-none"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Recording
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Connected Successfully!</span>
                    </div>
                    <Button onClick={handleComplete} size="lg" className="w-full max-w-xs">
                      Continue to RecordLane
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {!isConnected 
                    ? "YouTube connection is optional. You can record locally and connect later from settings."
                    : "You can disconnect or reconnect anytime from settings."
                  }
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
