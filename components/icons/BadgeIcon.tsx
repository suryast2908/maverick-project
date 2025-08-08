
import React from 'react';

const BadgeIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12.001 2.56a1.5 1.5 0 01.996.398l7.154 5.418a1.5 1.5 0 01.55 1.322v5.36a1.5 1.5 0 01-.55 1.322l-7.154 5.418a1.5 1.5 0 01-1.992 0l-7.154-5.418a1.5 1.5 0 01-.55-1.322v-5.36a1.5 1.5 0 01.55-1.322l7.154-5.418a1.5 1.5 0 01.996-.398zm0 2.12a.5.5 0 00-.332.132L4.516 9.516a.5.5 0 00-.183.44V14.01a.5.5 0 00.183.44l7.153 5.404a.5.5 0 00.664 0l7.153-5.404a.5.5 0 00.183-.44V9.956a.5.5 0 00-.183-.44L12.332 4.812a.5.5 0 00-.331-.132z" clipRule="evenodd" />
    <path d="M10.875 10.875a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" />
    <path fillRule="evenodd" d="M9.814 13.352a.75.75 0 011.06 0l1.166 1.167 2.13-2.13a.75.75 0 011.06 1.06l-2.66 2.66a.75.75 0 01-1.06 0l-1.696-1.695a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
);

export default BadgeIcon;
