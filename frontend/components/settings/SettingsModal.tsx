import React, { useState, useEffect } from 'react';
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
  Settings as SettingsIcon,
  Unlink,
  Shield,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Clock,
  Video,
  Mic,
  Camera,
  Monitor,
} from 'lucide-react';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useApp } from '../../contexts/AppContext';
import { useRecording } from '../../contexts/RecordingContext';
import { TokenService } from '../../services/tokenService';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsModal() {
  const { 
    isConnected, 
    userEmail, 
    disconnectYouTube, 
    isConnecting,
    refreshToken,
    connectYouTube
  } = useYouTube();
  const { state, dispatch } = useApp();
  const { permissionStatus, checkPermissions, requestPermissions } = useRecording();
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const { toast } = useToast();

  const isOpen = state.settingsOpen || false;

  const [localSettings, setLocalSettings] = useState(state.settings);

  useEffect(() => {
    setLocalSettings(state.settings);
    setHasUnsavedChanges(false);
  }, [state.settings, isOpen]);

  useEffect(() => {
    const updateTokenInfo = () => {
      const info = TokenService.getTokenExpiry();
      setTokenInfo(info);
    };

    updateTokenInfo();
    const interval = setInterval(updateTokenInfo, 30000);

    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if (isOpen) {
      checkPermissions();
    }
  }, [isOpen, checkPermissions]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setLocalSettings(state.settings);
        setHasUnsavedChanges(false);
        dispatch({ type: 'SET_SETTINGS_OPEN', payload: false });
      }
    } else {
      dispatch({ type: 'SET_SETTINGS_OPEN', payload: false });
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: localSettings,
    });
    setHasUnsavedChanges(false);
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to their default values?')) {
      dispatch({ type: 'RESET_SETTINGS' });
      setHasUnsavedChanges(false);
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to their default values.",
      });
    }
  };

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    try {
      await refreshToken();
      toast({
        title: "Token Refreshed",
        description: "Authentication token has been refreshed successfully.",
      });
    } catch (error) {
      console.error('Failed to refresh token:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh authentication token.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConnect = async () => {
    try {
      await connectYouTube();
      toast({
        title: "YouTube Connected",
        description: "Successfully connected to YouTube",
      });
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectYouTube();
      setShowDisconnectConfirm(false);
      toast({
        title: "YouTube Disconnected",
        description: "Successfully disconnected from YouTube",
      });
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect from YouTube. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRequestPermission = async (type: 'camera' | 'microphone') => {
    try {
      const granted = await requestPermissions(type);
      if (granted) {
        toast({
          title: "Permission Granted",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} access has been granted.`,
        });
      }
    } catch (error) {
      console.error(`Failed to request ${type} permission:`, error);
    }
  };

  const getConnectionStatus = () => {
    if (isConnecting || isDisconnecting || isRefreshing) return 'connecting';
    if (isConnected) return 'connected';
    return 'disconnected';
  };

  const getConnectionText = () => {
    if (isRefreshing) return 'Refreshing token...';
    if (isDisconnecting) return 'Disconnecting...';
    if (isConnecting) return 'Connecting...';
    if (isConnected) return `Connected to ${userEmail}`;
    return 'Not connected';
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  const getPermissionIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'denied':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <LoadingSpinner size="sm" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPermissionText = (status: string) => {
    switch (status) {
      case 'granted': return 'Granted';
      case 'denied': return 'Denied';
      case 'checking': return 'Checking...';
      default: return 'Not requested';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => !isDisconnecting && !isRefreshing && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5" />
                <span>Settings</span>
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="ml-2">
                    Unsaved Changes
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Manage your recording preferences and YouTube connection
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
              <SettingsPageSkeleton />
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>YouTube Connection</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ConnectionStatus 
                      status={getConnectionStatus()}
                      text={getConnectionText()}
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
                          </div>
                        </div>

                        {tokenInfo && (
                          <div className="p-3 bg-muted rounded-lg space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">Session Status:</span>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span className={tokenInfo.isExpired ? 'text-red-500' : tokenInfo.isNearExpiry ? 'text-yellow-500' : 'text-green-500'}>
                                  {tokenInfo.isExpired ? 'Expired' : tokenInfo.isNearExpiry ? 'Expires soon' : 'Active'}
                                </span>
                              </div>
                            </div>
                            
                            {!tokenInfo.isExpired && (
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Time remaining:</span>
                                <span>{formatTimeRemaining(tokenInfo.expiresIn)}</span>
                              </div>
                            )}

                            {(tokenInfo.isExpired || tokenInfo.isNearExpiry) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRefreshToken}
                                disabled={isRefreshing}
                                className="w-full mt-2"
                              >
                                {isRefreshing ? (
                                  <LoadingSpinner text="Refreshing..." size="sm" />
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh Session
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}

                        {showDisconnectConfirm ? (
                          <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                            <div className="flex items-start space-x-3">
                              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-destructive mb-3">
                                  Are you sure you want to disconnect? You'll need to reconnect to sync recordings to YouTube.
                                  Your existing recordings on YouTube will not be affected.
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
                            disabled={isDisconnecting || isRefreshing}
                            className="text-destructive hover:text-destructive"
                          >
                            <Unlink className="h-4 w-4 mr-2" />
                            Disconnect YouTube
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">
                          Connect YouTube to sync your recordings to the cloud
                        </p>
                        <Button 
                          onClick={handleConnect}
                          disabled={isConnecting}
                          className="w-full"
                        >
                          {isConnecting ? (
                            <LoadingSpinner text="Connecting..." size="sm" />
                          ) : (
                            'Connect YouTube'
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          YouTube connection is optional. You can record locally without it.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Device Permissions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Camera className="h-4 w-4" />
                          <div>
                            <span className="font-medium">Camera Access</span>
                            <p className="text-xs text-muted-foreground">Required for camera recording</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPermissionIcon(permissionStatus.camera)}
                          <span className="text-sm">{getPermissionText(permissionStatus.camera)}</span>
                          {permissionStatus.camera === 'denied' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestPermission('camera')}
                            >
                              Request
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Mic className="h-4 w-4" />
                          <div>
                            <span className="font-medium">Microphone Access</span>
                            <p className="text-xs text-muted-foreground">Required for audio recording</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPermissionIcon(permissionStatus.microphone)}
                          <span className="text-sm">{getPermissionText(permissionStatus.microphone)}</span>
                          {permissionStatus.microphone === 'denied' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestPermission('microphone')}
                            >
                              Request
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Monitor className="h-4 w-4" />
                          <div>
                            <span className="font-medium">Screen Capture</span>
                            <p className="text-xs text-muted-foreground">Required for screen recording</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPermissionIcon(permissionStatus.screen)}
                          <span className="text-sm">{getPermissionText(permissionStatus.screen)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> Screen capture permission is requested when you start recording. 
                        Camera and microphone permissions are required for those specific features.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Video className="h-5 w-5" />
                      <span>Recording Defaults</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Default Resolution</label>
                        <p className="text-xs text-muted-foreground">
                          Higher resolutions create larger files
                        </p>
                      </div>
                      <Select
                        value={localSettings.defaultResolution}
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

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Default Frame Rate</label>
                        <p className="text-xs text-muted-foreground">
                          Higher frame rates create smoother videos
                        </p>
                      </div>
                      <Select
                        value={localSettings.defaultFrameRate.toString()}
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

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Highlight Clicks by Default</label>
                        <p className="text-xs text-muted-foreground">
                          Show visual indicators when you click during recording
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.highlightClicksDefault}
                        onCheckedChange={(checked) => handleSettingChange('highlightClicksDefault', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Default Privacy</label>
                        <p className="text-xs text-muted-foreground">
                          Default sharing setting for new recordings
                        </p>
                      </div>
                      <Select
                        value={localSettings.defaultPrivacy}
                        onValueChange={(value) => handleSettingChange('defaultPrivacy', value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="unlisted">Unlisted</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>About RecordLane</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        RecordLane is an open-source screen recording tool that stores all recordings
                        directly in your YouTube account for maximum privacy and control.
                      </p>
                      <p>
                        <strong>Features:</strong> Local recording, optional YouTube sync, privacy-first design, 
                        and cross-browser support.
                      </p>
                      <p>
                        Version: 1.0.0 | Built with React, TypeScript, and YouTube API
                      </p>
                      <p>
                        Visit <a href="https://recordlane.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">recordlane.com</a> for updates and documentation.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-border">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleResetSettings}
                  disabled={isDisconnecting || isRefreshing}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleClose} 
                  disabled={isDisconnecting || isRefreshing}
                >
                  Cancel
                </Button>
                {hasUnsavedChanges && (
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={isDisconnecting || isRefreshing}
                  >
                    Save Changes
                  </Button>
                )}
                {!hasUnsavedChanges && (
                  <Button 
                    onClick={handleClose} 
                    disabled={isDisconnecting || isRefreshing}
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
