
import React from 'react';

const TrophyIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6.75A2.25 2.25 0 0111.25 4.5h1.5A2.25 2.25 0 0115 6.75V19" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 11c0-1.657 1.343-3 3-3s3 1.343 3 3" />
  </svg>
);

export default TrophyIcon;
