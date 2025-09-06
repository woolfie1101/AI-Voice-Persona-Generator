import React, { useRef } from 'react';
import { ART_STYLES } from '../constants';
import { ArtStyle } from '../types';
import { UploadIcon } from './Icons';

interface StyleCarouselProps {
  onStyleSelect: (style: ArtStyle) => void;
  onStyleImageSelect: (file: File) => void;
  selectedStyleId?: string;
}

const StyleCarousel: React.FC<StyleCarouselProps> = ({ onStyleSelect, onStyleImageSelect, selectedStyleId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onStyleImageSelect(file);
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*"
      />
      <div className="flex space-x-4 overflow-x-auto py-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800 -mx-8 px-8">
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload a style image"
          className="group relative flex-shrink-0 w-28 h-36 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none ring-2 ring-dashed ring-gray-400 dark:ring-gray-500 hover:ring-purple-500 bg-gray-100 dark:bg-gray-700/50 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-white"
        >
          <UploadIcon className="w-8 h-8 mb-2" />
          <span className="font-semibold text-xs text-center">Upload Style</span>
        </button>
        {ART_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onStyleSelect(style)}
            aria-label={`Select ${style.name} style`}
            className={`
              group relative flex-shrink-0 w-28 h-36 rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none 
              ${selectedStyleId === style.id ? 'ring-4 ring-purple-500 scale-105' : 'ring-2 ring-transparent hover:ring-purple-500/50'}
            `}
          >
            <img src={style.imageUrl} alt={style.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-all duration-300"></div>
            <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black via-black/70 to-transparent">
              <h3 className="text-white font-semibold text-xs text-center">{style.name}</h3>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleCarousel;