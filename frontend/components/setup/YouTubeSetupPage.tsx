import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernCard } from '@/components/ui/modern-card';
import { ArrowLeft, CheckCircle, Cloud, ExternalLink, Settings } from 'lucide-react';
import { useYouTube } from '../../contexts/YouTubeContext';

export default function YouTubeSetupPage() {
  const navigate = useNavigate();
  const { connectYouTube, isConnected, isConnecting, userEmail } = useYouTube();

  const steps = [
    {
      title: 'Go to Google Cloud Console',
      description: 'Create a new project or select an existing one.',
      link: 'https://console.cloud.google.com/',
    },
    {
      title: 'Enable YouTube Data API v3',
      description: 'In "APIs & Services" > "Library", find and enable the YouTube Data API.',
    },
    {
      title: 'Create OAuth 2.0 Credentials',
      description: 'Create a "Web application" OAuth client ID. Add the authorized redirect URIs provided in your Encore/Leap dashboard.',
    },
    {
      title: 'Set Encore Secrets',
      description: 'In your Encore/Leap dashboard, go to the "Infrastructure" tab and set the `GoogleClientID` and `GoogleClientSecret` secrets.',
    },
    {
      title: 'Connect Your Account',
      description: 'Once the secrets are set, come back here and connect your account.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
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
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <ModernCard variant="layered" className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Guide</h2>
              <p className="text-lg text-gray-600">
                Follow these steps to connect RecordLane to your YouTube account. This is a one-time setup.
              </p>
            </div>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline inline-flex items-center mt-1"
                      >
                        Go to Google Cloud Console <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ModernCard>

          <Card>
            <CardHeader>
              <CardTitle>Connect Account</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {isConnected ? (
                <div className="space-y-3">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <h3 className="text-lg font-semibold">Successfully Connected!</h3>
                  <p className="text-muted-foreground">Connected as {userEmail}</p>
                  <Button onClick={() => navigate('/')}>
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    After completing the setup steps, click below to connect your account.
                  </p>
                  <Button
                    size="lg"
                    onClick={connectYouTube}
                    disabled={isConnecting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isConnecting ? (
                      'Connecting...'
                    ) : (
                      <>
                        <Cloud className="h-5 w-5 mr-2" />
                        Connect to YouTube
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
