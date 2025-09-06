
import React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { MicIcon, StopIcon } from './Icons';
import { GeneratorMode } from '../types';

interface RecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  generatorMode: GeneratorMode | null;
}

const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete, generatorMode }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const isPersonaMode = generatorMode === 'persona';

  const visualize = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const isDarkMode = document.documentElement.classList.contains('dark');
      canvasCtx.fillStyle = isDarkMode ? 'rgb(31, 29, 41)' : 'rgb(243, 244, 246)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        
        const r = barHeight + 25 * (i/bufferLength);
        const g = 250 * (i/bufferLength);
        const b = 50;

        canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
        canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
      }
    };
    draw();
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
      }
      visualize();

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Stop mic access
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTimer(0);
      timerIntervalRef.current = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError("Microphone access denied. Please allow microphone access in your browser settings.");
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  return (
    <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center transition-colors duration-300">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
        {isPersonaMode ? 'Record Your Introduction' : 'Describe Yourself & Preference'}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-lg">
        {isPersonaMode 
          ? 'Introduce yourself for 15-30 seconds. State your age, gender, MBTI, race/ethnicity, job, and hobbies for a more detailed persona.'
          : 'For 15-30 seconds, describe yourself (personality, hobbies, values) and state the desired gender of your future spouse (e.g., "I\'m looking for a man/woman").'
        }
      </p>

      <div className="text-left text-sm text-gray-600 dark:text-gray-500 bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg mb-6 max-w-lg w-full">
          <p className="font-semibold text-gray-700 dark:text-gray-400">Example:</p>
          {isPersonaMode ? (
            <p className="italic">"I am a 32-year-old male, my MBTI is ENTJ, I am Asian, and I work as a software developer. I enjoy traveling."</p>
          ) : (
            <p className="italic">"I'm looking for a woman. I'm a quiet person who loves reading, hiking on weekends, and values honesty and a good sense of humor."</p>
          )}

          {isPersonaMode ? (
            <p className="mt-2 text-yellow-600/80 dark:text-yellow-400/80">
                You can start with the topics in the example, but feel free to add any other details about your personality, appearance, or anything else that describes you. The more you share, the more unique your character will be!
            </p>
          ) : (
             <p className="mt-2 text-yellow-600/80 dark:text-yellow-400/80">
                Don't worry if you forget to mention a gender; our AI can get creative! The more you share about yourself, the better it can imagine a suitable partner for you.
            </p>
          )}
      </div>
      
      <div className="w-full h-24 bg-transparent rounded-lg mb-6 overflow-hidden">
        <canvas ref={canvasRef} width="600" height="100" className="w-full h-full"></canvas>
      </div>

      {error && <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>}

      <div className="text-4xl font-mono mb-6 text-gray-700 dark:text-gray-200">{formatTime(timer)}</div>

      {!isRecording ? (
        <button
          onClick={startRecording}
          className="group flex items-center justify-center w-24 h-24 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
          aria-label="Start Recording"
        >
          <MicIcon className="w-10 h-10" />
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="group flex items-center justify-center w-24 h-24 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg animate-pulse"
          aria-label="Stop Recording"
        >
          <StopIcon className="w-10 h-10" />
        </button>
      )}
    </div>
  );
};

export default Recorder;
