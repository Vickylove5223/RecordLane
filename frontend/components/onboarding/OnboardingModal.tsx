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
  CheckCircle
} from 'lucide-react';
import { useDrive } from '../../contexts/DriveContext';
import { useApp } from '../../contexts/AppContext';

export default function OnboardingModal() {
  const { connectDrive, isConnecting, isConnected } = useDrive();
  const { dispatch } = useApp();

  const handleConnect = async () => {
    await connectDrive();
    if (isConnected) {
      dispatch({ type: 'SET_ONBOARDED', payload: true });
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your recordings are stored only in your Google Drive, never on our servers.',
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
      description: 'Recordings are automatically uploaded to your Drive with resumable uploads.',
      color: 'text-purple-500',
    },
  ];

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="text-center mb-6">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Video className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Welcome to LoomClone</DialogTitle>
              <DialogDescription className="text-lg">
                Record your screen and camera with instant Google Drive sync
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Features */}
              <div className="grid gap-4">
                {features.map((feature, index) => (
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
              {isConnecting && (
                <div className="text-center py-4">
                  <ConnectionStatus 
                    status="connecting" 
                    text="Connecting to Google Drive..."
                    className="mx-auto"
                  />
                </div>
              )}

              {/* Call to Action */}
              <div className="text-center space-y-4 pt-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Connect Google Drive to get started</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll create a "LoomClone Recordings" folder in your Drive to store your recordings.
                    You can change this folder anytime in settings.
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={handleConnect}
                  disabled={isConnecting || isConnected}
                  className="w-full max-w-xs"
                >
                  {isConnecting ? (
                    <LoadingSpinner text="Connecting..." size="sm" />
                  ) : isConnected ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Connected
                    </>
                  ) : (
                    <>
                      Connect Google Drive
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  By connecting, you agree to let LoomClone access files it creates in your Google Drive.
                  You can disconnect anytime from settings.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
