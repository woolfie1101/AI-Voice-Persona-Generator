
import React from 'react';
import { MicIcon } from './Icons';
import { GeneratorMode } from '../types';
import ImageSlider from './ImageSlider';
import { ART_STYLES, SPOUSE_EXAMPLES } from '../constants';

interface LandingProps {
  onStart: (mode: GeneratorMode) => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-fade-in transition-colors duration-300">
      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
        AI Voice Persona Generator
      </h1>
      <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 max-w-lg mx-auto">
        Your voice is unique. Let's turn it into art. Choose a generator to begin your creative journey.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Persona Generator Card */}
        <div 
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col overflow-hidden"
        >
          <div className="w-full">
            <ImageSlider styles={ART_STYLES} showFades={false} imageHeightClass="h-48" />
          </div>
          <div className="p-8 flex flex-col items-center flex-grow text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">AI Voice Persona</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 flex-grow">Create a unique character image based on your voice and self-introduction.</p>
            <button
              onClick={() => onStart('persona')}
              className="group inline-flex items-center justify-center px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <MicIcon className="w-5 h-5 mr-2" />
              Start Persona
            </button>
          </div>
        </div>
        
        {/* Spouse Generator Card */}
        <div 
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col overflow-hidden"
        >
          <div className="w-full">
            <ImageSlider styles={SPOUSE_EXAMPLES} showFades={false} imageHeightClass="h-48" />
          </div>
          <div className="p-8 flex flex-col items-center flex-grow text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">Future Spouse Generator</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 flex-grow">Describe yourself and your preference, and let AI imagine your ideal partner.</p>
            <button
              onClick={() => onStart('spouse')}
              className="group inline-flex items-center justify-center px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <MicIcon className="w-5 h-5 mr-2" />
              Find My Spouse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
