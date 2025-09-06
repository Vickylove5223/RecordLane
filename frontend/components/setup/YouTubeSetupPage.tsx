import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernCard } from '@/components/ui/modern-card';
import { ArrowLeft, CheckCircle, Cloud, ExternalLink, Settings, AlertTriangle, HelpCircle, CreditCard, RefreshCw } from 'lucide-react';
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

          {/* Troubleshooting Section */}
          <ModernCard variant="layered" className="p-8">
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <h2 className="text-2xl font-bold text-gray-900">Troubleshooting</h2>
              </div>
              <p className="text-lg text-gray-600">
                Having issues with the setup? Here are common problems and solutions.
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Google Console Billing Issue */}
              <div className="border-l-4 border-amber-200 bg-amber-50 p-4 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <CreditCard className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-800">Google Cloud Console Billing Issue</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      If you're getting billing errors or API quota issues:
                    </p>
                    <ul className="text-sm text-amber-700 mt-2 space-y-1 ml-4 list-disc">
                      <li>Make sure billing is enabled for your Google Cloud project</li>
                      <li>Check if you have exceeded the free tier quota for YouTube Data API</li>
                      <li>Verify your payment method is valid and up to date</li>
                      <li>Wait 24 hours if you just enabled billing (it can take time to activate)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* OAuth Credentials Issue */}
              <div className="border-l-4 border-blue-200 bg-blue-50 p-4 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-800">OAuth Credentials Not Working</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      If you're having trouble with OAuth setup:
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                      <li>Double-check the redirect URIs match exactly (including https://)</li>
                      <li>Ensure the OAuth consent screen is configured properly</li>
                      <li>Make sure the client ID and secret are copied correctly (no extra spaces)</li>
                      <li>Verify the YouTube Data API v3 is enabled in your project</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Encore Secrets Issue */}
              <div className="border-l-4 border-purple-200 bg-purple-50 p-4 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <Cloud className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-purple-800">Encore Secrets Not Working</h3>
                    <p className="text-sm text-purple-700 mt-1">
                      If your secrets aren't being recognized:
                    </p>
                    <ul className="text-sm text-purple-700 mt-2 space-y-1 ml-4 list-disc">
                      <li>Check that secrets are set for the correct environment (dev/prod)</li>
                      <li>Ensure secret names match exactly: <code className="bg-purple-100 px-1 rounded">GoogleClientID</code> and <code className="bg-purple-100 px-1 rounded">GoogleClientSecret</code></li>
                      <li>Try redeploying your Encore app after setting secrets</li>
                      <li>Verify the backend server is running and accessible</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* General Connection Issues */}
              <div className="border-l-4 border-red-200 bg-red-50 p-4 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <RefreshCw className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800">Still Having Issues?</h3>
                    <p className="text-sm text-red-700 mt-1">
                      If nothing above helps:
                    </p>
                    <ul className="text-sm text-red-700 mt-2 space-y-1 ml-4 list-disc">
                      <li>Clear your browser cache and cookies</li>
                      <li>Try using an incognito/private browsing window</li>
                      <li>Check your internet connection and firewall settings</li>
                      <li>Make sure you're using a supported browser (Chrome, Firefox, Safari, Edge)</li>
                      <li>Contact support if the problem persists</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  );
}
