import React from 'react';

interface CardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, icon, children, className = '', headerActions }) => {
  return (
    <div className={`rounded-2xl p-[2px] bg-gradient-to-br from-blue-500/10 to-purple-500/10 via-transparent group hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 ${className}`}>
        <div className={`bg-white dark:bg-[#161b22] rounded-[15px] h-full overflow-hidden`}>
            {/* Card Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full text-blue-500 dark:text-blue-300">
                    {icon}
                </div>
                <h3 className="text-lg font-bold text-gradient">{title}</h3>
              </div>
              {headerActions && <div>{headerActions}</div>}
            </div>
            {/* Card Body */}
            <div className="p-6">
              {children}
            </div>
        </div>
    </div>
  );
};

export default Card;
