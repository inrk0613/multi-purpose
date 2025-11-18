export interface Segment {
  start: number;
  end: number;
  isSilent: boolean;
}

export const extractAudioData = async (videoFile: File): Promise<AudioBuffer> => {
  const arrayBuffer = await videoFile.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return await audioContext.decodeAudioData(arrayBuffer);
};

export const detectSilence = (
  audioBuffer: AudioBuffer,
  thresholdDB: number = -40,
  minSilenceDuration: number = 0.5,
  padding: number = 0.1
): Segment[] => {
  const rawData = audioBuffer.getChannelData(0); // Use first channel
  const sampleRate = audioBuffer.sampleRate;
  const samplesPerWindow = Math.floor(sampleRate * 0.05); // 50ms window
  
  let segments: Segment[] = [];
  let isCurrentlySilent = false;
  let silenceStart = 0;
  
  // 1. RMS Analysis Loop
  for (let i = 0; i < rawData.length; i += samplesPerWindow) {
    let sum = 0;
    const end = Math.min(i + samplesPerWindow, rawData.length);
    
    for (let j = i; j < end; j++) {
      sum += rawData[j] * rawData[j];
    }
    
    const rms = Math.sqrt(sum / (end - i));
    const db = 20 * Math.log10(rms);
    
    const isSilentFrame = db < thresholdDB;

    if (isSilentFrame && !isCurrentlySilent) {
      isCurrentlySilent = true;
      silenceStart = i / sampleRate;
    } else if (!isSilentFrame && isCurrentlySilent) {
      isCurrentlySilent = false;
      const silenceEnd = i / sampleRate;
      
      if (silenceEnd - silenceStart >= minSilenceDuration) {
        segments.push({ start: silenceStart, end: silenceEnd, isSilent: true });
      }
    }
  }

  // Check if ends with silence
  if (isCurrentlySilent) {
    const silenceEnd = rawData.length / sampleRate;
    if (silenceEnd - silenceStart >= minSilenceDuration) {
      segments.push({ start: silenceStart, end: silenceEnd, isSilent: true });
    }
  }

  // 2. Invert to find "Active" segments and apply padding
  const totalDuration = audioBuffer.duration;
  let activeSegments: Segment[] = [];
  let cursor = 0;

  segments.forEach(silence => {
    // Add active segment before silence
    if (silence.start > cursor) {
      activeSegments.push({
        start: Math.max(0, cursor - padding), // Apply padding overlap if needed (simplified here)
        end: Math.min(totalDuration, silence.start + padding),
        isSilent: false
      });
    }
    cursor = silence.end;
  });

  // Add final segment
  if (cursor < totalDuration) {
    activeSegments.push({
      start: Math.max(0, cursor - padding),
      end: totalDuration,
      isSilent: false
    });
  }

  // 3. Merge overlapping segments caused by padding
  if (activeSegments.length === 0) return [{ start: 0, end: totalDuration, isSilent: false }];

  const merged: Segment[] = [];
  let current = activeSegments[0];

  for (let i = 1; i < activeSegments.length; i++) {
    const next = activeSegments[i];
    if (current.end >= next.start) {
      current.end = Math.max(current.end, next.end);
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);

  return merged;
};
