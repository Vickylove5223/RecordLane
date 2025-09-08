import React from 'react';
import VideoPreviewPage from '../preview/VideoPreviewPage';

interface VideoModalProps {
  recording: any;
  onClose: () => void;
}

export default function VideoModal({ recording, onClose }: VideoModalProps) {
  return (
    <VideoPreviewPage 
      recording={recording} 
      onClose={onClose} 
    />
  );
}
