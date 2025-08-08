import React from 'react';

const RouteIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 12a4 4 0 108 0 4 4 0 00-8 0zm0 0v-2.5a2.5 2.5 0 115 0V12m-2.5 5.5l-1.41-1.41" />
    </svg>
);

export default RouteIcon;
