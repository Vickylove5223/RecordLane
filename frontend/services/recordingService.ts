import { RecordingOptions } from '../contexts/RecordingContext';

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

  async startRecording(options: RecordingOptions): Promise<void> {
    try {
      this.recordedChunks = [];
      
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
      
      // Setup MediaRecorder
      this.setupMediaRecorder(composedStream);
      
      // Start recording
      this.mediaRecorder!.start(100); // 100ms timeslice for chunked recording
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.cleanup();
      throw error;
    }
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  cleanup(): void {
    // Stop animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
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

    // Clean up canvas
    this.canvas = null;
    this.canvasContext = null;
    this.overlayCanvas = null;
    this.overlayContext = null;

    // Clean up MediaRecorder
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  private async setupStreams(options: RecordingOptions): Promise<void> {
    // Get screen stream if needed
    if (options.mode === 'screen' || options.mode === 'screen-camera') {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: this.getResolutionDimensions(options.resolution).width,
          height: this.getResolutionDimensions(options.resolution).height,
          frameRate: options.frameRate,
        },
        audio: true, // Capture system audio if available
      });
    }

    // Get camera stream if needed
    if (options.mode === 'camera' || options.mode === 'screen-camera') {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 320,
          height: 240,
          frameRate: options.frameRate,
        },
        audio: options.mode === 'camera', // Only capture mic audio for camera-only mode
      });
    }
  }

  private setupCanvas(options: RecordingOptions): void {
    const dimensions = this.getResolutionDimensions(options.resolution);
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = dimensions.width;
    this.canvas.height = dimensions.height;
    this.canvasContext = this.canvas.getContext('2d')!;
    
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
    const handleClick = (event: MouseEvent) => {
      if (this.overlayContext) {
        this.drawClickRipple(event.clientX, event.clientY);
      }
    };

    document.addEventListener('click', handleClick);
    
    // Store reference to remove listener later
    (this as any).clickHandler = handleClick;
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
    const compose = () => {
      if (!this.canvasContext || !this.canvas) return;

      // Clear canvas
      this.canvasContext.fillStyle = '#000000';
      this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw screen if available
      if (this.screenStream && (options.mode === 'screen' || options.mode === 'screen-camera')) {
        const video = this.createVideoElement(this.screenStream);
        if (video.readyState >= 2) {
          this.canvasContext.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
        }
      }

      // Draw camera if available
      if (this.cameraStream && (options.mode === 'camera' || options.mode === 'screen-camera')) {
        const video = this.createVideoElement(this.cameraStream);
        if (video.readyState >= 2) {
          if (options.mode === 'camera') {
            // Full screen camera
            this.canvasContext.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
          } else {
            // Picture-in-picture
            const pipWidth = this.canvas.width * 0.25;
            const pipHeight = pipWidth * (video.videoHeight / video.videoWidth);
            const pipX = this.canvas.width - pipWidth - 20;
            const pipY = 20;
            
            // Draw PiP background
            this.canvasContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.canvasContext.fillRect(pipX - 5, pipY - 5, pipWidth + 10, pipHeight + 10);
            
            // Draw camera
            this.canvasContext.drawImage(video, pipX, pipY, pipWidth, pipHeight);
          }
        }
      }

      // Draw overlays
      if (this.overlayCanvas) {
        this.canvasContext.drawImage(this.overlayCanvas, 0, 0);
      }

      this.animationFrame = requestAnimationFrame(compose);
    };

    compose();
  }

  private createVideoElement(stream: MediaStream): HTMLVideoElement {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.play();
    return video;
  }

  private createComposedStream(options: RecordingOptions): MediaStream {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    // Get video stream from canvas
    const videoStream = this.canvas.captureStream(options.frameRate);
    
    // Get audio streams
    const audioTracks: MediaStreamTrack[] = [];
    
    if (this.screenStream) {
      const audioTrack = this.screenStream.getAudioTracks()[0];
      if (audioTrack) audioTracks.push(audioTrack);
    }
    
    if (this.cameraStream && options.mode === 'camera') {
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
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9,opus',
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
    };
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
