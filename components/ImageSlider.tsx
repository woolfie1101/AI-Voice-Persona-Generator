
import React from 'react';
import { ArtStyle } from '../types';

interface ImageSliderProps {
  styles: ArtStyle[];
}

const ImageSlider: React.FC<ImageSliderProps> = ({ styles }) => {
  // Duplicate the array for a seamless loop effect
  const imageList = [...styles, ...styles];

  return (
    <div className="w-full max-w-2xl mx-auto overflow-hidden relative mb-8 slider-container mask-image-horizontal">
      {/* Gradient overlays for fading effect */}
      <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-transparent z-10 transition-colors duration-300"></div>
      <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-gray-50 dark:from-gray-800 to-transparent z-10 transition-colors duration-300"></div>

      <div className="flex w-max animate-scroll">
        {imageList.map((style, index) => (
          <div key={`${style.id}-${index}`} className="flex-shrink-0 w-48 mx-2">
            <img
              src={style.imageUrl}
              alt={style.name}
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;