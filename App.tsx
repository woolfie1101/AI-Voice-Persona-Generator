import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { AppState, ArtStyle, VoiceAnalysisResult } from './types';
import Landing from './components/Landing';
import Recorder from './components/Recorder';
import StyleSelector from './components/StyleSelector';
import LoadingScreen from './components/LoadingScreen';
import ResultDisplay from './components/ResultDisplay';
import ThemeToggle from './components/ThemeToggle';
import { analyzeVoice, generateCharacterImage, generateCharacterImageFromStyleImage } from './services/geminiService';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.START);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VoiceAnalysisResult | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') as 'light' | 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleStart = () => {
    setError(null);
    setAppState(AppState.RECORDING);
  };

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setAppState(AppState.STYLE_SELECTION);
  };

  const getAnalysisResult = useCallback(async (): Promise<VoiceAnalysisResult> => {
    if (analysisResult) {
      return analysisResult;
    }
    if (!audioBlob) {
      throw new Error("Audio data is missing. Please record again.");
    }
    const base64Audio = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        if (reader.result) {
          resolve((reader.result as string).split(',')[1]);
        } else {
          reject(new Error("Failed to read audio file."));
        }
      };
      reader.onerror = (error) => reject(error);
    });

    const newAnalysis = await analyzeVoice(base64Audio, audioBlob.type);
    setAnalysisResult(newAnalysis);
    return newAnalysis;
  }, [analysisResult, audioBlob]);
  
  const handleStyleSelection = useCallback(async (style: ArtStyle) => {
    setSelectedStyle(style);
    setAppState(AppState.GENERATING);
    setError(null);

    try {
      const currentAnalysis = await getAnalysisResult();
      const imageBase64 = await generateCharacterImage(currentAnalysis, style);
      setGeneratedImage(imageBase64);
      setAppState(AppState.RESULT);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      setAnalysisResult(null); 
      setAppState(AppState.START);
    }
  }, [getAnalysisResult]);

  const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const [header, data] = reader.result.split(',');
          if (!data) {
            reject(new Error("Failed to parse file data."));
            return;
          }
          resolve({ base64: data, mimeType: file.type });
        } else {
          reject(new Error("Failed to read image file."));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleStyleImageUpload = useCallback(async (file: File) => {
    setSelectedStyle(null); // Clear predefined style selection
    setAppState(AppState.GENERATING);
    setError(null);
    
    try {
      const currentAnalysis = await getAnalysisResult();
      const { base64, mimeType } = await fileToBase64(file);
      const imageBase64 = await generateCharacterImageFromStyleImage(currentAnalysis, { base64, mimeType });
      setGeneratedImage(imageBase64);
      setAppState(AppState.RESULT);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      setAnalysisResult(null); 
      setAppState(AppState.START);
    }
  }, [getAnalysisResult]);

  const handleCreateAgain = () => {
    setAudioBlob(null);
    setGeneratedImage('');
    setError(null);
    setAnalysisResult(null);
    setSelectedStyle(null);
    setAppState(AppState.START);
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center p-8 bg-red-100 dark:bg-red-900/50 rounded-lg">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">An Error Occurred</h2>
          <p className="text-red-600 dark:text-red-200 mb-6">{error}</p>
          <button
            onClick={handleCreateAgain}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    switch (appState) {
      case AppState.START:
        return <Landing onStart={handleStart} />;
      case AppState.RECORDING:
        return <Recorder onRecordingComplete={handleRecordingComplete} />;
      case AppState.STYLE_SELECTION:
        return <StyleSelector onStyleSelect={handleStyleSelection} onStyleImageSelect={handleStyleImageUpload} />;
      case AppState.GENERATING:
        return <LoadingScreen />;
      case AppState.RESULT:
        return (
          <ResultDisplay
            imageBase64={generatedImage}
            onCreateAgain={handleCreateAgain}
            onStyleSelect={handleStyleSelection}
            onStyleImageSelect={handleStyleImageUpload}
            selectedStyleId={selectedStyle?.id}
          />
        );
      default:
        return <Landing onStart={handleStart} />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300">
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <div className="w-full max-w-2xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;