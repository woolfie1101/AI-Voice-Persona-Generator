import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full max-w-2xl mx-auto text-center py-6 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex justify-center items-center space-x-4 mb-2">
        <a 
          href="https://www.linkedin.com/in/joohee-kim-077740347/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-purple-500 transition-colors"
          aria-label="Joohee Kim's LinkedIn Profile"
        >
          LinkedIn
        </a>
        <span aria-hidden="true">|</span>
        <a 
          href="mailto:woolfie1101@gmail.com" 
          className="hover:text-purple-500 transition-colors"
          aria-label="Email Joohee Kim"
        >
          Email : woolfie1101@gmail.com
        </a>
      </div>
      <p>&copy; 2025 Kim Joohee. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
