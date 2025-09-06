import React, { useState } from 'react';
import { DownloadIcon, ShareIcon, RedoIcon } from './Icons';
import StyleCarousel from './StyleCarousel';
import { ArtStyle, GeneratorMode } from '../types';

interface ResultDisplayProps {
  imageBase64: string;
  onCreateAgain: () => void;
  onStyleSelect: (style: ArtStyle) => void;
  onStyleImageSelect: (file: File) => void;
  selectedStyleId?: string;
  generatorMode: GeneratorMode | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ imageBase64, onCreateAgain, onStyleSelect, onStyleImageSelect, selectedStyleId, generatorMode }) => {
  const imageUrl = `data:image/png;base64,${imageBase64}`;
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const handleDownload = () => {
    const filenameBase = generatorMode === 'spouse' ? 'ai-voice-spouse' : 'ai-voice-persona';
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSide = 512;
      let newWidth, newHeight;

      if (img.naturalWidth > img.naturalHeight) {
        newWidth = maxSide;
        newHeight = (img.naturalHeight / img.naturalWidth) * maxSide;
      } else {
        newHeight = maxSide;
        newWidth = (img.naturalWidth / img.naturalHeight) * maxSide;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        const jpegUrl = canvas.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.href = jpegUrl;
        link.download = `${filenameBase}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Fallback to original download if canvas fails
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${filenameBase}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    img.onerror = () => {
      // Fallback on image load error
      alert("Could not process image for download. Downloading original file.");
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${filenameBase}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  const handleShare = async () => {
    const appUrl = 'https://ai-voice-persona-generator-889563220811.us-west1.run.app/';
    const textToCopy = generatorMode === 'spouse'
      ? `Check out the future spouse I created with the AI Voice Persona Generator!\n\nCreate your own here: ${appUrl}`
      : `Check out the character I created with the AI Voice Persona Generator!\n\nCreate your own here: ${appUrl}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2500);
    } catch (err) {
      console.error('Failed to copy link to clipboard:', err);
      alert('Failed to copy link. Please try again.');
    }
  };


  return (
    <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-6">
        {generatorMode === 'persona' ? 'Here Is Your Persona!' : 'Meet Your Future Spouse!'}
      </h2>
      <div className="relative mb-6 rounded-lg overflow-hidden shadow-lg border-2 border-purple-500/50 max-w-sm mx-auto">
        <img 
          src={imageUrl} 
          alt="Generated AI Persona" 
          className="w-full h-auto object-contain"
        />
        {showCopySuccess && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-opacity duration-300 animate-fade-in">
                <div className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 py-2 px-5 rounded-lg shadow-xl">
                    <p className="font-bold">Link copied to clipboard!</p>
                </div>
            </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
        <button
          onClick={handleDownload}
          className="group inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-colors duration-300"
        >
          <DownloadIcon className="w-5 h-5 mr-2" />
          Download
        </button>
        <button
          onClick={handleShare}
          className="group inline-flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-full transition-colors duration-300"
        >
          <ShareIcon className="w-5 h-5 mr-2" />
          Copy Link
        </button>
        <button
          onClick={onCreateAgain}
          className="group inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full transition-colors duration-300"
        >
          <RedoIcon className="w-5 h-5 mr-2" />
          Create Again
        </button>
      </div>

      {generatorMode === 'persona' && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Try a different style</h3>
          <StyleCarousel onStyleSelect={onStyleSelect} selectedStyleId={selectedStyleId} onStyleImageSelect={onStyleImageSelect} />
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;