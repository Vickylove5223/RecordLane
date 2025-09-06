export class VideoTrimmingService {
  /**
   * Trim a video blob to the specified start and end times
   * @param blob - The video blob to trim
   * @param startTime - Start time in seconds
   * @param endTime - End time in seconds
   * @returns Promise<Blob> - The trimmed video blob
   */
  static async trimVideo(blob: Blob, startTime: number, endTime: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Create a video element to load the blob
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.crossOrigin = 'anonymous';
        
        video.onloadedmetadata = () => {
          try {
            // Validate trim times
            if (startTime < 0 || endTime > video.duration || startTime >= endTime) {
              reject(new Error('Invalid trim times'));
              return;
            }

            // Create a canvas to capture frames
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Create a MediaRecorder to record the trimmed portion
            const stream = canvas.captureStream(30); // 30 FPS
            const mediaRecorder = new MediaRecorder(stream, {
              mimeType: 'video/webm;codecs=vp9'
            });

            const chunks: Blob[] = [];
            let isRecording = false;
            
            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                chunks.push(event.data);
              }
            };

            mediaRecorder.onstop = () => {
              const trimmedBlob = new Blob(chunks, { type: 'video/webm' });
              URL.revokeObjectURL(video.src);
              resolve(trimmedBlob);
            };

            mediaRecorder.onerror = (error) => {
              URL.revokeObjectURL(video.src);
              reject(error);
            };

            // Function to draw video frames to canvas
            const drawFrame = () => {
              if (!isRecording || video.paused || video.ended) {
                return;
              }

              if (video.currentTime >= endTime) {
                // Stop recording when we reach the end time
                mediaRecorder.stop();
                video.pause();
                isRecording = false;
                return;
              }

              if (video.currentTime >= startTime && video.currentTime < endTime) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              }
              
              requestAnimationFrame(drawFrame);
            };

            video.onplay = () => {
              if (!isRecording) {
                isRecording = true;
                mediaRecorder.start();
              }
              drawFrame();
            };

            video.onerror = (error) => {
              URL.revokeObjectURL(video.src);
              reject(new Error('Video playback error: ' + error));
            };

            // Set video to start time and play
            video.currentTime = startTime;
            video.play();

          } catch (error) {
            URL.revokeObjectURL(video.src);
            reject(error);
          }
        };

        video.onerror = (error) => {
          URL.revokeObjectURL(video.src);
          reject(new Error('Video loading error: ' + error));
        };

        // Load the video
        video.src = URL.createObjectURL(blob);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get video duration from a blob
   * @param blob - The video blob
   * @returns Promise<number> - Duration in seconds
   */
  static async getVideoDuration(blob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = () => {
        reject(new Error('Could not load video metadata'));
        URL.revokeObjectURL(video.src);
      };
      
      video.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Create a thumbnail from a video blob at a specific time
   * @param blob - The video blob
   * @param time - Time in seconds to capture thumbnail
   * @returns Promise<string> - Data URL of the thumbnail
   */
  static async createThumbnail(blob: Blob, time: number = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        video.currentTime = time;
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL);
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = () => {
        reject(new Error('Could not create thumbnail'));
        URL.revokeObjectURL(video.src);
      };
      
      video.src = URL.createObjectURL(blob);
    });
  }
}
