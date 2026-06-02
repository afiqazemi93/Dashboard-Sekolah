import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Hand } from 'lucide-react';

interface TouchZoomImageProps {
  src: string;
  alt: string;
  className?: string;
  maxScale?: number;
}

export function TouchZoomImage({ src, alt, className = '', maxScale = 5 }: TouchZoomImageProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialTouchScaleRef = useRef(1);
  const lastTapRef = useRef<number>(0);

  // Reset zoom on src change
  useEffect(() => {
    handleReset();
  }, [src]);

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, maxScale));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const next = prev - 0.5;
      if (next <= 1) {
        setOffset({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  // Keep offset within bounds to prevent dragging completely out of view
  const clampOffset = (newX: number, newY: number, currentScale: number) => {
    if (!containerRef.current) return { x: newX, y: newY };
    const rect = containerRef.current.getBoundingClientRect();
    const maxOffsetW = (rect.width * (currentScale - 1)) / 2;
    const maxOffsetH = (rect.height * (currentScale - 1)) / 2;
    return {
      x: Math.max(-maxOffsetW, Math.min(maxOffsetW, newX)),
      y: Math.max(-maxOffsetH, Math.min(maxOffsetH, newY))
    };
  };

  // Dragging / Panning handlers (Mouse + Touch)
  const handleStart = (clientX: number, clientY: number) => {
    if (scale > 1) {
      isDraggingRef.current = true;
      startPanRef.current = { x: clientX - offset.x, y: clientY - offset.y };
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const newX = clientX - startPanRef.current.x;
    const newY = clientY - startPanRef.current.y;
    setOffset(clampOffset(newX, newY, scale));
  };

  const handleEnd = () => {
    isDraggingRef.current = false;
  };

  // Helper to calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchEvent) => {
    if (touches.touches.length < 2) return 0;
    const t1 = touches.touches[0];
    const t2 = touches.touches[1];
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  // Touch handlers for guestures (Pinch to zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      isDraggingRef.current = false;
      const dist = getTouchDistance(e);
      if (dist > 0) {
        initialTouchDistanceRef.current = dist;
        initialTouchScaleRef.current = scale;
      }
    } else if (e.touches.length === 1) {
      // Pan/Drag gesture
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistanceRef.current !== null) {
      // Scale pinch zoom
      const distance = getTouchDistance(e);
      if (distance > 0) {
        const factor = distance / initialTouchDistanceRef.current;
        const newScale = Math.min(Math.max(initialTouchScaleRef.current * factor, 1), maxScale);
        setScale(newScale);
        
        // Auto reset offset if scale becomes 1
        if (newScale <= 1) {
          setOffset({ x: 0, y: 0 });
        } else {
          setOffset(prev => clampOffset(prev.x, prev.y, newScale));
        }
      }
    } else if (e.touches.length === 1) {
      // Standard panning
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    initialTouchDistanceRef.current = null;
    handleEnd();
  };

  // Double tap to quick zoom in/out
  const handleDoubleTap = (clientX: number, clientY: number) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      if (scale > 1) {
        handleReset();
      } else {
        // Zoom in to 2.5x centered toward tap
        setScale(2.5);
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const targetX = (rect.width / 2 - (clientX - rect.left)) * 1.5;
          const targetY = (rect.height / 2 - (clientY - rect.top)) * 1.5;
          setOffset(clampOffset(targetX, targetY, 2.5));
        }
      }
    }
    lastTapRef.current = now;
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Top Touch Gesture Hints */}
      <div className="absolute top-2 w-full flex justify-center z-10 select-none pointer-events-none px-4">
        <div className="bg-slate-900/70 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/5">
          <Hand className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
          <span>Guna 2 jari untuk zoom • Tarik imej jika di-zoom</span>
        </div>
      </div>

      {/* Main Image Container */}
      <div 
        ref={containerRef}
        className="relative w-full bg-slate-950 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing rounded-xl h-[55vh] md:h-[65vh] touch-none"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => handleDoubleTap(e.clientX, e.clientY)}
      >
        <img
          src={src}
          alt={alt}
          draggable="false"
          loading="lazy"
          className={`max-w-full max-h-full object-contain pointer-events-none transition-transform duration-75 origin-center ${className}`}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
        />
      </div>

      {/* Manual Control Slider & Buttons */}
      <div className="w-full mt-4 flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3 rounded-2xl shadow-sm gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Skala Zoom</span>
          <span className="text-xs font-bold text-slate-800 bg-slate-200 px-2.5 py-0.5 rounded-full min-w-[50px] text-center">
            {scale.toFixed(1)}x
          </span>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 sm:p-2.5 bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= maxScale}
            className="p-2 sm:p-2.5 bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={scale === 1 && offset.x === 0 && offset.y === 0}
            className="p-2 sm:p-2.5 bg-slate-100 disabled:bg-slate-50 disabled:text-slate-300 border border-slate-200/60 text-slate-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
            title="Sediakan Semula"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[10px] sm:text-xs font-bold hidden sm:inline">Set Semula</span>
          </button>
        </div>
      </div>
    </div>
  );
}
