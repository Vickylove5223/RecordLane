import { RecordingOptions } from '../contexts/RecordingContext';
import { ErrorHandler } from '../utils/errorHandler';
import { PERFORMANCE_CONFIG, ERROR_MESSAGES } from '../config';

export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private composedStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private cameraStream: MediaStream | null = null;
  private microphoneStream: MediaStream | null = null;
  private isRecording = false;
  private retryAttempts = 0;
  private maxRetries = 3;
  private startTime = 0;

  async startRecording(options: RecordingOptions): Promise<void> {
    try {
      console.log('Starting recording with options:', options);
      
      this.recordedChunks = [];
      this.retryAttempts = 0;
      this.isRecording = false;
      this.startTime = Date.now();
      
      // Check browser support first
      if (!this.checkBrowserSupport()) {
        throw ErrorHandler.createError('BROWSER_NOT_SUPPORTED', ERROR_MESSAGES.BROWSER_NOT_SUPPORTED);
      }

      // Check and request permissions before attempting to get streams
      await this.checkAndRequestPermissions(options);
      
      // Get required streams based on mode
      await this.setupStreams(options);
      
      // Create MediaRecorder with proper configuration
      await this.setupMediaRecorder(options);
      
      // Start recording
      if (this.mediaRecorder) {
        // Set up data available handler before starting
        this.mediaRecorder.ondataavailable = (event) => {
          console.log('Data available:', event.data.size, 'bytes');
          if (event.data && event.data.size > 0) {
            this.recordedChunks.push(event.data);
            console.log('Total chunks:', this.recordedChunks.length, 'Total size:', this.getTotalSize());
          }
        };

        this.mediaRecorder.onstart = () => {
          console.log('MediaRecorder started successfully');
          this.isRecording = true;
        };

        this.mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          ErrorHandler.logError('mediarecorder-runtime-error', event);
        };

        // Start with timeslice to ensure data is collected regularly
        this.mediaRecorder.start(1000); // 1 second timeslice
        
        console.log('Recording started successfully');
      } else {
        throw new Error('MediaRecorder not initialized');
      }
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      ErrorHandler.logError('recording-start', error, { options });
      this.cleanup();
      
      if (error.name === 'NotAllowedError') {
        throw ErrorHandler.createError('PERMISSIONS_DENIED', ERROR_MESSAGES.PERMISSIONS_DENIED);
      } else if (error.name === 'NotSupportedError') {
        throw ErrorHandler.createError('BROWSER_NOT_SUPPORTED', ERROR_MESSAGES.BROWSER_NOT_SUPPORTED);
      } else if (error.name === 'NotFoundError') {
        throw ErrorHandler.createError('DEVICE_NOT_FOUND', 'Camera or microphone not found. Please check your devices.');
      } else if (error.name === 'NotReadableError') {
        throw ErrorHandler.createError('DEVICE_IN_USE', 'Camera or microphone is already in use by another application.');
      } else if (error.name === 'OverconstrainedError') {
        throw ErrorHandler.createError('CONSTRAINTS_NOT_SATISFIED', 'Camera or recording constraints could not be satisfied.');
      } else if (error.name === 'SecurityError') {
        throw ErrorHandler.createError('SECURITY_ERROR', 'Recording blocked due to security restrictions. Please ensure you are on HTTPS.');
      }
      
      throw ErrorHandler.createError('RECORDING_FAILED', ERROR_MESSAGES.RECORDING_FAILED, error);
    }
  }

  private getTotalSize(): number {
    return this.recordedChunks.reduce((total, chunk) => total + chunk.size, 0);
  }

  private async checkAndRequestPermissions(options: RecordingOptions): Promise<void> {
    try {
      // Check if we're on a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        throw ErrorHandler.createError('SECURITY_ERROR', 'Recording requires a secure context (HTTPS). Please use HTTPS or localhost.');
      }

      // Check if required APIs are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw ErrorHandler.createError('BROWSER_NOT_SUPPORTED', 'getUserMedia is not supported in this browser.');
      }

      if ((options.mode === 'screen' || options.mode === 'screen-camera') && !navigator.mediaDevices.getDisplayMedia) {
        throw ErrorHandler.createError('BROWSER_NOT_SUPPORTED', 'Screen capture is not supported in this browser.');
      }

    } catch (error) {
      console.error('Permission check failed:', error);
      
      if (error.name === 'NotAllowedError') {
        throw ErrorHandler.createError('PERMISSIONS_DENIED', 'Recording permissions were denied. Please allow camera and microphone access in your browser settings.');
      }
      
      throw error;
    }
  }

  pauseRecording(): void {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.pause();
        console.log('Recording paused');
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
        console.log('Recording resumed');
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
      }, 15000); // 15 second timeout

      let dataCollectionComplete = false;

      const finalizeRecording = () => {
        if (dataCollectionComplete) return;
        dataCollectionComplete = true;
        
        clearTimeout(timeout);
        
        try {
          console.log('Finalizing recording with', this.recordedChunks.length, 'chunks');
          console.log('Total recording size:', this.getTotalSize(), 'bytes');
          
          if (this.recordedChunks.length === 0) {
            reject(ErrorHandler.createError('NO_DATA', 'No recording data available'));
            return;
          }

          // Create blob with proper MIME type
          const mimeType = this.getOptimalMimeType();
          const blob = new Blob(this.recordedChunks, { type: mimeType });
          
          console.log('Created blob:', {
            size: blob.size,
            type: blob.type,
            chunkCount: this.recordedChunks.length,
            duration: Date.now() - this.startTime,
          });
          
          if (blob.size === 0) {
            reject(ErrorHandler.createError('EMPTY_RECORDING', 'Recording is empty'));
            return;
          }
          
          this.isRecording = false;
          resolve(blob);
        } catch (error) {
          console.error('Failed to create recording blob:', error);
          ErrorHandler.logError('recording-blob-creation', error);
          reject(ErrorHandler.createError('BLOB_CREATION_FAILED', 'Failed to create recording file'));
        }
      };

      // Handle data available one more time to catch any remaining data
      this.mediaRecorder.ondataavailable = (event) => {
        console.log('Final data chunk:', event.data.size, 'bytes');
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped');
        // Give a small delay to ensure all data is collected
        setTimeout(finalizeRecording, 500);
      };

      this.mediaRecorder.onerror = (event) => {
        clearTimeout(timeout);
        console.error('MediaRecorder error during stop:', event);
        ErrorHandler.logError('recording-stop-error', event);
        reject(ErrorHandler.createError('STOP_ERROR', 'Error stopping recording'));
      };

      try {
        if (this.mediaRecorder.state !== 'inactive') {
          console.log('Stopping MediaRecorder...');
          this.mediaRecorder.stop();
        } else {
          // Already stopped, finalize immediately
          finalizeRecording();
        }
      } catch (error) {
        clearTimeout(timeout);
        console.error('Failed to stop MediaRecorder:', error);
        reject(ErrorHandler.createError('STOP_FAILED', 'Failed to stop recording'));
      }
    });
  }

  private getOptimalMimeType(): string {
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4',
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return 'video/webm'; // Fallback
  }

  cleanup(): void {
    try {
      console.log('Cleaning up recording service');

      // Stop MediaRecorder
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.stop();
        } catch (error) {
          console.warn('Error stopping MediaRecorder during cleanup:', error);
        }
      }

      // Stop streams
      if (this.composedStream) {
        this.composedStream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped composed stream track:', track.kind);
        });
        this.composedStream = null;
      }

      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped screen stream track:', track.kind);
        });
        this.screenStream = null;
      }

      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped camera stream track:', track.kind);
        });
        this.cameraStream = null;
      }
      
      if (this.microphoneStream) {
        this.microphoneStream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped microphone stream track:', track.kind);
        });
        this.microphoneStream = null;
      }

      // Clean up MediaRecorder
      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = null;
        this.mediaRecorder.onerror = null;
        this.mediaRecorder.ondataavailable = null;
        this.mediaRecorder.onstart = null;
        this.mediaRecorder = null;
      }
      
      this.isRecording = false;
      console.log('Cleanup completed');
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
    console.log('Setting up streams for mode:', options.mode);

    // Get screen stream if needed
    if (options.mode === 'screen' || options.mode === 'screen-camera') {
      await this.getScreenStream(options);
    }

    // Get camera stream if needed
    if (options.mode === 'camera' || options.mode === 'screen-camera') {
      await this.getCameraStream(options);
    }

    // Get microphone stream if needed
    if (options.microphone) {
      await this.getMicrophoneStream(options);
    }
  }

  private async getScreenStream(options: RecordingOptions): Promise<void> {
    try {
      console.log('Requesting screen stream...');
      
      const constraints: DisplayMediaStreamConstraints = {
        video: {
          width: { ideal: this.getResolutionDimensions(options.resolution).width },
          height: { ideal: this.getResolutionDimensions(options.resolution).height },
          frameRate: { ideal: options.frameRate },
        },
        audio: options.systemAudio,
      };

      this.screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      console.log('Screen stream obtained:', {
        videoTracks: this.screenStream.getVideoTracks().length,
        audioTracks: this.screenStream.getAudioTracks().length,
        resolution: `${this.screenStream.getVideoTracks()[0]?.getSettings().width}x${this.screenStream.getVideoTracks()[0]?.getSettings().height}`,
      });

      // Handle stream ending (user stops sharing)
      this.screenStream.getVideoTracks()[0].onended = () => {
        console.log('Screen sharing stopped by user');
      };
    } catch (error) {
      console.error('Failed to get screen stream:', error);
      
      if (error.name === 'NotAllowedError') {
        throw ErrorHandler.createError('PERMISSIONS_DENIED', 'Screen sharing permission was denied. Please allow screen sharing and try again.');
      } else if (error.name === 'NotSupportedError') {
        throw ErrorHandler.createError('BROWSER_NOT_SUPPORTED', 'Screen sharing is not supported in this browser.');
      } else if (error.name === 'AbortError') {
        throw ErrorHandler.createError('USER_CANCELLED', 'Screen sharing was cancelled by the user.');
      }
      
      throw error;
    }
  }

  private async getCameraStream(options: RecordingOptions): Promise<void> {
    try {
      console.log('Requesting camera stream...');
      
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: options.frameRate },
          facingMode: 'user',
        },
        audio: false, // Microphone is handled separately
      };

      this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera stream obtained:', {
        videoTracks: this.cameraStream.getVideoTracks().length,
        audioTracks: this.cameraStream.getAudioTracks().length,
        resolution: `${this.cameraStream.getVideoTracks()[0]?.getSettings().width}x${this.cameraStream.getVideoTracks()[0]?.getSettings().height}`,
      });
    } catch (error) {
      console.error('Failed to get camera stream:', error);
      
      if (error.name === 'NotAllowedError') {
        throw ErrorHandler.createError('PERMISSIONS_DENIED', 'Camera permission was denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError') {
        throw ErrorHandler.createError('DEVICE_NOT_FOUND', 'No camera found. Please connect a camera and try again.');
      } else if (error.name === 'NotReadableError') {
        throw ErrorHandler.createError('DEVICE_IN_USE', 'Camera is already in use by another application.');
      }
      
      throw error;
    }
  }

  private async getMicrophoneStream(options: RecordingOptions): Promise<void> {
    try {
      console.log('Requesting microphone stream...');
      
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          sampleSize: 16,
        },
      });
      
      console.log('Microphone stream obtained:', {
        audioTracks: this.microphoneStream.getAudioTracks().length,
        settings: this.microphoneStream.getAudioTracks()[0]?.getSettings(),
      });
    } catch (error) {
      console.error('Failed to get microphone stream:', error);
      
      if (error.name === 'NotAllowedError') {
        throw ErrorHandler.createError('PERMISSIONS_DENIED', 'Microphone permission was denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        throw ErrorHandler.createError('DEVICE_NOT_FOUND', 'No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotReadableError') {
        throw ErrorHandler.createError('DEVICE_IN_USE', 'Microphone is already in use by another application.');
      }
      
      throw error;
    }
  }

  private async setupMediaRecorder(options: RecordingOptions): Promise<void> {
    // Create composed stream based on mode
    this.composedStream = this.createComposedStream(options);
    
    if (!this.composedStream) {
      throw new Error('Failed to create composed stream');
    }

    console.log('Composed stream created:', {
      videoTracks: this.composedStream.getVideoTracks().length,
      audioTracks: this.composedStream.getAudioTracks().length,
    });

    // Choose the best available codec
    const mimeType = this.getOptimalMimeType();
    console.log('Selected MIME type:', mimeType);

    if (!MediaRecorder.isTypeSupported(mimeType)) {
      throw new Error(`MIME type ${mimeType} is not supported`);
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.composedStream, {
        mimeType,
        videoBitsPerSecond: this.getVideoBitrate(options.resolution),
        audioBitsPerSecond: 128000, // 128 kbps for audio
      });

      console.log('MediaRecorder created successfully:', {
        mimeType: this.mediaRecorder.mimeType,
        state: this.mediaRecorder.state,
        videoBitsPerSecond: this.getVideoBitrate(options.resolution),
        audioBitsPerSecond: 128000,
      });
    } catch (error) {
      console.error('Failed to create MediaRecorder:', error);
      throw new Error(`Failed to create MediaRecorder: ${error.message}`);
    }
  }

  private createComposedStream(options: RecordingOptions): MediaStream {
    const tracks: MediaStreamTrack[] = [];

    // Add video tracks based on mode
    if (options.mode === 'screen' || options.mode === 'screen-camera') {
      if (this.screenStream) {
        const videoTrack = this.screenStream.getVideoTracks()[0];
        if (videoTrack) {
          tracks.push(videoTrack);
          console.log('Added screen video track');
        }
      }
    }

    if (options.mode === 'camera') {
      if (this.cameraStream) {
        const videoTrack = this.cameraStream.getVideoTracks()[0];
        if (videoTrack) {
          tracks.push(videoTrack);
          console.log('Added camera video track');
        }
      }
    }

    // For screen-camera mode, we'll use screen as primary
    // Camera PiP would need canvas composition (more complex)

    // Add audio tracks
    if (this.screenStream && options.systemAudio) {
      const audioTracks = this.screenStream.getAudioTracks();
      audioTracks.forEach(track => {
        tracks.push(track);
        console.log('Added system audio track');
      });
    }

    if (this.microphoneStream && options.microphone) {
      const audioTracks = this.microphoneStream.getAudioTracks();
      audioTracks.forEach(track => {
        tracks.push(track);
        console.log('Added microphone audio track');
      });
    }

    if (tracks.length === 0) {
      throw new Error('No media tracks available for recording');
    }

    console.log('Creating MediaStream with', tracks.length, 'tracks');
    return new MediaStream(tracks);
  }

  private getVideoBitrate(resolution: string): number {
    switch (resolution) {
      case '480p':
        return 1500000; // 1.5 Mbps
      case '720p':
        return 3000000; // 3 Mbps
      case '1080p':
        return 6000000; // 6 Mbps
      default:
        return 3000000; // Default to 720p bitrate
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

  // Static method to check permissions before starting recording
  static async checkPermissions(mode: 'screen' | 'camera' | 'screen-camera', microphone: boolean = false): Promise<{
    camera: boolean;
    microphone: boolean;
    screenCapture: boolean;
  }> {
    const permissions = {
      camera: false,
      microphone: false,
      screenCapture: false,
    };

    try {
      // Check if we're on a secure context
      if (!window.isSecureContext) {
        return permissions;
      }

      if (!navigator.mediaDevices) {
        return permissions;
      }

      // Check camera permission
      if (mode === 'camera' || mode === 'screen-camera') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1, height: 1 },
            audio: false
          });
          stream.getTracks().forEach(track => track.stop());
          permissions.camera = true;
        } catch (error) {
          permissions.camera = false;
        }
      }

      // Check microphone permission
      if (microphone) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          });
          stream.getTracks().forEach(track => track.stop());
          permissions.microphone = true;
        } catch (error) {
          permissions.microphone = false;
        }
      }

      // Screen capture permission cannot be pre-checked
      // It requires user interaction and is granted on-demand
      permissions.screenCapture = !!(navigator.mediaDevices.getDisplayMedia);

    } catch (error) {
      console.error('Permission check failed:', error);
    }

    return permissions;
  }
}
