import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Settings, Scissors, Download, Play, Pause, Zap } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { extractAudioData, detectSilence, Segment } from './utils/audioAnalyzer';
import { Waveform } from './components/Waveform';

// Types
type AppState = 'idle' | 'analyzing' | 'editing' | 'exporting';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('idle');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  
  // Parameters
  const [threshold, setThreshold] = useState(-30); // dB
  const [padding, setPadding] = useState(0.2); // seconds
  
  // Playback
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // FFmpeg
  const ffmpegRef = useRef(new FFmpeg());
  const [progress, setProgress] = useState(0);

  // --- Logic ---

  useEffect(() => {
    if (audioBuffer) {
      const newSegments = detectSilence(audioBuffer, threshold, 0.5, padding);
      setSegments(newSegments);
    }
  }, [threshold, padding, audioBuffer]);

  const handleFileDrop = async (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    let file: File | null = null;
    
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files[0];
    } else {
      file = e.target.files?.[0] || null;
    }

    if (file && (file.type.includes('video/mp4') || file.type.includes('video/quicktime'))) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setState('analyzing');

      try {
        const buffer = await extractAudioData(file);
        setAudioBuffer(buffer);
        setState('editing');
      } catch (error) {
        console.error("Analysis failed", error);
        alert("解析に失敗しました。");
        setState('idle');
      }
    }
  };

  // Smart Playback Logic (Skips silent parts)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Find if we are currently inside a "keep" segment
      const currentSeg = segments.find(s => video.currentTime >= s.start && video.currentTime < s.end);
      
      if (!currentSeg && segments.length > 0) {
        // We are in silence (or void), jump to next active segment
        const nextSeg = segments.find(s => s.start > video.currentTime);
        if (nextSeg) {
          video.currentTime = nextSeg.start;
        } else {
          // End of content
          video.pause();
          setIsPlaying(false);
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [segments]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleExport = async () => {
    if (!videoFile || segments.length === 0) return;
    setState('exporting');
    const ffmpeg = ffmpegRef.current;

    try {
      // Initialize FFmpeg (Load wasm)
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpeg.on('progress', ({ progress }) => setProgress(Math.round(progress * 100)));

      const inputName = 'input.mp4';
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Create filter complex for trimming
      // Note: Complex filter construction is needed for merging multiple segments
      // For this demo, we will create a concat file approach which is more stable for concatenation
      
      // Phase 1: Cut each segment
      const segmentFiles = [];
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const outName = `part_${i}.mp4`;
        // -ss (seek) before -i is faster. -t is duration.
        await ffmpeg.exec([
          '-ss', `${seg.start}`,
          '-i', inputName,
          '-t', `${seg.end - seg.start}`,
          '-c', 'copy', // Stream copy is fastest (no re-encoding)
          outName
        ]);
        segmentFiles.push(outName);
      }

      // Phase 2: Concat
      const listContent = segmentFiles.map(f => `file '${f}'`).join('\n');
      await ffmpeg.writeFile('list.txt', listContent);

      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-c', 'copy',
        'output.mp4'
      ]);

      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `processed_${videoFile.name}`;
      a.click();

    } catch (e) {
      console.error(e);
      alert("Export failed. Check console.");
    } finally {
      setState('editing');
      setProgress(0);
    }
  };

  // --- UI Components ---

  return (
    <div className="min-h-screen text-white p-8 flex flex-col items-center justify-center relative">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.1),transparent_50%)] pointer-events-none" />
      
      <header className="absolute top-8 left-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-cyan-500 rounded-full shadow-[0_0_20px_rgba(0,240,255,0.8)]" />
        <h1 className="text-2xl font-bold tracking-wider">SILENCE BREAKER</h1>
      </header>

      <AnimatePresence mode='wait'>
        
        {/* STATE: IDLE (Upload) */}
        {state === 'idle' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl"
          >
            <label 
              className="glass aspect-video rounded-2xl flex flex-col items-center justify-center cursor-pointer group hover:border-cyan-500/50 transition-all duration-500"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
            >
              <input type="file" className="hidden" accept="video/mp4,video/quicktime" onChange={handleFileDrop} />
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                <Upload className="w-10 h-10 text-cyan-400" />
              </div>
              <p className="mt-6 text-xl text-gray-300 font-light">Drag & Drop Video File</p>
              <p className="mt-2 text-sm text-gray-500">Supports MP4, MOV (ProRes/H.264)</p>
            </label>
          </motion.div>
        )}

        {/* STATE: ANALYZING */}
        {state === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <Zap className="w-16 h-16 text-yellow-400 animate-pulse" />
            <h2 className="mt-4 text-2xl font-bold">Analyzing Audio Frequency...</h2>
            <p className="text-gray-400">Extracting silence patterns</p>
          </motion.div>
        )}

        {/* STATE: EDITING / EXPORTING */}
        {(state === 'editing' || state === 'exporting') && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left: Preview */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass rounded-xl overflow-hidden shadow-2xl relative group aspect-video bg-black">
                <video 
                  ref={videoRef} 
                  src={videoUrl!} 
                  className="w-full h-full object-contain" 
                  onClick={togglePlay}
                />
                {/* Play Button Overlay */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10">
                       <Play className="w-8 h-8 ml-1 text-white" />
                    </div>
                  </div>
                )}
              </div>

              <Waveform 
                audioBuffer={audioBuffer} 
                segments={segments} 
                currentTime={currentTime}
                onSeek={(t) => { if(videoRef.current) videoRef.current.currentTime = t; }}
              />
              
              <div className="flex justify-between text-sm text-gray-400 font-mono">
                <span>{segments.length} Cuts Detected</span>
                <span>Original: {Math.floor(audioBuffer?.duration || 0)}s</span>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="glass rounded-xl p-6 space-y-8 h-fit">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-cyan-400">
                <Settings className="w-5 h-5" /> Parameters
              </h3>

              {/* Threshold Slider */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <label>Noise Threshold</label>
                  <span className="text-cyan-400">{threshold} dB</span>
                </div>
                <input 
                  type="range" min="-80" max="-10" step="1"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Padding Slider */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <label>Safety Padding</label>
                  <span className="text-cyan-400">{padding}s</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05"
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="pt-8 border-t border-white/10">
                {state === 'exporting' ? (
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-center text-sm text-cyan-400 animate-pulse">
                      Processing Video... {progress}%
                    </p>
                  </div>
                ) : (
                  <button 
                    onClick={handleExport}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold text-white shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    EXPORT VIDEO
                  </button>
                )}
                <p className="text-xs text-gray-500 text-center mt-4">
                  Processing happens entirely on your device. No uploads.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
