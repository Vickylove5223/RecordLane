import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SettingsPageSkeleton } from '@/components/ui/loading-skeleton';
import { LoadingSpinner } from '@/components/ui/spinner';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { 
  User, 
  Folder, 
  Settings as SettingsIcon,
  Unlink,
  Shield,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useDrive } from '../../contexts/DriveContext';
import { useApp } from '../../contexts/AppContext';

export default function SettingsModal() {
  const { isConnected, userEmail, folderName, disconnectDrive, isConnecting } = useDrive();
  const { state, dispatch } = useApp();
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isOpen = state.settingsOpen || false;

  const handleClose = () => {
    dispatch({ type: 'SET_SETTINGS_OPEN', payload: false });
  };

  const handleSettingChange = (key: string, value: any) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { [key]: value },
    });
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectDrive();
      setShowDisconnectConfirm(false);
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getConnectionStatus = () => {
    if (isConnecting || isDisconnecting) return 'connecting';
    if (isConnected) return 'connected';
    return 'disconnected';
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5" />
                <span>Settings</span>
              </DialogTitle>
              <DialogDescription>
                Manage your recording preferences and Google Drive connection
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
              <SettingsPageSkeleton />
            ) : (
              <div className="space-y-6">
                {/* Google Drive Connection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Google Drive Connection</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Connection Status */}
                    <ConnectionStatus 
                      status={getConnectionStatus()}
                      text={
                        isDisconnecting ? 'Disconnecting...' :
                        isConnecting ? 'Connecting...' :
                        isConnected ? `Connected to ${userEmail}` :
                        'Not connected'
                      }
                    />

                    {isConnected ? (
                      <>
                        <div className="flex items-center space-x-4 pt-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userEmail}`} />
                            <AvatarFallback>
                              <User className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{userEmail}</span>
                              <Badge variant="secondary" className="flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3" />
                                <span>Connected</span>
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Folder className="h-4 w-4" />
                              <span>{folderName}</span>
                            </div>
                          </div>
                        </div>

                        {showDisconnectConfirm ? (
                          <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                            <div className="flex items-start space-x-3">
                              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-destructive mb-3">
                                  Are you sure you want to disconnect? You'll need to reconnect to record new videos.
                                  Your existing recordings in Google Drive will not be affected.
                                </p>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleDisconnect}
                                    disabled={isDisconnecting}
                                  >
                                    {isDisconnecting ? (
                                      <LoadingSpinner text="Disconnecting..." size="sm" />
                                    ) : (
                                      'Yes, Disconnect'
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowDisconnectConfirm(false)}
                                    disabled={isDisconnecting}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setShowDisconnectConfirm(true)}
                            disabled={isDisconnecting}
                            className="text-destructive hover:text-destructive"
                          >
                            <Unlink className="h-4 w-4 mr-2" />
                            Disconnect Drive
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">No Google Drive connection</p>
                        <Button onClick={handleClose}>
                          Connect Google Drive
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recording Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recording Defaults</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Resolution */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Default Resolution</label>
                        <p className="text-xs text-muted-foreground">
                          Higher resolutions create larger files
                        </p>
                      </div>
                      <Select
                        value={state.settings.defaultResolution}
                        onValueChange={(value) => handleSettingChange('defaultResolution', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="480p">480p</SelectItem>
                          <SelectItem value="720p">720p</SelectItem>
                          <SelectItem value="1080p">1080p</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Frame Rate */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Default Frame Rate</label>
                        <p className="text-xs text-muted-foreground">
                          Higher frame rates create smoother videos
                        </p>
                      </div>
                      <Select
                        value={state.settings.defaultFrameRate.toString()}
                        onValueChange={(value) => handleSettingChange('defaultFrameRate', parseInt(value))}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 fps</SelectItem>
                          <SelectItem value="60">60 fps</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Click Highlights */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Highlight Clicks by Default</label>
                        <p className="text-xs text-muted-foreground">
                          Show visual indicators when you click during recording
                        </p>
                      </div>
                      <Switch
                        checked={state.settings.highlightClicksDefault}
                        onCheckedChange={(checked) => handleSettingChange('highlightClicksDefault', checked)}
                      />
                    </div>

                    {/* Default Privacy */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Default Privacy</label>
                        <p className="text-xs text-muted-foreground">
                          Default sharing setting for new recordings
                        </p>
                      </div>
                      <Select
                        value={state.settings.defaultPrivacy}
                        onValueChange={(value) => handleSettingChange('defaultPrivacy', value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="anyone-viewer">Anyone (Viewer)</SelectItem>
                          <SelectItem value="anyone-commenter">Anyone (Commenter)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* About */}
                <Card>
                  <CardHeader>
                    <CardTitle>About RecordLane</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        RecordLane is an open-source screen recording tool that stores all recordings
                        directly in your Google Drive for maximum privacy and control.
                      </p>
                      <p>
                        Version: 1.0.0 | Built with React, TypeScript, and Google Drive API
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-6 border-t border-border">
              <Button onClick={handleClose} disabled={isDisconnecting}>
                Close
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
