import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DrawingOverlayProps {
  enabled: boolean;
  onDisable?: () => void;
}

export default function DrawingOverlay({ enabled, onDisable }: DrawingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  const startDrawing = useCallback((event: MouseEvent) => {
    if (!enabled || !canvasRef.current) return;
    
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setLastPoint({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }, [enabled]);

  const draw = useCallback((event: MouseEvent) => {
    if (!isDrawing || !enabled || !canvasRef.current || !lastPoint) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();
    
    setLastPoint(currentPoint);
  }, [isDrawing, enabled, lastPoint]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
  }, []);

  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!enabled) {
      // Cleanup if disabled
      canvas.removeEventListener('mousedown', startDrawing);
      document.removeEventListener('mousemove', draw);
      document.removeEventListener('mouseup', stopDrawing);
      clearCanvas();
      return;
    }

    // Set up canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    // Add event listeners
    canvas.addEventListener('mousedown', startDrawing);
    document.addEventListener('mousemove', draw);
    document.addEventListener('mouseup', stopDrawing);
    
    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (ctx) {
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Handle escape key to disable drawing
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDisable?.();
      } else if (event.key === 'c' && (event.ctrlKey || event.metaKey)) {
        clearCanvas();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      document.removeEventListener('mousemove', draw);
      document.removeEventListener('mouseup', stopDrawing);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled, startDrawing, draw, stopDrawing, onDisable, clearCanvas]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`drawing-overlay ${enabled ? 'active' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: enabled ? 'auto' : 'none',
        zIndex: 9998,
        cursor: enabled ? 'crosshair' : 'default',
      }}
    />
  );
}
