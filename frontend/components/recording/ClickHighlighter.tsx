import React, { useEffect, useCallback } from 'react';

interface ClickHighlighterProps {
  enabled: boolean;
}

export default function ClickHighlighter({ enabled }: ClickHighlighterProps) {
  const createClickEffect = useCallback((x: number, y: number) => {
    const highlight = document.createElement('div');
    highlight.className = 'click-highlight';
    highlight.style.left = `${x - 20}px`;
    highlight.style.top = `${y - 20}px`;
    
    document.body.appendChild(highlight);
    
    // Remove the element after animation completes
    setTimeout(() => {
      if (highlight.parentNode) {
        highlight.parentNode.removeChild(highlight);
      }
    }, 600);
  }, []);

  const handleClick = useCallback((event: MouseEvent) => {
    if (!enabled) return;
    
    createClickEffect(event.clientX, event.clientY);
  }, [enabled, createClickEffect]);

  useEffect(() => {
    if (!enabled) return;

    // Add click listener to document
    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [enabled, handleClick]);

  return null; // This component doesn't render anything visible
}
