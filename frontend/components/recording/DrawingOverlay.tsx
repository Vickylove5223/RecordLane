import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DrawingOverlayProps {
  enabled: boolean;
  onDisable?: () => void;
}

export default function DrawingOverlay({ enabled, onDisable }: DrawingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const getPointFromEvent = useCallback((event: MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return null;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((event: MouseEvent | TouchEvent) => {
    if (!enabled || !canvasRef.current) return;
    
    event.preventDefault();
    setIsDrawing(true);
    const point = getPointFromEvent(event);
    if (point) {
      setLastPoint(point);
    }
  }, [enabled, getPointFromEvent]);

  const draw = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDrawing || !enabled || !canvasRef.current || !lastPoint) return;
    
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const currentPoint = getPointFromEvent(event);
    if (!currentPoint) return;
    
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();
    
    setLastPoint(currentPoint);
  }, [isDrawing, enabled, lastPoint, getPointFromEvent]);

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

    // Add event listeners with proper cleanup
    const handleMouseDown = (e: MouseEvent) => startDrawing(e);
    const handleMouseMove = (e: MouseEvent) => draw(e);
    const handleMouseUp = () => stopDrawing();
    const handleTouchStart = (e: TouchEvent) => startDrawing(e);
    const handleTouchMove = (e: TouchEvent) => draw(e);
    const handleTouchEnd = () => stopDrawing();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    
    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
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
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled, onDisable, clearCanvas]);

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
        touchAction: 'none', // Prevent scrolling on touch devices
      }}
    />
  );
}
