import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Minimal app without any heavy dependencies
function MinimalApp() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 bg-white rounded-full"></div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">RecordLane</h1>
        <p className="text-gray-600 mb-6">Screen recording with YouTube integration</p>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">✅ Performance Optimized</h3>
            <p className="text-sm text-gray-600">All performance monitoring code removed</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">⚡ Fast Loading</h3>
            <p className="text-sm text-gray-600">No heavy imports or blocking operations</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">🚀 Ready to Use</h3>
            <p className="text-sm text-gray-600">App loads instantly without preloader</p>
          </div>
        </div>
        
        <div className="mt-8">
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh App
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  console.log('🎯 Minimal App rendering...');
  
  return (
    <Router>
      <Routes>
        <Route path="*" element={<MinimalApp />} />
      </Routes>
    </Router>
  );
}
