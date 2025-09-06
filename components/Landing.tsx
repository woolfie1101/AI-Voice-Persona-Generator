
import React from 'react';
import { MicIcon } from './Icons';
import { ART_STYLES } from '../constants';
import ImageSlider from './ImageSlider';

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-fade-in transition-colors duration-300">
      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
        AI Voice Persona Generator
      </h1>
      <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 max-w-md mx-auto">
        Discover your inner persona. Create a unique character from your voice and self-introduction in under a minute.
      </p>
      
      <ImageSlider styles={ART_STYLES} />

      <button
        onClick={onStart}
        className="group inline-flex items-center justify-center px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        <MicIcon className="w-6 h-6 mr-3 transition-transform duration-300 group-hover:rotate-12" />
        Create My Character
      </button>
    </div>
  );
};

export default Landing;