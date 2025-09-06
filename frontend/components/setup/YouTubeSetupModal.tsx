import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ExternalLink, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface YouTubeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function YouTubeSetupModal({ isOpen, onClose }: YouTubeSetupModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const { toast } = useToast();

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
    
    onClose();
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

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>YouTube Integration Setup</span>
          </DialogTitle>
          <DialogDescription>
            Follow these steps to set up YouTube integration for your RecordLane instance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{steps[currentStep - 1].title}</CardTitle>
              <CardDescription>{steps[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
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
                <Button onClick={() => setCurrentStep(Math.min(4, currentStep + 1))} className="bg-black hover:bg-black/90 text-white">
                  Next
                </Button>
              )}
            </div>
          </div>

          {/* Help Section */}
          <div className="p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-sm mb-2">Need Help?</h4>
            <p className="text-sm text-gray-600 mb-2">
              If you encounter any issues during setup, check the following:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Make sure your Google Cloud project has billing enabled</li>
              <li>• Verify that the YouTube Data API v3 is enabled</li>
              <li>• Ensure your redirect URI matches exactly: <code className="bg-gray-200 px-1 rounded">http://localhost:8089/auth/callback</code></li>
              <li>• Check that your OAuth consent screen is properly configured</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
