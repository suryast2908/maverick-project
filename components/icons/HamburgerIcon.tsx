
import React from 'react';

const HamburgerIcon: React.FC<{ isOpen: boolean; className?: string }> = ({ isOpen, className = "" }) => {
  const baseBarClass = "h-0.5 w-6 bg-current transition-all duration-300 ease-in-out";

  return (
    <div className={`flex flex-col justify-between w-6 h-5 ${className}`}>
      <span
        className={`${baseBarClass} ${
          isOpen ? "transform rotate-45 translate-y-[9px]" : ""
        }`}
      ></span>
      <span
        className={`${baseBarClass} ${
          isOpen ? "opacity-0" : "opacity-100"
        }`}
      ></span>
      <span
        className={`${baseBarClass} ${
          isOpen ? "transform -rotate-45 -translate-y-[9px]" : ""
        }`}
      ></span>
    </div>
  );
};

export default HamburgerIcon;
