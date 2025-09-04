import React, { useEffect, useState } from 'react';

interface ScreenshotFlashProps {
  trigger: boolean;
  onComplete?: () => void;
}

export default function ScreenshotFlash({ trigger, onComplete }: ScreenshotFlashProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!show) return null;

  return <div className="screenshot-flash" />;
}
