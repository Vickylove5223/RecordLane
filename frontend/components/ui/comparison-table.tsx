import React from 'react';

export function ComparisonTable() {
  return (
    <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="grid grid-cols-6 gap-2 p-2 sm:p-4">
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900">Features</h3>
              <p className="text-sm text-gray-600">Compare key features</p>
            </div>
            <div className="text-center relative">
              <div className="bg-gray-100 rounded-xl p-2 sm:p-3">
                <div className="text-base font-bold text-green-600">RecordLane</div>
                <div className="text-xs text-black">You are here</div>
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                  BEST
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                <div className="text-base font-semibold text-gray-800">Loom</div>
                <div className="text-xs text-gray-500">$8-16/mo</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                <div className="text-base font-semibold text-gray-800">Snapify.it</div>
                <div className="text-xs text-gray-500">$9-19/mo</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                <div className="text-base font-semibold text-gray-800">Cap.so</div>
                <div className="text-xs text-gray-500">$8-16/mo</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                <div className="text-base font-semibold text-gray-800">ScreenStudio</div>
                <div className="text-xs text-gray-500">$12-24/mo</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                <div className="text-base font-semibold text-gray-800">Tella</div>
                <div className="text-xs text-gray-500">$10-20/mo</div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {/* Price Row */}
          <div className="grid grid-cols-6 gap-2 p-2 sm:p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <div>
                <div className="font-semibold text-black text-lg">Pricing</div>
                <div className="text-sm text-gray-600">Cost to use</div>
              </div>
            </div>
            <div className="flex items-center text-left">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-semibold flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Free Forever
              </div>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black font-semibold">$8-16/mo</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black font-semibold">$9-19/mo</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black font-semibold">$8-16/mo</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black font-semibold">$12-24/mo</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black font-semibold">$10-20/mo</span>
            </div>
          </div>

          {/* Privacy Row */}
          <div className="grid grid-cols-6 gap-2 p-2 sm:p-4 hover:bg-gray-50 transition-colors bg-gray-50/50">
            <div className="flex items-center">
              <div>
                <div className="font-semibold text-black text-lg">Privacy</div>
                <div className="text-sm text-gray-600">Data protection</div>
              </div>
            </div>
            <div className="flex items-center text-left">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-semibold flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Privacy First
              </div>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Data Collection</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Data Collection</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Data Collection</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Data Collection</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Data Collection</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Data Collection</span>
            </div>
          </div>

          {/* Ease of Use Row */}
          <div className="grid grid-cols-6 gap-2 p-2 sm:p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <div>
                <div className="font-semibold text-black text-lg">Ease of Use</div>
                <div className="text-sm text-gray-600">Learning curve</div>
              </div>
            </div>
            <div className="flex items-center text-left">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-semibold flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                One-Click
              </div>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Easy</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Easy</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Easy</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-yellow-600">⚠️ Moderate</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Easy</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Easy</span>
            </div>
          </div>

          {/* Cloud Storage Row */}
          <div className="grid grid-cols-6 gap-2 p-2 sm:p-4 hover:bg-gray-50 transition-colors bg-gray-50/50">
            <div className="flex items-center">
              <div>
                <div className="font-semibold text-black text-lg">Cloud Storage</div>
                <div className="text-sm text-gray-600">Online storage</div>
              </div>
            </div>
            <div className="flex items-center text-left">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-semibold flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                YouTube Integration
              </div>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Built-in</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Built-in</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Built-in</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Built-in</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Built-in</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Built-in</span>
            </div>
          </div>

          {/* Open Source Row */}
          <div className="grid grid-cols-6 gap-2 p-2 sm:p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <div>
                <div className="font-semibold text-black text-lg">Open Source</div>
                <div className="text-sm text-gray-600">Code transparency</div>
              </div>
            </div>
            <div className="flex items-center text-left">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-semibold flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Fully Open
              </div>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Proprietary</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Proprietary</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Proprietary</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Proprietary</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Proprietary</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Proprietary</span>
            </div>
          </div>

          {/* Self-Hosting Row */}
          <div className="grid grid-cols-6 gap-2 p-2 sm:p-4 hover:bg-gray-50 transition-colors bg-gray-50/50">
            <div className="flex items-center">
              <div>
                <div className="font-semibold text-black text-lg">Self-Hosting</div>
                <div className="text-sm text-gray-600">Full control</div>
              </div>
            </div>
            <div className="flex items-center text-left">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-semibold flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Full Control
              </div>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Not Available</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Not Available</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Not Available</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Not Available</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Not Available</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-black">❌ Not Available</span>
            </div>
          </div>

          {/* Web-Based Row */}
          <div className="grid grid-cols-6 gap-2 p-2 sm:p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <div>
                <div className="font-semibold text-black text-lg">Web-Based</div>
                <div className="text-sm text-gray-600">Browser access</div>
              </div>
            </div>
            <div className="flex items-center text-left">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-semibold flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Works Anywhere
              </div>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Web App</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Web App</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Web App</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Web App</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Web App</span>
            </div>
            <div className="flex items-center text-left text-gray-600">
              <span className="text-green-600">✅ Web App</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
