import React from 'react';
import { Heart, Shield, Gift, Eye } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          {/* Main footer text */}
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Built with <Heart className="inline h-4 w-4 text-red-500 mx-1" /> for creators who value privacy and freedom
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Gift className="h-3 w-3" />
              <span>Open Source</span>
            </div>
            <div className="hidden sm:block">•</div>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Privacy First</span>
            </div>
            <div className="hidden sm:block">•</div>
            <div className="flex items-center gap-1">
              <Gift className="h-3 w-3" />
              <span>Free Forever</span>
            </div>
            <div className="hidden sm:block">•</div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>No Data Collection</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
