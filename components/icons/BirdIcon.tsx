import React from 'react';

const BirdIcon: React.FC<{ className?: string }> = ({ className = "h-8 w-8" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-label="Mavericks Logo"
  >
    <path d="M21.928,6.608,16.3,10.272a.5.5,0,0,1-.6,0L10.072,6.608a.5.5,0,0,1,0-.884l1.43-1.026a1,1,0,0,0,0-1.76L10.072,1.912a.5.5,0,0,1,0-.884L15.7,4.692a.5.5,0,0,1,.6,0l5.628,3.664a.5.5,0,0,1,0,.884Z"></path>
    <path d="M21.928,17.392,16.3,13.728a.5.5,0,0,0-.6,0L10.072,17.392a.5.5,0,0,0,0,.884l1.43,1.026a1,1,0,0,1,0,1.76l-1.43,1.026a.5.5,0,0,0,0,.884L15.7,19.308a.5.5,0,0,0,.6,0l5.628-3.664a.5.5,0,0,0,0-.884Z"></path>
    <path d="M12.7,13.272a.5.5,0,0,1-.6,0L2.072,8.088a.5.5,0,0,1,0-.884L7.7,3.54a.5.5,0,0,1,.6,0L13.928,7.2a.5.5,0,0,1,0,.884Z"></path>
  </svg>
);

export default BirdIcon;
