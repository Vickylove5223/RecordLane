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
  RefreshCw
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

  const handleComplete = () => {
    dispatch({ type: 'SET_ONBOARDED', payload: true });
  };

  const features = [
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your recordings are uploaded to your YouTube channel as unlisted videos.',
      color: 'text-green-500',
    },
    {
      icon: Zap,
      title: 'One-Click Recording',
      description: 'Start recording instantly with screen, camera, or both in picture-in-picture mode.',
      color: 'text-blue-500',
    },
    {
      icon: Cloud,
      title: 'Automatic Sync',
      description: 'Recordings are automatically uploaded to your YouTube channel with reliable retry logic.',
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
                Record your screen and camera with instant YouTube sync
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
                        {!isConnecting && isConnected && (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Connection Status */}
              <div className="text-center py-4">
                <ConnectionStatus 
                  status={getConnectionStatus()}
                  text={getConnectionText()}
                  className="mx-auto"
                />
              </div>

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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Call to Action */}
              <div className="text-center space-y-4 pt-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Connect YouTube to get started</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll upload your recordings to your YouTube channel with enhanced token management
                    and automatic retry capabilities. You can change this anytime in settings.
                  </p>
                </div>

                {!isConnected ? (
                  <Button
                    size="lg"
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full max-w-xs"
                  >
                    {isConnecting ? (
                      <LoadingSpinner text="Connecting..." size="sm" />
                    ) : (
                      <>
                        Connect YouTube
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Connected Successfully!</span>
                    </div>
                    <Button onClick={handleComplete} className="w-full max-w-xs">
                      Continue to RecordLane
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  By connecting, you agree to let RecordLane upload videos to your YouTube account.
                  You can disconnect anytime from settings. Your authentication tokens are managed
                  securely with automatic refresh capabilities.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
