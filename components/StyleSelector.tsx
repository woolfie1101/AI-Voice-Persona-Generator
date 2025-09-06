import React, { useState, useRef } from 'react';
import { ART_STYLES } from '../constants';
import { ArtStyle } from '../types';

interface StyleSelectorProps {
  onStyleSelect: (style: ArtStyle) => void;
  onStyleImageSelect: (file: File) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ onStyleSelect, onStyleImageSelect }) => {
  const [customStyle, setCustomStyle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomSubmit = () => {
    if (customStyle.trim()) {
      const customArtStyle: ArtStyle = {
        id: 'custom',
        name: 'Custom Style',
        imageUrl: '', // No image for custom style
        promptFragment: customStyle.trim(),
      };
      onStyleSelect(customArtStyle);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onStyleImageSelect(file);
    }
  };
  
  return (
    <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
        Choose Your Art Style
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Select a style that best represents your persona.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {ART_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onStyleSelect(style)}
            className="group relative overflow-hidden rounded-lg shadow-lg transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50"
          >
            <img src={style.imageUrl} alt={style.name} className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-all duration-300"></div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/70 to-transparent">
              <h3 className="text-white font-semibold text-lg">{style.name}</h3>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Or Create Your Own</h3>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept="image/*"
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={customStyle}
            onChange={(e) => setCustomStyle(e.target.value)}
            placeholder="e.g., watercolor painting, retro pixel art"
            className="flex-grow px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300"
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
          />
          <button
            onClick={handleCustomSubmit}
            disabled={!customStyle.trim()}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Generate Custom
          </button>
        </div>
        <div className="mt-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
          >
            Upload Style Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default StyleSelector;