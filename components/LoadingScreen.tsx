
import React from 'react';
import { useState, useEffect } from 'react';
import { LOADING_MESSAGES } from '../constants';

const LoadingScreen: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center h-96 transition-colors duration-300">
      <div className="w-16 h-16 border-4 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">Generating Your Persona...</h2>
      <p className="text-gray-500 dark:text-gray-400 text-lg transition-opacity duration-500">
        {LOADING_MESSAGES[messageIndex]}
      </p>
    </div>
  );
};

export default LoadingScreen;