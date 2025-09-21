import React from 'react';

const SimpleThemeToggle = () => {
  console.log('SimpleThemeToggle rendering...');
  
  const handleClick = () => {
    console.log('Simple button clicked!');
    
    // Test if we can toggle dark class manually
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      console.log('Removed dark class');
    } else {
      document.documentElement.classList.add('dark');
      console.log('Added dark class');
    }
    
    console.log('Current HTML classes:', document.documentElement.className);
  };
  
  return (
    <button
      onClick={handleClick}
      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200"
      style={{ border: '2px solid red' }} // Make it obvious
    >
      🌙/☀️ TOGGLE
    </button>
  );
};

export default SimpleThemeToggle;