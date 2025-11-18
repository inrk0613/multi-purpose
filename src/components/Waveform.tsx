import React, { useRef, useEffect } from 'react';
import { Segment } from '../utils/audioAnalyzer';

interface WaveformProps {
  audioBuffer: AudioBuffer | null;
  segments: Segment[];
  currentTime: number;
  onSeek: (time: number) => void;
}

export const Waveform: React.FC<WaveformProps> = ({ audioBuffer, segments, currentTime, onSeek }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !audioBuffer) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Draw Logic
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Base Waveform
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();

    // 2. Highlight Active Segments (The "Keep" parts)
    segments.forEach(seg => {
      if (seg.isSilent) return;
      
      const startX = (seg.start / audioBuffer.duration) * width;
      const endX = (seg.end / audioBuffer.duration) * width;
      const segWidth = endX - startX;

      // Gradient for active parts
      const gradient = ctx.createLinearGradient(startX, 0, endX, 0);
      gradient.addColorStop(0, '#00f0ff');
      gradient.addColorStop(1, '#00aaff');
      
      ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
      ctx.fillRect(startX, 0, segWidth, height);

      // Redraw wave specifically for active part to make it pop
      ctx.beginPath();
      ctx.strokeStyle = '#00f0ff';
      for (let i = startX; i < endX; i++) {
        const index = Math.floor((i / width) * data.length);
         // Simplified re-draw for performance
         const datum = data[index];
         ctx.moveTo(i, (1 + datum) * amp);
         ctx.lineTo(i, (1 + datum) * amp + 1); // simple dot representation
      }
      ctx.stroke();
    });

    // 3. Draw Playhead
    const playheadX = (currentTime / audioBuffer.duration) * width;
    ctx.beginPath();
    ctx.strokeStyle = '#ff003c';
    ctx.lineWidth = 2;
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
    
    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff003c';
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [audioBuffer, segments, currentTime]);

  const handleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || !audioBuffer) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * audioBuffer.duration;
    onSeek(time);
  };

  return (
    <div className="w-full h-32 bg-black/50 rounded-lg overflow-hidden cursor-pointer border border-white/10 relative">
      <canvas ref={canvasRef} className="w-full h-full" onClick={handleClick} />
    </div>
  );
};
