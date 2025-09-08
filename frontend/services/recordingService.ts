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
  private dataAvailableTimeout?: NodeJS.Timeout;
  private recordingStartPromise?: Promise<void>;

  async startRecording(options: RecordingOptions): Promise<void> {
    try {
      console.log('Starting recording with options:', options);
      
      // Reset state
      this.recordedChunks = [];
      this.retryAttempts = 0;
      this.isRecording = false;
      this.startTime = Date.now();
      
      // Clear any existing timeout
      if (this.dataAvailableTimeout) {
        clearTimeout(this.dataAvailableTimeout);
        this.dataAvailableTimeout = undefined;
      }
      
      if (!this.checkBrowserSupport()) {
        throw ErrorHandler.createError('BROWSER_NOT_SUPPORTED', ERROR_MESSAGES.BROWSER_NOT_SUPPORTED);
      }

      await this.checkAndRequestPermissions(options);
      await this.setupStreams(options);
      await this.setupMediaRecorder(options);
      
      if (this.mediaRecorder) {
        // Set up data available handler with better timing
        this.mediaRecorder.ondataavailable = (event) => {
          console.log('Data available:', {
            dataSize: event.data.size,
            type: event.data.type,
            timestamp: Date.now() - this.startTime,
            totalChunks: this.recordedChunks.length,
          });
          
          if (event.data && event.data.size > 0) {
            this.recordedChunks.push(event.data);
            console.log('Chunk added:', {
              chunkIndex: this.recordedChunks.length - 1,
              chunkSize: event.data.size,
              totalSize: this.getTotalSize(),
              totalChunks: this.recordedChunks.length,
            });
          } else {
            console.warn('Received empty data chunk');
          }
        };

        this.mediaRecorder.onstart = () => {
          console.log('MediaRecorder started successfully');
          this.isRecording = true;
          
          // Set up a fallback timeout to ensure we get data
          this.dataAvailableTimeout = setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
              console.log('Requesting data manually after timeout');
              try {
                this.mediaRecorder.requestData();
              } catch (error) {
                console.warn('Failed to request data manually:', error);
              }
            }
          }, 5000); // Request data after 5 seconds if none received
        };

        this.mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          ErrorHandler.logError('mediarecorder-runtime-error', event);
          
          // Clear timeout on error
          if (this.dataAvailableTimeout) {
            clearTimeout(this.dataAvailableTimeout);
            this.dataAvailableTimeout = undefined;
          }
        };

        this.mediaRecorder.onstop = () => {
          console.log('MediaRecorder stopped');
          this.isRecording = false;
          
          // Clear timeout when stopped
          if (this.dataAvailableTimeout) {
            clearTimeout(this.dataAvailableTimeout);
            this.dataAvailableTimeout = undefined;
          }
        };

        // Start recording with smaller timeslice for more frequent data events
        console.log('Starting MediaRecorder with timeslice...');
        this.mediaRecorder.start(100); // 100ms timeslice for more frequent data events
        
        // Also request data periodically to ensure we get chunks
        const dataRequestInterval = setInterval(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            try {
              this.mediaRecorder.requestData();
            } catch (error) {
              console.warn('Failed to request data:', error);
            }
          } else {
            clearInterval(dataRequestInterval);
          }
        }, 1000); // Request data every second

        console.log('Recording started successfully');
      } else {
        throw new Error('MediaRecorder not initialized');
      }
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      ErrorHandler.logError('recording-start', error, { options });
      this.cleanup();
      
      // Clear timeout on error
      if (this.dataAvailableTimeout) {
        clearTimeout(this.dataAvailableTimeout);
        this.dataAvailableTimeout = undefined;
      }
      
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
      if (!window.isSecureContext) {
        throw ErrorHandler.createError('SECURITY_ERROR', 'Recording requires a secure context (HTTPS). Please use HTTPS or localhost.');
      }

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
      }, 15000);

      let dataCollectionComplete = false;
      let finalDataReceived = false;

      const finalizeRecording = () => {
        if (dataCollectionComplete) return;
        dataCollectionComplete = true;
        
        clearTimeout(timeout);
        
        // Clear data request timeout
        if (this.dataAvailableTimeout) {
          clearTimeout(this.dataAvailableTimeout);
          this.dataAvailableTimeout = undefined;
        }
        
        try {
          console.log('Finalizing recording with chunks:', {
            totalChunks: this.recordedChunks.length,
            totalSize: this.getTotalSize(),
            duration: Date.now() - this.startTime,
            finalDataReceived,
          });
          
          if (this.recordedChunks.length === 0) {
            reject(ErrorHandler.createError('NO_DATA', 'No recording data available - recording may have failed to start properly'));
            return;
          }

          const mimeType = this.getOptimalMimeType();
          console.log('Creating blob with MIME type:', mimeType);
          
          // Validate chunks before creating blob
          const validChunks = this.recordedChunks.filter(chunk => chunk && chunk.size > 0);
          console.log('Valid chunks:', validChunks.length, 'of', this.recordedChunks.length);
          
          if (validChunks.length === 0) {
            reject(ErrorHandler.createError('NO_VALID_DATA', 'No valid recording data chunks available'));
            return;
          }

          const blob = new Blob(validChunks, { type: mimeType });
          
          console.log('Created blob:', {
            size: blob.size,
            type: blob.type,
            chunkCount: validChunks.length,
            duration: Date.now() - this.startTime,
          });
          
          if (blob.size === 0) {
            reject(ErrorHandler.createError('EMPTY_RECORDING', 'Recording is empty - no data was captured'));
            return;
          }
          
          // Validate blob can be used
          try {
            const url = URL.createObjectURL(blob);
            URL.revokeObjectURL(url); // Clean up immediately
            console.log('Blob validation successful');
          } catch (blobError) {
            console.error('Blob validation failed:', blobError);
            reject(ErrorHandler.createError('INVALID_BLOB', 'Created blob is invalid'));
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

      // Enhanced data available handler for final collection
      const originalDataHandler = this.mediaRecorder.ondataavailable;
      this.mediaRecorder.ondataavailable = (event) => {
        console.log('Final data chunk:', {
          size: event.data.size,
          type: event.data.type,
          isFinal: true,
        });
        
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          finalDataReceived = true;
        }
        
        // Also call original handler if it exists
        if (originalDataHandler) {
          originalDataHandler(event);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, waiting for final data...');
        // Give a short delay for any final data chunks
        setTimeout(() => {
          finalizeRecording();
        }, 100);
      };

      this.mediaRecorder.onerror = (event) => {
        clearTimeout(timeout);
        console.error('MediaRecorder error during stop:', event);
        ErrorHandler.logError('recording-stop-error', event);
        reject(ErrorHandler.createError('STOP_ERROR', 'Error stopping recording'));
      };

      try {
        console.log('Stopping MediaRecorder...');
        
        // Request final data before stopping
        if (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused') {
          try {
            this.mediaRecorder.requestData();
            console.log('Requested final data before stop');
          } catch (requestError) {
            console.warn('Failed to request final data:', requestError);
          }
        }
        
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        } else {
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
        console.log('Selected MIME type:', mimeType);
        return mimeType;
      }
    }

    console.log('Using fallback MIME type: video/webm');
    return 'video/webm';
  }

  cleanup(): void {
    try {
      console.log('Cleaning up recording service');

      // Clear data request timeout
      if (this.dataAvailableTimeout) {
        clearTimeout(this.dataAvailableTimeout);
        this.dataAvailableTimeout = undefined;
      }

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.stop();
        } catch (error) {
          console.warn('Error stopping MediaRecorder during cleanup:', error);
        }
      }

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

    if (options.mode === 'screen' || options.mode === 'screen-camera') {
      await this.getScreenStream(options);
    }

    if (options.mode === 'camera' || options.mode === 'screen-camera') {
      await this.getCameraStream(options);
    }

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
        audio: false,
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
    this.composedStream = this.createComposedStream(options);
    
    if (!this.composedStream) {
      throw new Error('Failed to create composed stream');
    }

    console.log('Composed stream created:', {
      videoTracks: this.composedStream.getVideoTracks().length,
      audioTracks: this.composedStream.getAudioTracks().length,
    });

    const mimeType = this.getOptimalMimeType();
    console.log('Selected MIME type:', mimeType);

    if (!MediaRecorder.isTypeSupported(mimeType)) {
      throw new Error(`MIME type ${mimeType} is not supported`);
    }

    try {
      const recorderOptions = {
        mimeType,
        videoBitsPerSecond: this.getVideoBitrate(options.resolution),
        audioBitsPerSecond: 128000,
      };

      this.mediaRecorder = new MediaRecorder(this.composedStream, recorderOptions);

      console.log('MediaRecorder created successfully:', {
        mimeType: this.mediaRecorder.mimeType,
        state: this.mediaRecorder.state,
        videoBitsPerSecond: recorderOptions.videoBitsPerSecond,
        audioBitsPerSecond: recorderOptions.audioBitsPerSecond,
      });
    } catch (error) {
      console.error('Failed to create MediaRecorder:', error);
      throw new Error(`Failed to create MediaRecorder: ${error.message}`);
    }
  }

  private createComposedStream(options: RecordingOptions): MediaStream {
    const tracks: MediaStreamTrack[] = [];

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
        return 1500000;
      case '720p':
        return 3000000;
      case '1080p':
        return 6000000;
      default:
        return 3000000;
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
      if (!window.isSecureContext) {
        return permissions;
      }

      if (!navigator.mediaDevices) {
        return permissions;
      }

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

      permissions.screenCapture = !!(navigator.mediaDevices.getDisplayMedia);

    } catch (error) {
      console.error('Permission check failed:', error);
    }

    return permissions;
  }
}
