
import React from 'react';
import { ProgressStep, ProgressStatus } from '../types';

interface ProgressBarProps {
  steps: ProgressStep[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ steps }) => {
  const getStatusClasses = (status: ProgressStatus) => {
    switch (status) {
      case ProgressStatus.COMPLETED:
        return 'bg-green-500 border-green-400';
      case ProgressStatus.IN_PROGRESS:
        return 'bg-yellow-500 border-yellow-400 animate-pulse';
      case ProgressStatus.PENDING:
        return 'bg-gray-500 dark:bg-gray-600 border-gray-400 dark:border-gray-500';
      default:
        return 'bg-gray-500 dark:bg-gray-600 border-gray-400 dark:border-gray-500';
    }
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="relative group flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition-colors duration-300 border-2 ${getStatusClasses(step.status)}`}
              >
                {step.status === ProgressStatus.COMPLETED ? '✓' : index + 1}
              </div>
              <div className="absolute bottom-full mb-2 w-48 bg-gray-900 text-white text-xs rounded py-2 px-3 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none left-1/2 -translate-x-1/2 z-10 border border-gray-700">
                <p className="font-bold text-base">{step.name}</p>
                {step.details && <p className="mt-1 text-gray-300">{step.details}</p>}
                {step.timestamp && <p className="text-xs text-gray-400 mt-1">{step.timestamp}</p>}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-900"></div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-auto h-1 transition-colors duration-500 ${index < steps.findIndex(s => s.status !== ProgressStatus.COMPLETED) -1 || steps.every(s => s.status === ProgressStatus.COMPLETED) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {steps.map((step, index) => (
          <div key={index} className="text-center text-xs text-gray-500 dark:text-gray-400 w-24">
            {step.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
