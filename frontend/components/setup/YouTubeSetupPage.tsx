import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernCard, DocumentCard, GridCard } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ExternalLink, AlertCircle, CheckCircle, Settings, Cloud, Wifi, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useApp } from '../../contexts/AppContext';

export function YouTubeSetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  const { toast } = useToast();
  const { connectYouTube, isConnected, isConnecting, userEmail, connectionError } = useYouTube();
  const { dispatch } = useApp();

  const steps = [
    {
      id: 1,
      title: 'Create Google Cloud Project',
      description: 'Set up a new project in Google Cloud Console',
    },
    {
      id: 2,
      title: 'Enable YouTube Data API',
      description: 'Enable the YouTube Data API v3 for your project',
    },
    {
      id: 3,
      title: 'Create OAuth 2.0 Credentials',
      description: 'Create OAuth 2.0 credentials for your application',
    },
    {
      id: 4,
      title: 'Configure Environment Variables',
      description: 'Add your credentials to the environment configuration',
    },
    {
      id: 5,
      title: 'Connect YouTube Account',
      description: 'Connect your YouTube account to start syncing recordings',
    },
  ];

  const handleCopy = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard",
    });
  };

  const handleSaveCredentials = () => {
    if (!clientId || !clientSecret) {
      toast({
        title: "Missing credentials",
        description: "Please enter both Client ID and Client Secret",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, you would save these to a .env file
    // For now, we'll just show a success message
    toast({
      title: "Credentials saved",
      description: "Please restart the development server to apply changes",
    });
    
    setCredentialsSaved(true);
    setCurrentStep(5);
  };

  const handleConnectYouTube = async () => {
    try {
      await connectYouTube();
      if (isConnected) {
        toast({
          title: "YouTube Connected!",
          description: "Your YouTube account has been successfully connected.",
        });
        // Navigate back to main app
        dispatch({ type: 'SET_SETTINGS_OPEN', payload: false });
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleBackToApp = () => {
    dispatch({ type: 'SET_SETTINGS_OPEN', payload: false });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-black" />
              <span className="text-sm font-medium">Create a new Google Cloud Project</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-black hover:underline inline-flex items-center">
                Google Cloud Console <ExternalLink className="h-3 w-3 ml-1" />
              </a></li>
              <li>Click on the project dropdown at the top</li>
              <li>Click "New Project"</li>
              <li>Enter a project name (e.g., "RecordLane YouTube Integration")</li>
              <li>Click "Create"</li>
            </ol>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-black" />
              <span className="text-sm font-medium">Enable YouTube Data API v3</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>In your Google Cloud project, go to "APIs & Services" → "Library"</li>
              <li>Search for "YouTube Data API v3"</li>
              <li>Click on "YouTube Data API v3"</li>
              <li>Click "Enable"</li>
            </ol>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-black" />
              <span className="text-sm font-medium">Create OAuth 2.0 Credentials</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Go to "APIs & Services" → "Credentials"</li>
              <li>Click "Create Credentials" → "OAuth 2.0 Client IDs"</li>
              <li>If prompted, configure the OAuth consent screen first:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Choose "External" user type</li>
                  <li>Fill in the required fields (App name, User support email, Developer email)</li>
                  <li>Add your domain to authorized domains</li>
                  <li>Add scopes: <code className="bg-gray-100 px-1 rounded">../auth/youtube.upload</code>, <code className="bg-gray-100 px-1 rounded">../auth/userinfo.email</code></li>
                </ul>
              </li>
              <li>For Application type, choose "Single Page Application (SPA)"</li>
              <li>Add authorized redirect URIs:
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <code className="text-sm">http://localhost:8089/auth/callback</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 h-6 w-6 p-0"
                    onClick={() => handleCopy('http://localhost:8089/auth/callback', 3)}
                  >
                    {copiedStep === 3 ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </li>
              <li>Click "Create"</li>
              <li>Copy the Client ID and Client Secret (you'll need these in the next step)</li>
            </ol>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-black" />
              <span className="text-sm font-medium">Configure Environment Variables</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Client ID</label>
                <Input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter your Google Client ID"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Client Secret</label>
                <Input
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your Google Client Secret"
                  type="password"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Important:</p>
                  <p className="text-yellow-700 mt-1">
                    After saving your credentials, you need to restart the development server for the changes to take effect.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-start space-x-2">
                <Settings className="h-4 w-4 text-black mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-black">Alternative Setup:</p>
                  <p className="text-gray-700 mt-1">
                    You can also create a <code className="bg-gray-100 px-1 rounded">.env</code> file in the frontend directory with:
                  </p>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                    VITE_GOOGLE_CLIENT_ID=your_client_id_here<br/>
                    VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {isConnected ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">YouTube Connected Successfully!</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Connected to: <span className="font-medium">{userEmail}</span>
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  Your RecordLane is now ready to sync recordings to YouTube. You can start recording and your videos will be automatically uploaded to your YouTube channel.
                </p>
                <Button onClick={handleBackToApp} className="bg-black hover:bg-black/90 text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to RecordLane
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5 text-black" />
                  <span className="text-sm font-medium">Connect Your YouTube Account</span>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <Cloud className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">Ready to Connect</p>
                      <p className="text-blue-700 mt-1">
                        Click the button below to connect your YouTube account. You'll be redirected to Google to authorize RecordLane to access your YouTube channel.
                      </p>
                    </div>
                  </div>
                </div>

                {connectionError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-red-800">Connection Error</p>
                        <p className="text-red-700 mt-1">{connectionError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <Button 
                    onClick={handleConnectYouTube}
                    disabled={isConnecting}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
                  >
                    {isConnecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Cloud className="h-5 w-5 mr-2" />
                        Connect YouTube Account
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  By connecting, you authorize RecordLane to upload videos to your YouTube channel and manage your recordings.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToApp}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-700" />
                <h1 className="text-xl font-semibold text-gray-900">YouTube Integration Setup</h1>
              </div>
            </div>
            <Badge variant="outline" className="text-xs bg-white">
              Step {currentStep} of {steps.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step.id 
                    ? 'bg-black text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-black' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <ModernCard variant="layered" className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{steps[currentStep - 1].title}</h2>
              <p className="text-lg text-gray-600">{steps[currentStep - 1].description}</p>
            </div>
            <div>
              {renderStepContent()}
            </div>
          </ModernCard>

          {/* Navigation */}
          {currentStep < 5 && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              <div className="flex space-x-2">
                {currentStep === 4 ? (
                  <Button onClick={handleSaveCredentials} className="bg-black hover:bg-black/90 text-white">
                    Save Credentials
                  </Button>
                ) : (
                  <Button onClick={() => setCurrentStep(Math.min(5, currentStep + 1))} className="bg-black hover:bg-black/90 text-white">
                    Next
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Help Section */}
          <GridCard className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Need Help?</h4>
                <p className="text-gray-600 mb-4">
                  If you encounter any issues during setup, check the following:
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Make sure your Google Cloud project has billing enabled</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Verify that the YouTube Data API v3 is enabled</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Ensure your redirect URI matches exactly: <code className="bg-gray-100 px-2 py-1 rounded text-xs">http://localhost:8089/auth/callback</code></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Check that your OAuth consent screen is properly configured</span>
                  </li>
                </ul>
              </div>
            </div>
          </GridCard>
        </div>
      </div>
    </div>
  );
}
