// Device and browser detection utilities

export interface DeviceCapabilities {
  hasCamera: boolean;
  hasScreenCapture: boolean;
  hasAudioCapture: boolean;
  supportsWebRTC: boolean;
  supportsCryptoAPI: boolean;
  isDesktop: boolean;
  isMobile: boolean;
  browserName: string;
  browserVersion: string;
}

export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  const capabilities: DeviceCapabilities = {
    hasCamera: false,
    hasScreenCapture: false,
    hasAudioCapture: false,
    supportsWebRTC: false,
    supportsCryptoAPI: false,
    isDesktop: false,
    isMobile: false,
    browserName: 'unknown',
    browserVersion: 'unknown',
  };

  // Detect browser
  const browserInfo = detectBrowser();
  capabilities.browserName = browserInfo.name;
  capabilities.browserVersion = browserInfo.version;

  // Detect device type
  capabilities.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  capabilities.isDesktop = !capabilities.isMobile;

  // Check WebRTC support
  capabilities.supportsWebRTC = !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.RTCPeerConnection
  );

  // Check Crypto API support
  capabilities.supportsCryptoAPI = !!(
    window.crypto &&
    window.crypto.subtle &&
    window.crypto.getRandomValues
  );

  if (capabilities.supportsWebRTC) {
    try {
      // Check camera access
      const devices = await navigator.mediaDevices.enumerateDevices();
      capabilities.hasCamera = devices.some(device => device.kind === 'videoinput');
      capabilities.hasAudioCapture = devices.some(device => device.kind === 'audioinput');

      // Check screen capture (only available on desktop browsers)
      capabilities.hasScreenCapture = !!(
        capabilities.isDesktop &&
        navigator.mediaDevices.getDisplayMedia
      );
    } catch (error) {
      console.warn('Failed to detect media devices:', error);
    }
  }

  return capabilities;
}

function detectBrowser(): { name: string; version: string } {
  const userAgent = navigator.userAgent;
  
  // Chrome
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return { name: 'Chrome', version: match ? match[1] : 'unknown' };
  }
  
  // Edge
  if (userAgent.includes('Edg')) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return { name: 'Edge', version: match ? match[1] : 'unknown' };
  }
  
  // Firefox
  if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return { name: 'Firefox', version: match ? match[1] : 'unknown' };
  }
  
  // Safari
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/);
    return { name: 'Safari', version: match ? match[1] : 'unknown' };
  }
  
  return { name: 'unknown', version: 'unknown' };
}

export function isCompatibleBrowser(): boolean {
  const capabilities = {
    supportsWebRTC: !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection
    ),
    supportsCryptoAPI: !!(
      window.crypto &&
      window.crypto.subtle
    ),
    supportsScreenCapture: !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getDisplayMedia
    ),
  };

  return capabilities.supportsWebRTC && capabilities.supportsCryptoAPI;
}

export function getBrowserSupportLevel(): 'full' | 'partial' | 'unsupported' {
  const browser = detectBrowser();
  
  // Chrome/Chromium-based browsers
  if (browser.name === 'Chrome' || browser.name === 'Edge') {
    const version = parseInt(browser.version);
    if (version >= 72) return 'full';
    if (version >= 60) return 'partial';
    return 'unsupported';
  }
  
  // Firefox
  if (browser.name === 'Firefox') {
    const version = parseInt(browser.version);
    if (version >= 66) return 'partial'; // Limited screen capture support
    return 'unsupported';
  }
  
  // Safari
  if (browser.name === 'Safari') {
    const version = parseInt(browser.version);
    if (version >= 13) return 'partial'; // Limited support
    return 'unsupported';
  }
  
  return 'unsupported';
}

export function getRecommendedSettings(): {
  resolution: '480p' | '720p' | '1080p';
  frameRate: 30 | 60;
  features: string[];
} {
  const supportLevel = getBrowserSupportLevel();
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    return {
      resolution: '480p',
      frameRate: 30,
      features: ['camera-recording', 'basic-editing'],
    };
  }
  
  if (supportLevel === 'full') {
    return {
      resolution: '720p',
      frameRate: 30,
      features: ['screen-recording', 'camera-recording', 'pip', 'drawing', 'click-highlights'],
    };
  }
  
  if (supportLevel === 'partial') {
    return {
      resolution: '720p',
      frameRate: 30,
      features: ['camera-recording', 'basic-editing'],
    };
  }
  
  return {
    resolution: '480p',
    frameRate: 30,
    features: ['basic-recording'],
  };
}
