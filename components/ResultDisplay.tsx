import React from 'react';
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

  const handleDownload = () => {
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
        link.download = 'ai-voice-persona.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Fallback to original download if canvas fails
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'ai-voice-persona.png';
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
      link.download = 'ai-voice-persona.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  const handleShare = () => {
    if (navigator.share) {
      // Create a blob from the base64 string
      fetch(imageUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'ai-voice-persona.png', { type: 'image/png' });
          navigator.share({
            title: 'My AI Voice Persona',
            text: 'Check out the character I generated from my voice!',
            files: [file],
          })
          .then(() => console.log('Successful share'))
          .catch((error) => console.log('Error sharing', error));
        });
    } else {
      alert("Sharing is not supported on your browser. You can download the image and share it manually.");
    }
  };


  return (
    <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-6">
        {generatorMode === 'persona' ? 'Here Is Your Persona!' : 'Meet Your Future Spouse!'}
      </h2>
      <div className="mb-6 rounded-lg overflow-hidden shadow-lg border-2 border-purple-500/50 max-w-sm mx-auto">
        <img 
          src={imageUrl} 
          alt="Generated AI Persona" 
          className="w-full h-auto object-contain"
        />
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
          Share
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
