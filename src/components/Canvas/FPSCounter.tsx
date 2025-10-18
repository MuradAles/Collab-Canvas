/**
 * FPS Counter Component
 * Displays real-time FPS (frames per second) to monitor canvas performance
 */

import { useEffect, useRef, useState } from 'react';

export function FPSCounter() {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const updateFPS = () => {
      frameCountRef.current++;
      
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTimeRef.current;
      
      // Update FPS every second
      if (deltaTime >= 1000) {
        const currentFPS = Math.round((frameCountRef.current * 1000) / deltaTime);
        setFps(currentFPS);
        
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }
      
      rafIdRef.current = requestAnimationFrame(updateFPS);
    };
    
    rafIdRef.current = requestAnimationFrame(updateFPS);
    
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Color-code the FPS: green (60+), yellow (30-59), red (<30)
  const getFPSColor = () => {
    if (fps >= 60) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="absolute top-4 right-70 z-50 bg-theme-surface/90 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-theme dark:border-gray-700">
      <div className="flex items-center gap-2">
        <span className="text-theme-secondary dark:text-gray-300 text-sm font-medium">FPS:</span>
        <span className={`text-lg font-bold ${getFPSColor()}`}>
          {fps}
        </span>
      </div>
    </div>
  );
}

