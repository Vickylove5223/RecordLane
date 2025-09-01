import { RecordingOptions } from '../contexts/RecordingContext';
import { ErrorHandler } from '../utils/errorHandler';
import { PERFORMANCE_CONFIG, ERROR_MESSAGES } from '../config';

export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private animationFrame: number | null = null;
  private screenStream: MediaStream | null = null;
  private cameraStream: MediaStream | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayContext: CanvasRenderingContext2D | null = null;
  private videoElements: Map<string, HTMLVideoElement> = new Map();
  private clickHandler: ((event: MouseEvent) => void) | null = null;
  private retryAttempts = 0;
  private maxRetries = 3;

  async startRecording(options: RecordingOptions): Promise<void> {
    try {
      this.recordedChunks = [];
      this.retryAttempts = 0;
      
      // Check browser support
      if (!this.checkBrowserSupport()) {
        throw ErrorHandler.createError('BROWSER_NOT_SUPPORTED', ERROR_MESSAGES.BROWSER_NOT_SUPPORTED);
      }
      
      // Get required streams based on mode
      await this.setupStreams(options);
      
      // Setup canvas composition
      this.setupCanvas(options);
      
      // Setup overlays if enabled
      if (options.highlightClicks || options.enableDrawing) {
        this.setupOverlays(options);
      }
      
      // Create composed stream
      const composedStream = this.createComposedStream(options);
      
      // Setup MediaRecorder with error handling
      this.setupMediaRecorder(composedStream);
      
      // Start recording
      this.mediaRecorder!.start(100); // 100ms timeslice for chunked recording
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      ErrorHandler.logError('recording-start', error, { options });
      this.cleanup();
      
      if (error.name === 'NotAllowedError') {
        throw ErrorHandler.createError('PERMISSIONS_DENIED', ERROR_MESSAGES.PERMISSIONS_DENIED);
      } else if (error.name === 'NotSupportedError') {
        throw ErrorHandler.createError('BROWSER_NOT_SUPPORTED', ERROR_MESSAGES.BROWSER_NOT_SUPPORTED);
      }
      
      throw ErrorHandler.createError('RECORDING_FAILED', ERROR_MESSAGES.RECORDING_FAILED, error);
    }
  }

  pauseRecording(): void {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.pause();
      }
    } catch (error) {
      console.error('Failed to pause recording:', error);
      ErrorHandler.logError('recording-pause', error);
    }
  }

  resumeRecording(): void {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.resume();
      }
    } catch (error) {
      console.error('Failed to resume recording:', error);
      ErrorHandler.logError('recording-resume', error);
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(ErrorHandler.createError('NO_RECORDING', 'No active recording'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(ErrorHandler.createError('STOP_TIMEOUT', 'Recording stop timeout'));
      }, 10000); // 10 second timeout

      this.mediaRecorder.onstop = () => {
        clearTimeout(timeout);
        try {
          const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
          this.cleanup();
          resolve(blob);
        } catch (error) {
          console.error('Failed to create recording blob:', error);
          ErrorHandler.logError('recording-blob-creation', error);
          reject(ErrorHandler.createError('BLOB_CREATION_FAILED', 'Failed to create recording file'));
        }
      };

      this.mediaRecorder.onerror = (event) => {
        clearTimeout(timeout);
        console.error('MediaRecorder error during stop:', event);
        ErrorHandler.logError('recording-stop-error', event);
        reject(ErrorHandler.createError('STOP_ERROR', 'Error stopping recording'));
      };

      try {
        this.mediaRecorder.stop();
      } catch (error) {
        clearTimeout(timeout);
        console.error('Failed to stop MediaRecorder:', error);
        reject(ErrorHandler.createError('STOP_FAILED', 'Failed to stop recording'));
      }
    });
  }

  cleanup(): void {
    try {
      // Stop animation frame
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }

      // Remove click handler
      if (this.clickHandler) {
        document.removeEventListener('click', this.clickHandler);
        this.clickHandler = null;
      }

      // Stop streams
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => track.stop());
        this.screenStream = null;
      }

      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(track => track.stop());
        this.cameraStream = null;
      }

      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      // Clean up video elements
      this.videoElements.forEach(video => {
        video.pause();
        video.srcObject = null;
        video.remove();
      });
      this.videoElements.clear();

      // Clean up canvas
      this.canvas = null;
      this.canvasContext = null;
      this.overlayCanvas = null;
      this.overlayContext = null;

      // Clean up MediaRecorder
      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = null;
        this.mediaRecorder.onerror = null;
        this.mediaRecorder.ondataavailable = null;
        this.mediaRecorder = null;
      }
      
      this.recordedChunks = [];
    } catch (error) {
      console.error('Error during cleanup:', error);
      ErrorHandler.logError('recording-cleanup', error);
    }
  }

  private checkBrowserSupport(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder &&
      window.MediaStream
    );
  }

  private async setupStreams(options: RecordingOptions): Promise<void> {
    const streamPromises: Promise<void>[] = [];

    // Get screen stream if needed
    if (options.mode === 'screen' || options.mode === 'screen-camera') {
      streamPromises.push(this.getScreenStream(options));
    }

    // Get camera stream if needed
    if (options.mode === 'camera' || options.mode === 'screen-camera') {
      streamPromises.push(this.getCameraStream(options));
    }

    await Promise.all(streamPromises);
  }

  private async getScreenStream(options: RecordingOptions): Promise<void> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: this.getResolutionDimensions(options.resolution).width,
          height: this.getResolutionDimensions(options.resolution).height,
          frameRate: options.frameRate,
        },
        audio: options.systemAudio,
      });

      // Handle stream ending (user stops sharing)
      this.screenStream.getVideoTracks()[0].onended = () => {
        console.log('Screen sharing stopped by user');
        // Could trigger recording stop here
      };
    } catch (error) {
      console.error('Failed to get screen stream:', error);
      throw error;
    }
  }

  private async getCameraStream(options: RecordingOptions): Promise<void> {
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: options.frameRate,
        },
        audio: options.microphone && options.mode === 'camera', // Only capture mic audio for camera-only mode
      });
    } catch (error) {
      console.error('Failed to get camera stream:', error);
      throw error;
    }
  }

  private setupCanvas(options: RecordingOptions): void {
    const dimensions = this.getResolutionDimensions(options.resolution);
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = dimensions.width;
    this.canvas.height = dimensions.height;
    this.canvasContext = this.canvas.getContext('2d', {
      alpha: false,
      desynchronized: true, // Optimize for performance
    })!;
    
    // Start composition loop
    this.startComposition(options);
  }

  private setupOverlays(options: RecordingOptions): void {
    const dimensions = this.getResolutionDimensions(options.resolution);
    
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = dimensions.width;
    this.overlayCanvas.height = dimensions.height;
    this.overlayContext = this.overlayCanvas.getContext('2d')!;

    if (options.highlightClicks) {
      this.setupClickHighlights();
    }

    if (options.enableDrawing) {
      this.setupDrawingTools();
    }
  }

  private setupClickHighlights(): void {
    // Listen for click events and draw ripple effects
    this.clickHandler = (event: MouseEvent) => {
      if (this.overlayContext) {
        this.drawClickRipple(event.clientX, event.clientY);
      }
    };

    document.addEventListener('click', this.clickHandler);
  }

  private setupDrawingTools(): void {
    // This would implement drawing functionality
    // For now, just a placeholder
    console.log('Drawing tools would be implemented here');
  }

  private drawClickRipple(x: number, y: number): void {
    if (!this.overlayContext) return;

    const startTime = Date.now();
    const duration = 500; // 500ms animation
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress < 1) {
        // Clear previous frame
        this.overlayContext!.clearRect(0, 0, this.overlayCanvas!.width, this.overlayCanvas!.height);
        
        // Draw ripple
        const radius = progress * 50;
        const opacity = 1 - progress;
        
        this.overlayContext!.beginPath();
        this.overlayContext!.arc(x, y, radius, 0, 2 * Math.PI);
        this.overlayContext!.strokeStyle = `rgba(66, 165, 245, ${opacity})`;
        this.overlayContext!.lineWidth = 3;
        this.overlayContext!.stroke();
        
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  private startComposition(options: RecordingOptions): void {
    let lastFrameTime = 0;
    const targetFrameInterval = 1000 / options.frameRate;

    const compose = (currentTime: number) => {
      if (!this.canvasContext || !this.canvas) return;

      // Throttle frame rate
      if (currentTime - lastFrameTime < targetFrameInterval) {
        this.animationFrame = requestAnimationFrame(compose);
        return;
      }
      lastFrameTime = currentTime;

      try {
        // Clear canvas
        this.canvasContext.fillStyle = '#000000';
        this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw screen if available
        if (this.screenStream && (options.mode === 'screen' || options.mode === 'screen-camera')) {
          const video = this.getOrCreateVideoElement('screen', this.screenStream);
          if (video.readyState >= 2) {
            this.canvasContext.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
          }
        }

        // Draw camera if available
        if (this.cameraStream && (options.mode === 'camera' || options.mode === 'screen-camera')) {
          const video = this.getOrCreateVideoElement('camera', this.cameraStream);
          if (video.readyState >= 2) {
            if (options.mode === 'camera') {
              // Full screen camera
              this.canvasContext.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
            } else {
              // Picture-in-picture
              this.drawPictureInPicture(video);
            }
          }
        }

        // Draw overlays
        if (this.overlayCanvas) {
          this.canvasContext.drawImage(this.overlayCanvas, 0, 0);
        }

        this.animationFrame = requestAnimationFrame(compose);
      } catch (error) {
        console.error('Error in composition loop:', error);
        ErrorHandler.logError('composition-error', error);
      }
    };

    this.animationFrame = requestAnimationFrame(compose);
  }

  private getOrCreateVideoElement(key: string, stream: MediaStream): HTMLVideoElement {
    let video = this.videoElements.get(key);
    
    if (!video) {
      video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      
      // Handle video errors
      video.onerror = (error) => {
        console.error(`Video element error for ${key}:`, error);
        ErrorHandler.logError('video-element-error', error, { key });
      };
      
      this.videoElements.set(key, video);
      
      // Start playing
      video.play().catch(error => {
        console.error(`Failed to play video for ${key}:`, error);
      });
    }
    
    return video;
  }

  private drawPictureInPicture(video: HTMLVideoElement): void {
    if (!this.canvasContext || !this.canvas) return;

    const pipWidth = this.canvas.width * 0.25;
    const pipHeight = pipWidth * (video.videoHeight / video.videoWidth);
    const pipX = this.canvas.width - pipWidth - 20;
    const pipY = 20;
    
    // Draw PiP background with rounded corners
    this.canvasContext.save();
    this.canvasContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.canvasContext.fillRect(pipX - 5, pipY - 5, pipWidth + 10, pipHeight + 10);
    
    // Clip to rounded rectangle for camera
    const radius = 8;
    this.canvasContext.beginPath();
    this.canvasContext.roundRect(pipX, pipY, pipWidth, pipHeight, radius);
    this.canvasContext.clip();
    
    // Draw camera
    this.canvasContext.drawImage(video, pipX, pipY, pipWidth, pipHeight);
    this.canvasContext.restore();
  }

  private createComposedStream(options: RecordingOptions): MediaStream {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    // Get video stream from canvas
    const videoStream = this.canvas.captureStream(options.frameRate);
    
    // Get audio streams
    const audioTracks: MediaStreamTrack[] = [];
    
    if (this.screenStream && options.systemAudio) {
      const audioTrack = this.screenStream.getAudioTracks()[0];
      if (audioTrack) audioTracks.push(audioTrack);
    }
    
    if (this.cameraStream && options.microphone && options.mode === 'camera') {
      const audioTrack = this.cameraStream.getAudioTracks()[0];
      if (audioTrack) audioTracks.push(audioTrack);
    }

    // Combine streams
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioTracks,
    ]);

    return combinedStream;
  }

  private setupMediaRecorder(stream: MediaStream): void {
    // Choose the best available codec
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
    ];

    let mimeType = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }

    if (!mimeType) {
      throw new Error('No supported MediaRecorder mime type found');
    }

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: this.getVideoBitrate(),
      audioBitsPerSecond: 128000, // 128 kbps for audio
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      ErrorHandler.logError('mediarecorder-error', event);
    };

    this.mediaRecorder.onstart = () => {
      console.log('MediaRecorder started');
    };

    this.mediaRecorder.onstop = () => {
      console.log('MediaRecorder stopped');
    };
  }

  private getVideoBitrate(): number {
    // Return appropriate bitrate based on resolution
    const resolution = this.canvas?.width || 1280;
    
    if (resolution >= 1920) {
      return 5000000; // 5 Mbps for 1080p
    } else if (resolution >= 1280) {
      return 2500000; // 2.5 Mbps for 720p
    } else {
      return 1000000; // 1 Mbps for 480p
    }
  }

  private getResolutionDimensions(resolution: string): { width: number; height: number } {
    switch (resolution) {
      case '480p':
        return { width: 854, height: 480 };
      case '720p':
        return { width: 1280, height: 720 };
      case '1080p':
        return { width: 1920, height: 1080 };
      default:
        return { width: 1280, height: 720 };
    }
  }
}
